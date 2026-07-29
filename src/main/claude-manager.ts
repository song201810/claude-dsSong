// src/main/claude-manager.ts
import { spawn, IPty } from 'node-pty'
import { BrowserWindow } from 'electron'
import { execSync } from 'child_process'
import { join } from 'path'
import { existsSync } from 'fs'
import {
  type SendMessageParams,
  type ChatTokenEvent,
  type ChatErrorEvent,
  type ChatDoneEvent,
  IPC_CHANNELS,
} from '../shared/types'

interface ActiveProcess {
  pty: IPty
  messageId: string
  sessionId: string
  accumulatedContent: string
}

const activeProcesses = new Map<string, ActiveProcess>()

function findClaudePath(): string | null {
  if (process.platform === 'win32') {
    const npmPrefix = (() => {
      try { return execSync('npm prefix -g', { encoding: 'utf-8' }).trim() }
      catch { return null }
    })()

    if (npmPrefix) {
      for (const c of [
        join(npmPrefix, 'node_modules', '@anthropic-ai', 'claude-code', 'cli.mjs'),
        join(npmPrefix, 'claude.cmd'),
      ]) {
        if (existsSync(c)) return c
      }
    }

    try {
      const result = execSync('where claude', { encoding: 'utf-8' }).trim()
      const lines = result.split('\n').map(l => l.trim()).filter(Boolean)
      if (lines.length > 0) return lines[0]
    } catch { /* fallthrough */ }
  }

  try {
    return execSync('which claude', { encoding: 'utf-8' }).trim() || null
  } catch {
    return null
  }
}

function spawnClaude(args: string[], cwd: string): IPty {
  if (process.platform === 'win32') {
    const escaped = args.map(a => {
      if (/\s/.test(a) || a.includes('"')) return `"${a.replace(/"/g, '\\"')}"`
      return a
    })
    return spawn('cmd.exe', ['/c', 'claude', ...escaped], {
      name: 'xterm-256color',
      cols: 500,
      rows: 80,
      cwd,
      env: { ...process.env, TERM: 'xterm-256color' },
    })
  }

  return spawn('claude', args, {
    name: 'xterm-256color',
    cols: 500,
    rows: 80,
    cwd,
    env: { ...process.env, TERM: 'xterm-256color' },
  })
}

/**
 * Raw ANSI cleaner: strip terminal control sequences
 */
function stripAnsi(s: string): string {
  return s
    .replace(/\x1b\]0;.*?\x07/g, '')   // OSC title seq (e.g. `ESC]0;claude BEL`)
    .replace(/\x1b\]8;[^\x07]*\x07/g, '') // OSC hyperlink
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '') // CSI sequences (color, cursor, etc.)
    .replace(/\x1b\[\?[0-9;]*[hl]/g, '')   // DEC private modes
    .replace(/\x1b[=()>]/g, '')
    .replace(/\r/g, '')
    .replace(/[\x00-\x08\x0e-\x1f]/g, '')  // remaining control chars except \n (0x0a)
}

/**
 * Try to parse complete JSON objects from the buffer using bracket-depth scanning
 * instead of line-splitting (which breaks when pty cols wrap long lines).
 */
function extractJsonObjects(buffer: string): { objects: unknown[]; rest: string } {
  const objects: unknown[] = []
  let depth = 0
  let start = -1

  for (let i = 0; i < buffer.length; i++) {
    const ch = buffer[i]
    if (depth === 0) {
      if (ch === '{') {
        depth = 1
        start = i
      }
      continue
    }

    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0 && start >= 0) {
        try {
          objects.push(JSON.parse(buffer.slice(start, i + 1)))
        } catch {
          // skip corrupt chunk
        }
        start = -1
      }
    }
  }

  return {
    objects,
    rest: start >= 0 ? buffer.slice(start) : ''
  }
}

export function startChat(
  params: SendMessageParams,
  sender: BrowserWindow
): void {
  if (activeProcesses.has(params.sessionId)) {
    return
  }

  const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  if (!findClaudePath()) {
    sender.webContents.send(IPC_CHANNELS.CHAT_ERROR, {
      sessionId: params.sessionId, messageId,
      error: '未找到 claude 命令。请先安装 Claude Code CLI：npm install -g @anthropic-ai/claude-code',
    })
    return
  }

  const args = ['-p', params.message, '--model', params.model,
                 '--output-format', 'stream-json', '--verbose']

  let pty: IPty
  try {
    pty = spawnClaude(args, process.cwd())
  } catch (err) {
    sender.webContents.send(IPC_CHANNELS.CHAT_ERROR, {
      sessionId: params.sessionId, messageId,
      error: `无法启动 claude 进程: ${err instanceof Error ? err.message : String(err)}`,
    })
    return
  }

  const proc: ActiveProcess = {
    pty, messageId, sessionId: params.sessionId,
    accumulatedContent: '',
  }
  activeProcesses.set(params.sessionId, proc)

  let buffer = ''
  let lastText = ''  // track progressive assistant text for diff

  pty.onData((raw: string) => {
    buffer += stripAnsi(raw)
    const { objects, rest } = extractJsonObjects(buffer)
    buffer = rest

    for (const obj of objects) {
      const parsed = obj as Record<string, any>
      if (parsed.type === 'system') continue

      if (parsed.type === 'error' || parsed.is_error) {
        sender.webContents.send(IPC_CHANNELS.CHAT_ERROR, {
          sessionId: params.sessionId, messageId,
          error: parsed.error?.message || parsed.result || 'Claude 返回错误',
        })
        return
      }

      // Progressive assistant message — diff against last seen
      if (parsed.type === 'assistant' && parsed.message?.content) {
        let newText = ''
        for (const block of parsed.message.content) {
          if (block.type === 'text' && block.text) newText += block.text
        }
        if (newText.length > lastText.length) {
          const diff = newText.slice(lastText.length)
          lastText = newText
          proc.accumulatedContent = newText
          if (diff) {
            sender.webContents.send(IPC_CHANNELS.CHAT_TOKEN, {
              sessionId: params.sessionId, messageId, token: diff,
            })
          }
        }
      }

      // Done
      if (parsed.type === 'result') {
        sender.webContents.send(IPC_CHANNELS.CHAT_DONE, {
          sessionId: params.sessionId, messageId,
          fullContent: (parsed as any).result || proc.accumulatedContent,
        })
        activeProcesses.delete(params.sessionId)
        return
      }
    }
  })

  pty.onExit(() => {
    if (activeProcesses.has(params.sessionId)) {
      sender.webContents.send(IPC_CHANNELS.CHAT_DONE, {
        sessionId: params.sessionId, messageId,
        fullContent: proc.accumulatedContent,
      })
      activeProcesses.delete(params.sessionId)
    }
  })
}

export function cancelChat(sessionId: string): void {
  const proc = activeProcesses.get(sessionId)
  if (!proc) return
  try { proc.pty.kill() } catch { /* already dead */ }
  activeProcesses.delete(sessionId)
}

export function isChatRunning(sessionId: string): boolean {
  return activeProcesses.has(sessionId)
}
