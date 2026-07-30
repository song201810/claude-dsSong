// src/main/ipc-handlers.ts
import { ipcMain, BrowserWindow, dialog } from 'electron'
import { readdirSync, statSync, copyFileSync, mkdirSync, existsSync } from 'fs'
import { join, relative, basename } from 'path'
import { IPC_CHANNELS } from '../shared/types'
import type { FileNode } from '../shared/types'
import { listSessions, createSession, getSession, deleteSession, appendMessage } from './session-store'
import { listGroups, createGroup, deleteGroup, renameGroup, addSessionToGroup, removeSessionFromGroup } from './group-store'
import { getSettings, updateSettings, getModels } from './config-manager'
import { startChat, cancelChat } from './claude-manager'
import {
  listMcpServers, addMcpServer, updateMcpServer, deleteMcpServer,
  getWhitelist, setWhitelist, addToWhitelist,
} from './mcp-manager'

export function registerIpcHandlers(): void {
  // === Session Management ===
  ipcMain.handle(IPC_CHANNELS.SESSION_LIST, async () => {
    return await listSessions()
  })

  ipcMain.handle(IPC_CHANNELS.SESSION_CREATE, async (_, params) => {
    return await createSession(params)
  })

  ipcMain.handle(IPC_CHANNELS.SESSION_GET, async (_, id: string) => {
    return await getSession(id)
  })

  ipcMain.handle(IPC_CHANNELS.SESSION_DELETE, async (_, id: string) => {
    await deleteSession(id)
  })

  // Internal channel for persisting messages from renderer
  ipcMain.handle('session:append-message', async (_, sessionId: string, message: any) => {
    await appendMessage(sessionId, message)
  })

  // === Group Management ===
  ipcMain.handle(IPC_CHANNELS.GROUP_LIST, async () => {
    return await listGroups()
  })

  ipcMain.handle(IPC_CHANNELS.GROUP_CREATE, async (_, name: string) => {
    return await createGroup(name)
  })

  ipcMain.handle(IPC_CHANNELS.GROUP_DELETE, async (_, id: string, deleteSessions?: boolean) => {
    await deleteGroup(id, deleteSessions)
  })

  ipcMain.handle(IPC_CHANNELS.GROUP_RENAME, async (_, id: string, name: string) => {
    return await renameGroup(id, name)
  })

  ipcMain.handle(IPC_CHANNELS.GROUP_ADD_SESSION, async (_, sessionId: string, groupId: string) => {
    await addSessionToGroup(sessionId, groupId)
  })

  ipcMain.handle(IPC_CHANNELS.GROUP_REMOVE_SESSION, async (_, sessionId: string) => {
    await removeSessionFromGroup(sessionId)
  })

  // === Chat Control ===
  ipcMain.on(IPC_CHANNELS.CHAT_SEND, (event, params) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return
    startChat(params, window)
  })

  ipcMain.on(IPC_CHANNELS.CHAT_CANCEL, (_, sessionId: string) => {
    cancelChat(sessionId)
  })

  // === Configuration ===
  ipcMain.handle(IPC_CHANNELS.CONFIG_GET_MODELS, async () => {
    return await getModels()
  })

  ipcMain.handle(IPC_CHANNELS.CONFIG_GET_SETTINGS, async () => {
    return await getSettings()
  })

  ipcMain.handle(IPC_CHANNELS.CONFIG_UPDATE_SETTINGS, async (_, partial) => {
    return await updateSettings(partial)
  })

  // === Application ===
  ipcMain.handle(IPC_CHANNELS.APP_GET_INFO, () => {
    return {
      version: '0.1.0',
      platform: process.platform,
      arch: process.arch,
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
    }
  })

  ipcMain.handle(IPC_CHANNELS.APP_SELECT_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '选择工作目录',
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths[0]
  })

  ipcMain.handle(IPC_CHANNELS.APP_SELECT_FILES, async (_, workDir: string) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      title: '选择文件',
      filters: [
        { name: '图片和文档', extensions: ['png','jpg','jpeg','gif','webp','svg','pdf','txt','md','json','csv','ts','js','py','html','css'] },
        { name: '图片', extensions: ['png','jpg','jpeg','gif','webp','svg'] },
        { name: '文档', extensions: ['pdf','txt','md','json','csv','ts','js','py','html','css'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    // Copy files to workDir so Claude CLI can access them
    const uploadsDir = join(workDir, '__uploads__')
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true })
    }

    const copiedPaths: string[] = []
    for (const src of result.filePaths) {
      const name = basename(src)
      let dest = join(uploadsDir, name)
      // Avoid overwriting: append counter if file exists
      if (existsSync(dest)) {
        const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
        const base = name.includes('.') ? name.slice(0, name.lastIndexOf('.')) : name
        let counter = 1
        while (existsSync(join(uploadsDir, `${base}_${counter}${ext}`))) {
          counter++
        }
        dest = join(uploadsDir, `${base}_${counter}${ext}`)
      }
      try {
        copyFileSync(src, dest)
        copiedPaths.push(dest)
      } catch { /* skip files we can't copy */ }
    }

    return copiedPaths.length > 0 ? copiedPaths : null
  })

  // === MCP Management ===
  ipcMain.handle(IPC_CHANNELS.MCP_LIST, async () => {
    return listMcpServers()
  })

  ipcMain.handle(IPC_CHANNELS.MCP_ADD, async (_, server: import('../shared/types').McpServerConfig) => {
    addMcpServer(server)
  })

  ipcMain.handle(IPC_CHANNELS.MCP_UPDATE, async (_, name: string, server: import('../shared/types').McpServerConfig) => {
    updateMcpServer(name, server)
  })

  ipcMain.handle(IPC_CHANNELS.MCP_DELETE, async (_, name: string) => {
    deleteMcpServer(name)
  })

  ipcMain.handle(IPC_CHANNELS.MCP_WHITELIST_GET, async () => {
    return getWhitelist()
  })

  ipcMain.handle(IPC_CHANNELS.MCP_WHITELIST_SET, async (_, list: string[]) => {
    setWhitelist(list)
  })

  ipcMain.handle(IPC_CHANNELS.APP_LIST_FILES, async (_, workDir: string) => {
    return listFiles(workDir)
  })
}

function listFiles(workDir: string, maxDepth = 3): FileNode[] {
  const results: FileNode[] = []
  const ignore = new Set(['node_modules', '.git', '.next', 'dist', '__pycache__', '.venv', 'venv'])

  function walk(dir: string, depth: number): void {
    if (depth > maxDepth) return
    let entries
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }
    for (const name of entries) {
      if (ignore.has(name)) continue
      if (name.startsWith('.')) continue
      const fullPath = join(dir, name)
      let isDir = false
      try {
        isDir = statSync(fullPath).isDirectory()
      } catch {
        continue
      }
      const relPath = relative(workDir, fullPath).replace(/\\/g, '/')
      results.push({ name, path: relPath, isDir })
      if (isDir && depth < maxDepth) {
        walk(fullPath, depth + 1)
      }
    }
  }

  walk(workDir, 0)
  return results
}
