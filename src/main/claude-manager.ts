// src/main/claude-manager.ts
import { BrowserWindow } from 'electron'
import { execSync, spawn as spawnProc } from 'child_process'
import { join } from 'path'
import { existsSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { IPty } from 'node-pty'
import {
  type SendMessageParams,
  type ChatTokenEvent,
  type ChatErrorEvent,
  type ChatDoneEvent,
  IPC_CHANNELS,
} from '../shared/types'
import { getWhitelist, listMcpServers } from './mcp-manager'

// After Fix-010 we learned that pty terminal column wrapping will hard-break
// long JSON lines no matter how large `cols` is.  Long replies (200+ chars)
// always overflow.  For `-p` (single-question) mode we do NOT need a pty at
// all — a plain `child_process.spawn` sends the message and captures stdout
// without terminal processing.  This keeps every JSON object on a single line.
// We only fall back to node-pty when stdin is needed (which we don't use yet).

interface ActiveProcess {
  kill: () => void
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

/**
 * Strip ANSI escape codes.  Even child_process output may contain some
 * control codes (though far fewer than pty).  Be defensive.
 */
function stripAnsi(s: string): string {
  return s
    .replace(/\x1b\[[\?>]?[0-9;]*[a-zA-Z]/g, '')
    .replace(/\x1b\][^\x07\x1b]*\x07?/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
    .replace(/\x1b/g, '')
}

/**
 * Parse JSONL: split on newlines, parse each line that starts with `{`.
 * Returns parsed objects + the trailing partial-line (if any).
 */
function parseJsonlLines(buf: string): { objs: Array<Record<string, any>>; rest: string } {
  const objs: Array<Record<string, any>> = []
  const lines = buf.split('\n')
  const rest = lines.pop() || ''
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed[0] !== '{') continue
    try { objs.push(JSON.parse(trimmed)) } catch { /* skip corrupt lines */ }
  }
  return { objs, rest }
}

/**
 * Spawn claude as a plain child process (not pty).  On Windows we still go
 * through cmd.exe so .cmd files are resolved.  This avoids ALL terminal
 * column wrapping, ANSI injection, and pty overhead — stdout is raw text.
 */
function spawnClaudeProc(args: string[], cwd: string) {
  if (process.platform === 'win32') {
    const escaped = args.map(a => /\s/.test(a) || a.includes('"') ? `"${a.replace(/"/g, '\\"')}"` : a)
    return spawnProc('cmd.exe', ['/c', 'claude', ...escaped], {
      cwd,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    })
  }
  return spawnProc('claude', args, {
    cwd,
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe'],
  })
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

  // Base args shared between -p (first message) and --continue (follow-up)
  const imageExts = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'])
  // Build allowedTools from whitelist to auto-approve MCP tools
  const whitelist = getWhitelist()
  const args = ['--model', params.model, '--output-format', 'stream-json', '--verbose', '--permission-mode', 'bypassPermissions']
  if (whitelist.length > 0) {
    // NOTE: --allowedTools only needed without bypassPermissions, kept for safety
    args.push('--allowedTools', whitelist.join(','))
  }

  // Session-level MCP filter: only enable selected MCP servers
  if (params.enabledMcpServers !== undefined) {
    const allServers = listMcpServers()
    const enabledSet = new Set(params.enabledMcpServers)
    // Only include the MCP servers user selected in the GUI
    if (enabledSet.size > 0) {
      const filtered = allServers.filter(s => enabledSet.has(s.name))
      const serversConfig: Record<string, any> = {}
      for (const s of filtered) {
        const cfg: any = {}
        // For HTTP-type MCPs (like weather), use url; for stdio, use command+args
        if ((s as any).url) {
          cfg.type = 'http'
          cfg.url = (s as any).url
          if ((s as any).headers) cfg.headers = (s as any).headers
        } else {
          cfg.command = s.command
          if (s.args?.length) cfg.args = s.args
          if (s.env && Object.keys(s.env).length) cfg.env = s.env
        }
        serversConfig[s.name] = cfg
      }
      const tempPath = join(tmpdir(), `claude-desktop-mcp-${params.sessionId}.json`)
      writeFileSync(tempPath, JSON.stringify({ mcpServers: serversConfig }, null, 2))
      args.push('--strict-mcp-config', '--mcp-config', tempPath)
    } else {
      // User selected 0 MCP servers — block all via empty config
      const tempPath = join(tmpdir(), `claude-desktop-mcp-${params.sessionId}.json`)
      writeFileSync(tempPath, JSON.stringify({ mcpServers: {} }, null, 2))
      args.push('--strict-mcp-config', '--mcp-config', tempPath)
    }
  }

  // Attached files: images → --image, text files → referenced in prompt
  let promptText = params.message
  if (params.attachedFiles && params.attachedFiles.length > 0) {
    for (const f of params.attachedFiles) {
      const ext = f.split('.').pop()?.toLowerCase() || ''
      if (imageExts.has(ext)) {
        args.push('--image', f)
      }
    }
    const textFiles = params.attachedFiles.filter(f => {
      const ext = f.split('.').pop()?.toLowerCase() || ''
      return !imageExts.has(ext)
    })
    if (textFiles.length > 0) {
      const fileRefs = textFiles.map(f => `@${f.replace(/\\/g, '/')}`).join('\n')
      promptText = `${promptText}\n\n${fileRefs}`
    }
  }

  if (params.resume) {
    // --continue loads the last session.  Prompt is passed as the first
    // positional argument (no -p flag).
    args.push('--continue', promptText)
  } else {
    args.push('-p', promptText)
  }

  const child = spawnClaudeProc(args, params.workDir || process.cwd())
  child.on('error', (err) => {
    sender.webContents.send(IPC_CHANNELS.CHAT_ERROR, {
      sessionId: params.sessionId, messageId,
      error: `无法启动 claude 进程: ${err.message}`,
    })
  })

  child.stderr?.on('data', (data: Buffer) => {
    // Claude CLI prints progress info to stderr.  Silently log (not an error).
  })

  let buffer = ''
  let lastText = ''

  const proc: ActiveProcess = {
    kill: () => { try { child.kill() } catch {} },
    messageId,
    sessionId: params.sessionId,
    accumulatedText: '',
  }
  activeProcesses.set(params.sessionId, proc)

  child.stdout!.on('data', (data: Buffer) => {
    buffer += stripAnsi(data.toString('utf-8'))
    const { objs, rest } = parseJsonlLines(buffer)
    buffer = rest

    for (const obj of objs) {
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
          if (block.type === 'tool_use' && block.name) {
            // MCP tool call — inject as visible text for now
            newText += `\n\n**[MCP 工具调用]** ${block.name}\n`
          }
        }
        if (newText.length > lastText.length) {
          const diff = newText.slice(lastText.length)
          lastText = newText
          proc.accumulatedText = newText
          sender.webContents.send(IPC_CHANNELS.CHAT_TOKEN, {
            sessionId: params.sessionId, messageId, token: diff,
          })
        }
      }

      if (obj.type === 'result') {
        const progressiveText = proc.accumulatedText
        const resultText = (obj as any).result || ''
        const finalText = progressiveText || resultText
        sender.webContents.send(IPC_CHANNELS.CHAT_DONE, {
          sessionId: params.sessionId, messageId,
          fullContent: finalText,
        })
        activeProcesses.delete(params.sessionId)
        return
      }
    }
  })

  child.on('close', () => {
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
  try { proc.kill() } catch { /* already dead */ }
  activeProcesses.delete(sessionId)
}

export function isChatRunning(sessionId: string): boolean {
  return activeProcesses.has(sessionId)
}
