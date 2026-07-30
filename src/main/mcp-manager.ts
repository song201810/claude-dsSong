// src/main/mcp-manager.ts
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { homedir } from 'os'
import type { McpServerConfig } from '../shared/types'

const HOME = homedir()

// Collect MCP servers from ALL known sources:
// 1. ~/.claude/.mcp.json (user-level)
// 2. ~/.claude/plugins/ -- any .mcp.json under marketplace/cache dirs
// 3. Plugin dirs directly under HOME (e.g. ~/plugins/*/.*.mcp.json)
// 4. ~/.claude/.credentials.json — OAuth-registered MCPs (HTTP type)

function findMcpJsonFiles(): string[] {
  const results: string[] = []
  const seen = new Set<string>()

  // Direct .mcp.json in .claude
  const direct = join(HOME, '.claude', '.mcp.json')
  if (existsSync(direct)) { seen.add(direct); results.push(direct) }

  // .mcp.json files inside plugins/ tree (exclude cache dirs — those are managed by plugins)
  const pluginsDir = join(HOME, '.claude', 'plugins')
  if (existsSync(pluginsDir)) {
    for (const f of walkJson(pluginsDir, 6)) {
      if (f.endsWith('.mcp.json') && !seen.has(f) && !f.includes('cache')) {
        seen.add(f)
        results.push(f)
      }
    }
  }

  // Plugin dirs directly under HOME
  const homePlugins = join(HOME, 'plugins')
  if (existsSync(homePlugins)) {
    for (const f of walkJson(homePlugins, 3)) {
      if (f.endsWith('.mcp.json') && !seen.has(f)) {
        results.push(f)
      }
    }
  }

  return results
}

function loadOAuthMcpServers(): Record<string, RawMcpServer> {
  const result: Record<string, RawMcpServer> = {}
  const credFile = join(HOME, '.claude', '.credentials.json')
  if (!existsSync(credFile)) return result
  try {
    const cred = JSON.parse(readFileSync(credFile, 'utf-8'))
    const oauth = cred.mcpOAuth || {}
    for (const [, info] of Object.entries(oauth) as any) {
      const name = info.serverName || 'unknown'
      const url = info.serverUrl || ''
      if (name && url) {
        if (!result[name]) {
          result[name] = {
            command: url, args: [], env: {},
            type: 'http', url: url,
          }
        }
      }
    }
  } catch { /* ignore */ }
  return result
}

function walkJson(dir: string, maxDepth: number): string[] {
  const results: string[] = []
  function walk(d: string, depth: number) {
    if (depth > maxDepth) return
    let entries
    try { entries = readdirSync(d) } catch { return }
    for (const name of entries) {
      if (name.startsWith('.') && name !== '.mcp.json') continue
      const full = join(d, name)
      try {
        if (statSync(full).isDirectory()) {
          walk(full, depth + 1)
        } else if (name.endsWith('.json')) {
          results.push(full)
        }
      } catch { /* skip */ }
    }
  }
  walk(dir, 0)
  return results
}

interface RawMcpServer {
  command: string
  args?: string[]
  env?: Record<string, string>
  type?: string
  url?: string
  headers?: Record<string, string>
}

interface McpJson {
  mcpServers?: Record<string, RawMcpServer>
}

function loadAllMcpServers(): Record<string, RawMcpServer> {
  const all: Record<string, RawMcpServer> = {}

  // First load from OAuth credentials (HTTP-based MCPs like weather)
  const oauthServers = loadOAuthMcpServers()
  Object.assign(all, oauthServers)

  // Then load from .mcp.json files (these can override OAuth entries)
  const files = findMcpJsonFiles()
  for (const file of files) {
    try {
      const data: McpJson = JSON.parse(readFileSync(file, 'utf-8'))
      if (data.mcpServers) {
        for (const [name, cfg] of Object.entries(data.mcpServers)) {
          all[name] = cfg
        }
      }
    } catch { /* skip unparseable */ }
  }

  return all
}

// === Public API ===

export function listMcpServers(): McpServerConfig[] {
  const raw = loadAllMcpServers()
  return Object.entries(raw).map(([name, s]) => ({
    name,
    command: s.command || s.url || '',
    args: s.args || [],
    env: s.env || {},
    type: (s.type || (s.url ? 'http' : 'stdio')) as 'stdio' | 'http',
    url: s.url,
    headers: s.headers,
  }))
}

// Write operations go to user-level .claude/.mcp.json
const USER_MCP_JSON = join(HOME, '.claude', '.mcp.json')

function readUserMcp(): McpJson {
  if (!existsSync(USER_MCP_JSON)) return { mcpServers: {} }
  try {
    return JSON.parse(readFileSync(USER_MCP_JSON, 'utf-8'))
  } catch {
    return { mcpServers: {} }
  }
}

function writeUserMcp(data: McpJson): void {
  const dir = dirname(USER_MCP_JSON)
  if (!existsSync(dir)) {
    const { mkdirSync } = require('fs')
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(USER_MCP_JSON, JSON.stringify(data, null, 2), 'utf-8')
}

export function addMcpServer(server: McpServerConfig): void {
  const data = readUserMcp()
  if (!data.mcpServers) data.mcpServers = {}
  data.mcpServers[server.name] = {
    command: server.command,
    args: server.args.length > 0 ? server.args : undefined,
    env: Object.keys(server.env).length > 0 ? server.env : undefined,
  }
  writeUserMcp(data)
}

export function updateMcpServer(name: string, server: McpServerConfig): void {
  const data = readUserMcp()
  if (!data.mcpServers) data.mcpServers = {}
  if (name !== server.name && data.mcpServers[name]) {
    delete data.mcpServers[name]
  }
  data.mcpServers[server.name] = {
    command: server.command,
    args: server.args.length > 0 ? server.args : undefined,
    env: Object.keys(server.env).length > 0 ? server.env : undefined,
  }
  writeUserMcp(data)
}

export function deleteMcpServer(name: string): void {
  const data = readUserMcp()
  if (!data.mcpServers) return
  delete data.mcpServers[name]
  writeUserMcp(data)
}

// === Whitelist (stored in user-level .claude/.mcp.json) ===

export function getWhitelist(): string[] {
  const data = readUserMcp()
  return (data as any).mcpWhitelist || []
}

export function setWhitelist(list: string[]): void {
  const data = readUserMcp()
  ;(data as any).mcpWhitelist = list
  writeUserMcp(data)
}

export function addToWhitelist(toolName: string): string[] {
  const data = readUserMcp()
  if (!(data as any).mcpWhitelist) (data as any).mcpWhitelist = []
  if (!(data as any).mcpWhitelist.includes(toolName)) {
    ;(data as any).mcpWhitelist.push(toolName)
  }
  writeUserMcp(data)
  return (data as any).mcpWhitelist
}
