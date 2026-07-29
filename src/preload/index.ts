// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'
import {
  IPC_CHANNELS,
  type SessionSummary,
  type Session,
  type Message,
  type ModelInfo,
  type Settings,
  type CreateSessionParams,
  type SendMessageParams,
  type ChatTokenEvent,
  type ChatErrorEvent,
  type ChatDoneEvent,
} from '../shared/types'

const api = {
  // === Sessions ===
  listSessions: (): Promise<SessionSummary[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_LIST),

  createSession: (params: CreateSessionParams): Promise<Session> =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_CREATE, params),

  getSession: (id: string): Promise<Session | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_GET, id),

  deleteSession: (id: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_DELETE, id),

  appendMessage: (sessionId: string, message: Message): Promise<void> =>
    ipcRenderer.invoke('session:append-message', sessionId, message),

  // === Chat ===
  sendMessage: (params: SendMessageParams): void =>
    ipcRenderer.send(IPC_CHANNELS.CHAT_SEND, params),

  cancelChat: (sessionId: string): void =>
    ipcRenderer.send(IPC_CHANNELS.CHAT_CANCEL, sessionId),

  onChatToken: (callback: (data: ChatTokenEvent) => void): (() => void) => {
    const handler = (_: unknown, data: ChatTokenEvent) => callback(data)
    ipcRenderer.on(IPC_CHANNELS.CHAT_TOKEN, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CHAT_TOKEN, handler)
  },

  onChatError: (callback: (data: ChatErrorEvent) => void): (() => void) => {
    const handler = (_: unknown, data: ChatErrorEvent) => callback(data)
    ipcRenderer.on(IPC_CHANNELS.CHAT_ERROR, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CHAT_ERROR, handler)
  },

  onChatDone: (callback: (data: ChatDoneEvent) => void): (() => void) => {
    const handler = (_: unknown, data: ChatDoneEvent) => callback(data)
    ipcRenderer.on(IPC_CHANNELS.CHAT_DONE, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CHAT_DONE, handler)
  },

  // === Configuration ===
  getModels: (): Promise<ModelInfo[]> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET_MODELS),

  getSettings: (): Promise<Settings> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET_SETTINGS),

  updateSettings: (partial: Partial<Settings>): Promise<Settings> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_UPDATE_SETTINGS, partial),

  // === Application ===
  getAppInfo: (): Promise<{ version: string; platform: string }> =>
    ipcRenderer.invoke(IPC_CHANNELS.APP_GET_INFO),

  selectDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.APP_SELECT_DIRECTORY),
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronApi = typeof api
