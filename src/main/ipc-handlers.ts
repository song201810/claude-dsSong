// src/main/ipc-handlers.ts
import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../shared/types'
import { listSessions, createSession, getSession, deleteSession } from './session-store'
import { getSettings, updateSettings, getModels } from './config-manager'

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

  // === Chat Control ===
  // NOTE: chat:send and chat:cancel are implemented when Claude Manager is created
  ipcMain.on(IPC_CHANNELS.CHAT_SEND, (_event, _params) => {
    // TODO: Implement when Claude Manager is ready
  })

  ipcMain.on(IPC_CHANNELS.CHAT_CANCEL, (_event, _sessionId: string) => {
    // TODO: Implement when Claude Manager is ready
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
}
