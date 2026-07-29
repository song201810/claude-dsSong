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
      className={`mx-4 mb-4 px-4 py-3 rounded-xl bg-[var(--error-bg)] border border-[var(--error-border)]
                  text-[var(--error-text)] text-sm flex items-start gap-3 transition-all duration-300
                  ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
    >
      <span className="text-lg flex-shrink-0 mt-0.5">⚠️</span>
      <span className="flex-1 leading-relaxed">{error}</span>
      <button
        className="flex-shrink-0 text-[var(--error-text)] hover:text-[var(--fg-primary)] transition-colors text-sm px-1"
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
        <div className="relative mb-6">
          <div className="text-6xl">🤖</div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--accent)] animate-pulse shadow-lg shadow-[var(--accent)]/30" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-[var(--fg-primary)]">开始对话</h2>
        <p className="text-[var(--fg-muted)] text-sm max-w-md">
          在下方输入你的问题，Claude 将为你提供帮助。
        </p>
        <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg w-full">
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[var(--bg-side)] border border-[var(--border)]">
            <kbd className="px-2.5 py-1 text-xs bg-[var(--bg-input)] rounded-md font-mono text-[var(--fg-primary)]">Enter</kbd>
            <span className="text-xs text-[var(--fg-dim)]">发送消息</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[var(--bg-side)] border border-[var(--border)]">
            <kbd className="px-2.5 py-1 text-xs bg-[var(--bg-input)] rounded-md font-mono text-[var(--fg-primary)]">Shift + Enter</kbd>
            <span className="text-xs text-[var(--fg-dim)]">换行</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[var(--bg-side)] border border-[var(--border)]">
            <kbd className="px-2.5 py-1 text-xs bg-[var(--bg-input)] rounded-md font-mono text-[var(--fg-primary)]">Esc</kbd>
            <span className="text-xs text-[var(--fg-dim)]">取消生成</span>
          </div>
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
