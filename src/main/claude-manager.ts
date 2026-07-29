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
  accumulatedThinking: string
}

const activeProcesses = new Map<string, ActiveProcess>()

function findClaudePath(): string | null {
  if (process.platform === 'win32') {
    const npmPrefix = (() => {
      try { return execSync('npm prefix -g', { encoding: 'utf-8' }).trim() }
      catch { return null }
    })()

    if (npmPrefix) {
      const candidates = [
        join(npmPrefix, 'node_modules', '@anthropic-ai', 'claude-code', 'cli.mjs'),
        join(npmPrefix, 'claude.cmd'),
      ]
      for (const c of candidates) {
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
  const shell = process.platform === 'win32' ? 'cmd.exe' : (process.env.SHELL || '/bin/sh')

  if (process.platform === 'win32') {
    const escaped = args.map(a => {
      if (/\s/.test(a) || a.includes('"')) {
        return `"${a.replace(/"/g, '\\"')}"`
      }
      return a
    })
    return spawn(shell, ['/c', 'claude', ...escaped], {
      name: 'xterm-256color',
      cols: 999,
      rows: 40,
      cwd,
      env: { ...process.env, TERM: 'xterm-256color' },
    })
  }

  return spawn('claude', args, {
    name: 'xterm-256color',
    cols: 160,
    rows: 40,
    cwd,
    env: { ...process.env, TERM: 'xterm-256color' },
  })
}

export function startChat(
  params: SendMessageParams,
  sender: BrowserWindow
): void {
  if (activeProcesses.has(params.sessionId)) {
    return
  }

  const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const claudePath = findClaudePath()
  if (!claudePath) {
    const event: ChatErrorEvent = {
      sessionId: params.sessionId,
      messageId,
      error: '未找到 claude 命令。请先安装 Claude Code CLI：npm install -g @anthropic-ai/claude-code',
    }
    sender.webContents.send(IPC_CHANNELS.CHAT_ERROR, event)
    return
  }

  // Use --max-json-line 0 to disable line truncation
  const args = [
    '-p', params.message,
    '--model', params.model,
    '--output-format', 'stream-json',
    '--no-formatting',           // skip ANSI entirely
    '--max-json-line', '0',      // no line wrapping (0 = unlimited)
    '--verbose',
  ]

  let pty: IPty
  try {
    pty = spawnClaude(args, process.cwd())
  } catch (err) {
    const event: ChatErrorEvent = {
      sessionId: params.sessionId,
      messageId,
      error: `无法启动 claude 进程: ${err instanceof Error ? err.message : String(err)}`,
    }
    sender.webContents.send(IPC_CHANNELS.CHAT_ERROR, event)
    return
  }

  const proc: ActiveProcess = {
    pty,
    messageId,
    sessionId: params.sessionId,
    accumulatedContent: '',
    accumulatedThinking: '',
  }

  activeProcesses.set(params.sessionId, proc)

  let buffer = ''

  function clean(data: string): string {
    return data
      .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
      .replace(/\x1b\][^\x07]*\x07/g, '')
      .replace(/\r/g, '')       // strip CR (carriage return)
      .replace(/\x1b\[\?[0-9;]*[hl]/g, '')  // DEC private mode sequences
  }

  function extractParts(blocks: Array<{ type: string; text?: string; thinking?: string }>): { text: string; thinking: string } {
    let text = ''
    let thinking = ''
    for (const block of blocks) {
      if (block.type === 'text' && block.text) text += block.text
      else if (block.type === 'thinking' && block.thinking) thinking += block.thinking
    }
    return { text, thinking }
  }

  pty.onData((raw: string) => {
    // Filter ANSI + control characters
    const cleaned = raw
      .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
      .replace(/\x1b\][^\x07]*\x07/g, '')
      .replace(/\x1b\[\?[0-9;]*[hl]/g, '')
      .replace(/\r/g, '')
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')  // strip remaining control chars
    buffer += cleaned
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.trim()) continue

      try {
        const parsed = JSON.parse(line)
        console.log('[claude-manager] type:', parsed.type)
        if (parsed.type === 'system') continue

        if (parsed.type === 'error' || parsed.is_error) {
          console.log('[claude-manager] ERROR')
          const evt: ChatErrorEvent = {
            sessionId: params.sessionId,
            messageId,
            error: parsed.error?.message || parsed.result || 'Claude 返回错误',
          }
          sender.webContents.send(IPC_CHANNELS.CHAT_ERROR, evt)
          return
        }

        if (parsed.type === 'assistant' && parsed.message?.content) {
          const { text, thinking } = extractParts(parsed.message.content)
          let diff = ''
          if (text.length > proc.accumulatedContent.length) {
            diff = text.slice(proc.accumulatedContent.length)
            proc.accumulatedContent = text
          }
          const newThinking = thinking.slice(proc.accumulatedThinking.length)
          if (newThinking) proc.accumulatedThinking = thinking

          if (diff) {
            console.log('[claude-manager] SENDING token, len:', diff.length, 'total:', proc.accumulatedContent.length)
            const evt: ChatTokenEvent = {
              sessionId: params.sessionId,
              messageId,
              token: diff,
              thinking: proc.accumulatedThinking || undefined,
            }
            sender.webContents.send(IPC_CHANNELS.CHAT_TOKEN, evt)
          }
        }

        if (parsed.type === 'result') {
          console.log('[claude-manager] DONE')
          const evt: ChatDoneEvent = {
            sessionId: params.sessionId,
            messageId,
            fullContent: (parsed as any).result || proc.accumulatedContent,
          }
          sender.webContents.send(IPC_CHANNELS.CHAT_DONE, evt)
          activeProcesses.delete(params.sessionId)
          return
        }
      } catch (e) {
        // Print raw line that failed to parse for debugging
        if (line.trim()) {
          console.log('[claude-manager] PARSE FAIL, raw line head:', JSON.stringify(line.slice(0, 120)))
        }
      }
    }
  })

  pty.onExit(() => {
    if (activeProcesses.has(params.sessionId)) {
      const evt: ChatDoneEvent = {
        sessionId: params.sessionId,
        messageId,
        fullContent: proc.accumulatedContent,
      }
      sender.webContents.send(IPC_CHANNELS.CHAT_DONE, evt)
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
