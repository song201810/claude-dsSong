// src/main/ipc-handlers.ts
import { ipcMain, BrowserWindow, dialog } from 'electron'
import { IPC_CHANNELS } from '../shared/types'
import { listSessions, createSession, getSession, deleteSession, appendMessage } from './session-store'
import { listGroups, createGroup, deleteGroup, renameGroup, addSessionToGroup, removeSessionFromGroup } from './group-store'
import { getSettings, updateSettings, getModels } from './config-manager'
import { startChat, cancelChat } from './claude-manager'

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

  ipcMain.handle(IPC_CHANNELS.GROUP_DELETE, async (_, id: string) => {
    await deleteGroup(id)
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
}
