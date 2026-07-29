// src/main/claude-manager.ts
import { spawn, IPty } from 'node-pty'
import { BrowserWindow } from 'electron'
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

export function startChat(
  params: SendMessageParams,
  sender: BrowserWindow
): void {
  if (activeProcesses.has(params.sessionId)) {
    // That session already has an active request, ignore
    return
  }

  const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  // Build claude CLI command arguments
  const args = [
    '-p', params.message,
    '--model', params.model,
    '--output-format', 'stream-json',
  ]

  const pty = spawn('claude', args, {
    name: 'xterm-256color',
    cols: 120,
    rows: 40,
    cwd: process.cwd(),
    env: { ...process.env, TERM: 'xterm-256color' },
  })

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
