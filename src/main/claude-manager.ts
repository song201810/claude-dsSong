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
  accumulatedText: string
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
    return spawn('cmd.exe', ['/c', 'claude', ...args.map(a =>
      /\s/.test(a) || a.includes('"') ? `"${a.replace(/"/g, '\\"')}"` : a
    )], {
      name: 'xterm-256color', cols: 999, rows: 40, cwd,
      env: { ...process.env, TERM: 'xterm-256color' },
    })
  }
  return spawn('claude', args, {
    name: 'xterm-256color', cols: 999, rows: 40, cwd,
    env: { ...process.env, TERM: 'xterm-256color' },
  })
}

/**
 * Strip all ANSI/terminal control sequences.
 * Claude Code CLI's pty output is a clean JSONL stream with ANSI codes
 * injected by the terminal layer.  Strip so that each physical line is
 * one complete JSON object.
 */
function cleanPtyOutput(data: string): string {
  return data
    .replace(/\x1b\[[\?>]?[0-9;]*[a-zA-Z]/g, '')   // CSI / DEC private modes
    .replace(/\x1b\][^\x07\x1b]*\x07?/g, '')         // OSC sequences
    .replace(/\r\n?/g, '\n')
    .replace(/[\x00-\x09\x0b\x0c\x0e-\x1f]/g, '')
    .replace(/\x1b/g, '')                              // any stray ESC
}

function parseJsonlLines(buf: string): { objs: Array<Record<string, any>>; rest: string } {
  const objs: Array<Record<string, any>> = []
  const lines = buf.split('\n')
  const rest = lines.pop() || ''
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed[0] !== '{') continue
    try { objs.push(JSON.parse(trimmed)) } catch {
      console.log('[claude-manager] JSON PARSE FAIL, line head:', JSON.stringify(trimmed.slice(0, 120)))
    }
  }
  return { objs, rest }
}

export function startChat(
  params: SendMessageParams,
  sender: BrowserWindow
): void {
  if (activeProcesses.has(params.sessionId)) return

  const messageId = params.assistantMessageId || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  if (!findClaudePath()) {
    sender.webContents.send(IPC_CHANNELS.CHAT_ERROR, {
      sessionId: params.sessionId, messageId,
      error: '未找到 claude 命令。请先安装 Claude Code CLI',
    })
    return
  }

  const args = ['-p', params.message, '--model', params.model,
                 '--output-format', 'stream-json', '--verbose']

  let pty: IPty
  try { pty = spawnClaude(args, process.cwd()) } catch (err) {
    sender.webContents.send(IPC_CHANNELS.CHAT_ERROR, {
      sessionId: params.sessionId, messageId,
      error: `无法启动 claude 进程: ${err instanceof Error ? err.message : String(err)}`,
    })
    return
  }

  const proc: ActiveProcess = {
    pty, messageId, sessionId: params.sessionId, accumulatedText: '',
  }
  activeProcesses.set(params.sessionId, proc)

  let buffer = ''
  let lastText = ''

  pty.onData((data: string) => {
    console.log('[claude-manager] RAW chunk len:', data.length, 'first 300 raw:', JSON.stringify(data.slice(0, 300)))
    const cleaned = cleanPtyOutput(data)
    console.log('[claude-manager] CLEANED first 300:', JSON.stringify(cleaned.slice(0, 300)))
    buffer += cleaned
    const { objs, rest } = parseJsonlLines(buffer)
    console.log('[claude-manager] parsed objs:', objs.length, 'rest len:', rest.length, 'rest first 200:', JSON.stringify(rest.slice(0, 200)))
    buffer = rest

    for (const obj of objs) {
      console.log('[claude-manager] obj type:', obj.type, obj.subtype || '')
      if (obj.type === 'system') continue

      if (obj.type === 'error' || obj.is_error) {
        sender.webContents.send(IPC_CHANNELS.CHAT_ERROR, {
          sessionId: params.sessionId, messageId,
          error: obj.error?.message || obj.result || 'Claude 返回错误',
        })
        return
      }

      // Progressive assistant message — diff against previous
      if (obj.type === 'assistant' && obj.message?.content) {
        let newText = ''
        for (const block of obj.message.content) {
          if (block.type === 'text' && block.text) newText += block.text
        }
        console.log('[claude-manager] ASSISTANT text_len:', newText.length, 'lastText:', lastText.length)
        if (newText.length > lastText.length) {
          const diff = newText.slice(lastText.length)
          lastText = newText
          proc.accumulatedText = newText
          console.log('[claude-manager] SENDING token diff_len:', diff.length)
          sender.webContents.send(IPC_CHANNELS.CHAT_TOKEN, {
            sessionId: params.sessionId, messageId, token: diff,
          })
        }
      }

      if (obj.type === 'result') {
        // Prefer the accumulated progressive text.  If the CLI sent
        // multiple assistant messages we already have the full content.
        // The `result.result` field is a fallback in case the progressive
        // events were missed (e.g. first token is the full answer).
        const progressiveText = proc.accumulatedText
        const resultText = (obj as any).result || ''
        const finalText = progressiveText || resultText
        console.log('[claude-manager] RESULT progressiveText_len:', progressiveText.length, 'resultText_len:', resultText.length)
        sender.webContents.send(IPC_CHANNELS.CHAT_DONE, {
          sessionId: params.sessionId, messageId,
          fullContent: finalText,
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
        fullContent: proc.accumulatedText,
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
