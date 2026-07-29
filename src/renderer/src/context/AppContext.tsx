// src/renderer/src/context/AppContext.tsx
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import type { SessionSummary, Message, ModelInfo } from '../../../shared/types'

// ============ State ============
interface AppState {
  sessions: SessionSummary[]
  currentSessionId: string | null
  messages: Message[]
  models: ModelInfo[]
  currentModel: string
  isLoading: boolean
  isStreaming: boolean
  streamingAssistantId: string | null
  error: string | null
}

const initialState: AppState = {
  sessions: [],
  currentSessionId: null,
  messages: [],
  models: [],
  currentModel: 'claude-sonnet-4-6',
  isLoading: false,
  isStreaming: false,
  streamingAssistantId: null,
  error: null,
}

// ============ Actions ============
type Action =
  | { type: 'SET_SESSIONS'; payload: SessionSummary[] }
  | { type: 'SET_CURRENT_SESSION'; payload: string }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'SET_MODELS'; payload: ModelInfo[] }
  | { type: 'SET_CURRENT_MODEL'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'START_STREAMING'; payload: { assistantId: string } }
  | { type: 'APPEND_TOKEN'; payload: { token: string; thinking?: string } }
  | { type: 'FINISH_STREAMING' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'REMOVE_SESSION'; payload: string }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload }
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSessionId: action.payload }
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload }
    case 'SET_MODELS':
      return { ...state, models: action.payload }
    case 'SET_CURRENT_MODEL':
      return { ...state, currentModel: action.payload }
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] }
    case 'START_STREAMING':
      return {
        ...state,
        isStreaming: true,
        streamingAssistantId: action.payload.assistantId,
        error: null,
      }
    case 'APPEND_TOKEN': {
      const { token, thinking } = action.payload
      const updated = state.messages.map(m => {
        if (m.id !== state.streamingAssistantId) return m
        return {
          ...m,
          content: m.content + token,
          thinking: thinking ?? m.thinking,
        }
      })
      return { ...state, messages: updated }
    }
    case 'FINISH_STREAMING':
      return {
        ...state,
        isStreaming: false,
        streamingAssistantId: null,
        error: null,
      }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isStreaming: false }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'REMOVE_SESSION':
      return {
        ...state,
        sessions: state.sessions.filter(s => s.id !== action.payload),
        currentSessionId:
          state.currentSessionId === action.payload ? null : state.currentSessionId,
        messages:
          state.currentSessionId === action.payload ? [] : state.messages,
      }
    default:
      return state
  }
}

// ============ Context ============
interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<Action>
  loadSessions: () => Promise<void>
  switchSession: (sessionId: string) => Promise<void>
  createSession: (name: string, workDir: string) => Promise<void>
  removeSession: (sessionId: string) => Promise<void>
  sendMessage: (content: string) => void
  cancelMessage: () => void
  loadModels: () => Promise<void>
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const loadSessions = useCallback(async () => {
    const sessions = await window.api.listSessions()
    dispatch({ type: 'SET_SESSIONS', payload: sessions })
  }, [])

  const switchSession = useCallback(async (sessionId: string) => {
    dispatch({ type: 'SET_CURRENT_SESSION', payload: sessionId })
    const session = await window.api.getSession(sessionId)
    if (session) {
      dispatch({ type: 'SET_MESSAGES', payload: session.messages })
      if (session.model) {
        dispatch({ type: 'SET_CURRENT_MODEL', payload: session.model })
      }
    }
  }, [])

  const createSession = useCallback(async (name: string, workDir: string) => {
    const session = await window.api.createSession({
      name,
      workDir,
      model: state.currentModel,
    })
    await loadSessions()
    dispatch({ type: 'SET_CURRENT_SESSION', payload: session.id })
    dispatch({ type: 'SET_MESSAGES', payload: [] })
  }, [state.currentModel, loadSessions])

  const removeSession = useCallback(async (sessionId: string) => {
    await window.api.deleteSession(sessionId)
    dispatch({ type: 'REMOVE_SESSION', payload: sessionId })
  }, [])

  const sendMessage = useCallback((content: string) => {
    if (!state.currentSessionId || state.isStreaming) return

    const userMsgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const assistantId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-asst`

    // Add user message + persist immediately
    const userMsg: Message = {
      id: userMsgId, sessionId: state.currentSessionId, role: 'user',
      content, timestamp: new Date().toISOString()
    }
    dispatch({ type: 'ADD_MESSAGE', payload: userMsg })
    window.api.appendMessage(state.currentSessionId, userMsg).catch(() => {})

    // Add empty assistant placeholder
    const asstMsg: Message = {
      id: assistantId, sessionId: state.currentSessionId, role: 'assistant',
      content: '', timestamp: new Date().toISOString()
    }
    dispatch({ type: 'ADD_MESSAGE', payload: asstMsg })
    dispatch({ type: 'START_STREAMING', payload: { assistantId } })

    window.api.sendMessage({
      sessionId: state.currentSessionId,
      message: content,
      model: state.currentModel,
    })
  }, [state.currentSessionId, state.currentModel, state.isStreaming])

  const cancelMessage = useCallback(() => {
    if (state.currentSessionId) {
      window.api.cancelChat(state.currentSessionId)
    }
  }, [state.currentSessionId])

  const loadModels = useCallback(async () => {
    const models = await window.api.getModels()
    dispatch({ type: 'SET_MODELS', payload: models })
  }, [])

  // Listen for IPC events from main process
  useEffect(() => {
    const c1 = window.api.onChatToken((data) => {
      dispatch({ type: 'APPEND_TOKEN', payload: { token: data.token, thinking: data.thinking } })
    })
    const c2 = window.api.onChatError((data) => {
      dispatch({ type: 'SET_ERROR', payload: data.error })
    })
    const c3 = window.api.onChatDone(async () => {
      // Save the final assistant content before clearing streaming state
      if (state.streamingAssistantId) {
        const assistantMsg = state.messages.find(m => m.id === state.streamingAssistantId)
        if (assistantMsg && assistantMsg.content) {
          await window.api.appendMessage(state.currentSessionId!, assistantMsg).catch(() => {})
        }
      }
      dispatch({ type: 'FINISH_STREAMING' })
      await loadSessions()
    })
    return () => { c1(); c2(); c3() }
  }, [loadSessions])

  useEffect(() => {
    loadSessions()
    loadModels()
  }, [loadSessions, loadModels])

  return (
    <AppContext.Provider
      value={{
        state, dispatch,
        loadSessions, switchSession, createSession, removeSession,
        sendMessage, cancelMessage, loadModels,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
