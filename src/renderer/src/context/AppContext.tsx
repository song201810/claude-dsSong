// src/renderer/src/context/AppContext.tsx
import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'
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
        error: null,
        // NOTE: keep streamingAssistantId so onChatDone can use it to find the message
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
  const stateRef = useRef(state)
  stateRef.current = state  // always reflects latest state for closures

  const loadSessions = useCallback(async () => {
    const sessions = await window.api.listSessions()
    console.log('[AppContext] loadSessions, count:', sessions.length)
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
      name, workDir, model: state.currentModel,
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
    const cur = stateRef.current
    if (!cur.currentSessionId || cur.isStreaming) return

    const userMsgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const assistantId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-asst`

    // User message
    const userMsg: Message = {
      id: userMsgId, sessionId: cur.currentSessionId, role: 'user',
      content, timestamp: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_MESSAGE', payload: userMsg })
    window.api.appendMessage(cur.currentSessionId, userMsg).catch(() => {})

    // Assistant placeholder
    const asstMsg: Message = {
      id: assistantId, sessionId: cur.currentSessionId, role: 'assistant',
      content: '', timestamp: new Date().toISOString(),
    }
    dispatch({ type: 'ADD_MESSAGE', payload: asstMsg })
    dispatch({ type: 'START_STREAMING', payload: { assistantId } })

    window.api.sendMessage({
      sessionId: cur.currentSessionId, message: content, model: cur.currentModel,
      assistantMessageId: assistantId,  // send back with ChatDoneEvent for reliable lookup
    })
  }, [])  // no stale deps — uses stateRef

  const cancelMessage = useCallback(() => {
    const cur = stateRef.current
    if (cur.currentSessionId) window.api.cancelChat(cur.currentSessionId)
  }, [])

  const loadModels = useCallback(async () => {
    const models = await window.api.getModels()
    dispatch({ type: 'SET_MODELS', payload: models })
  }, [])

  // --- IPC listeners (registered once, uses stateRef to avoid stale closures) ---
  useEffect(() => {
    const c1 = window.api.onChatToken((data) => {
      console.log('[AppContext] TOKEN len', data.token.length)
      dispatch({ type: 'APPEND_TOKEN', payload: { token: data.token, thinking: data.thinking } })
    })
    const c2 = window.api.onChatError((data) => {
      console.log('[AppContext] ERROR', data.error)
      dispatch({ type: 'SET_ERROR', payload: data.error })
    })
    const c3 = window.api.onChatDone(async (data) => {
      const cur = stateRef.current
      // Use the messageId from the main process — it's the assistant message ID
      // that was sent in START_STREAMING. This is reliable even if the user
      // sends another message before this callback fires.
      console.log('[AppContext] DONE, messageId from main:', data.messageId, 'streamingAssistantId:', cur.streamingAssistantId, 'msg count:', cur.messages.length)
      const assistantMsg = cur.messages.find(m => m.id === data.messageId)
      console.log('[AppContext] DONE assistantMsg found:', !!assistantMsg, 'content len:', assistantMsg?.content?.length)
      if (cur.currentSessionId && assistantMsg && assistantMsg.content) {
        console.log('[AppContext] DONE persisting assistant msg, sessionId:', cur.currentSessionId)
        try {
          await window.api.appendMessage(cur.currentSessionId, assistantMsg)
          console.log('[AppContext] DONE persist OK')
        } catch (e) { console.log('[AppContext] DONE persist FAIL:', e) }
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
