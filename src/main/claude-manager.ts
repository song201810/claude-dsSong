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
  isThinking: boolean
}

const activeProcesses = new Map<string, ActiveProcess>()

/** Find the absolute path to the claude binary, or null if not found */
function findClaudePath(): string | null {
  // Check common npm global install locations on Windows
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

    // Try to resolve via 'where' command
    try {
      const result = execSync('where claude', { encoding: 'utf-8' }).trim()
      const lines = result.split('\n').map(l => l.trim()).filter(Boolean)
      if (lines.length > 0) return lines[0]
    } catch { /* fallthrough */ }
  }

  // Unix: try which
  try {
    return execSync('which claude', { encoding: 'utf-8' }).trim() || null
  } catch {
    return null
  }
}

/** Spawn command that works on both Windows (.cmd/.mjs) and Unix */
function spawnClaude(args: string[], cwd: string): IPty {
  const shell = process.platform === 'win32' ? 'cmd.exe' : (process.env.SHELL || '/bin/sh')

  // On Windows, quote args and pass through cmd.exe so .cmd files work
  if (process.platform === 'win32') {
    const escaped = args.map(a => {
      // Wrap arguments containing spaces in quotes, escape inner quotes
      if (/\s/.test(a) || a.includes('"')) {
        return `"${a.replace(/"/g, '\\"')}"`
      }
      return a
    })
    return spawn(shell, ['/c', 'claude', ...escaped], {
      name: 'xterm-256color',
      cols: 160,
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

  // Check if claude CLI is available before spawning
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

  const args = [
    '-p', params.message,
    '--model', params.model,
    '--output-format', 'stream-json',
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
    isThinking: false,
  }

  activeProcesses.set(params.sessionId, proc)

  let buffer = ''

  pty.onData((data: string) => {
    buffer += data

    // Split by lines
    const lines = buffer.split('\n')
    buffer = lines.pop() || '' // Keep incomplete line

    for (const line of lines) {
      if (!line.trim()) continue

      try {
        // Claude CLI stream-json format
        const parsed = JSON.parse(line)

        let tokenToSend = ''

        if (parsed.type === 'content_block_delta') {
          if (parsed.delta?.type === 'text_delta') {
            tokenToSend = parsed.delta.text
            proc.accumulatedContent += tokenToSend
          } else if (parsed.delta?.type === 'thinking_delta') {
            proc.accumulatedThinking += parsed.delta.thinking
            proc.isThinking = true
          }
        } else if (parsed.type === 'content_block_start') {
          if (parsed.content_block?.type === 'thinking') {
            proc.isThinking = true
          }
        } else if (parsed.type === 'content_block_stop') {
          proc.isThinking = false
        } else if (parsed.type === 'assistant') {
          // Full assistant message
          if (parsed.message?.content) {
            for (const block of parsed.message.content) {
              if (block.type === 'text') {
                tokenToSend += block.text
              }
            }
            proc.accumulatedContent += tokenToSend
          }
        } else if (parsed.type === 'error') {
          const event: ChatErrorEvent = {
            sessionId: params.sessionId,
            messageId,
            error: parsed.error?.message || 'Unknown error',
          }
          sender.webContents.send(IPC_CHANNELS.CHAT_ERROR, event)
          activeProcesses.delete(params.sessionId)
          return
        }

        // Push token to renderer if any
        if (tokenToSend) {
          const event: ChatTokenEvent = {
            sessionId: params.sessionId,
            messageId,
            token: tokenToSend,
            thinking: proc.accumulatedThinking || undefined,
          }
          sender.webContents.send(IPC_CHANNELS.CHAT_TOKEN, event)
        }
      } catch {
        // Non-JSON line, could be plain text output (CLI streaming fallback)
        if (line.trim()) {
          proc.accumulatedContent += line + '\n'
          const event: ChatTokenEvent = {
            sessionId: params.sessionId,
            messageId,
            token: line + '\n',
          }
          sender.webContents.send(IPC_CHANNELS.CHAT_TOKEN, event)
        }
      }
    }
  })

  pty.onExit(({ exitCode }) => {
    const event: ChatDoneEvent = {
      sessionId: params.sessionId,
      messageId,
      fullContent: proc.accumulatedContent,
    }
    sender.webContents.send(IPC_CHANNELS.CHAT_DONE, event)
    activeProcesses.delete(params.sessionId)
  })
}

export function cancelChat(sessionId: string): void {
  const process = activeProcesses.get(sessionId)
  if (!process) return

  try {
    process.pty.kill()
  } catch {
    // Process may have already exited
  }
  activeProcesses.delete(sessionId)
}

export function isChatRunning(sessionId: string): boolean {
  return activeProcesses.has(sessionId)
}
