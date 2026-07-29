// src/renderer/src/components/ChatView.tsx
import React, { useRef, useEffect, useState } from 'react'
import MessageBubble from './MessageBubble'
import { useAppContext } from '../context/AppContext'

function ErrorBanner({ error, onDismiss }: { error: string; onDismiss: () => void }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300) }, 8000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className={`mx-4 mb-4 px-4 py-3 rounded-lg bg-red-900/40 border border-red-700/60
                  text-red-200 text-sm flex items-start gap-3 transition-all duration-300
                  ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
    >
      <span className="text-lg flex-shrink-0 mt-0.5">⚠️</span>
      <span className="flex-1 leading-relaxed">{error}</span>
      <button
        className="flex-shrink-0 text-red-300 hover:text-red-100 transition-colors text-sm px-1"
        onClick={() => { setVisible(false); setTimeout(onDismiss, 300) }}
        title="关闭"
      >
        ✕
      </button>
    </div>
  )
}

export default function ChatView() {
  const { state, dispatch } = useAppContext()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages, state.isStreaming])

  if (state.messages.length === 0 && !state.isStreaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">🤖</div>
        <h2 className="text-xl font-semibold mb-2">Claude Code Desktop</h2>
        <p className="text-gray-400 text-sm max-w-md">
          在下方输入消息开始对话。选择左侧会话或新建一个会话。
        </p>
        <div className="mt-6 flex gap-2 text-xs text-gray-600">
          <kbd className="px-2 py-1 bg-[#1a1b1e] rounded">Enter</kbd>
          <span className="self-center">发送</span>
          <kbd className="px-2 py-1 bg-[#1a1b1e] rounded">Shift+Enter</kbd>
          <span className="self-center">换行</span>
          <kbd className="px-2 py-1 bg-[#1a1b1e] rounded">Esc</kbd>
          <span className="self-center">取消</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto py-4">
      {state.messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} isStreaming={state.isStreaming} />
      ))}

      {state.error && (
        <ErrorBanner
          error={state.error}
          onDismiss={() => dispatch({ type: 'SET_ERROR', payload: null })}
        />
      )}

      <div ref={bottomRef} />
    </div>
  )
}
