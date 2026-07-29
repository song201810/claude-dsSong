// src/shared/types.ts

// ============ IPC 通道名称 ============

export const IPC_CHANNELS = {
  // 会话管理
  SESSION_LIST: 'session:list',
  SESSION_CREATE: 'session:create',
  SESSION_GET: 'session:get',
  SESSION_DELETE: 'session:delete',

  // 聊天控制
  CHAT_SEND: 'chat:send',
  CHAT_CANCEL: 'chat:cancel',
  CHAT_TOKEN: 'chat:token',
  CHAT_ERROR: 'chat:error',
  CHAT_DONE: 'chat:done',

  // 配置
  CONFIG_GET_MODELS: 'config:get-models',
  CONFIG_GET_SETTINGS: 'config:get-settings',
  CONFIG_UPDATE_SETTINGS: 'config:update-settings',

  // 应用
  APP_GET_INFO: 'app:get-info',
  APP_SELECT_DIRECTORY: 'app:select-directory',
} as const

// ============ 数据类型 ============

export interface SessionSummary {
  id: string
  name: string
  workDir: string
  model: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

export interface Session extends SessionSummary {
  messages: Message[]
}

export interface Message {
  id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  thinking?: string
  toolCalls?: ToolCall[]
}

export interface ToolCall {
  name: string
  input: Record<string, unknown>
  output?: string
  status: 'pending' | 'running' | 'done' | 'error'
}

export interface ModelInfo {
  id: string
  name: string
  description: string
}

export interface Settings {
  defaultModel: string
  models: ModelInfo[]
}

export interface CreateSessionParams {
  name: string
  workDir: string
  model?: string
}

export interface SendMessageParams {
  sessionId: string
  message: string
  model: string
  assistantMessageId?: string  // pre-generated ID so ChatDoneEvent can carry it back
}

export interface ChatTokenEvent {
  sessionId: string
  messageId: string
  token: string
  thinking?: string
}

export interface ChatErrorEvent {
  sessionId: string
  messageId: string
  error: string
}

export interface ChatDoneEvent {
  sessionId: string
  messageId: string
  fullContent: string
}
