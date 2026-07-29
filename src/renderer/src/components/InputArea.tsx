// src/renderer/src/components/InputArea.tsx
import React, { useState, useRef } from 'react'
import ModelSelect from './ModelSelect'
import { useAppContext } from '../context/AppContext'

export default function InputArea() {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { state, sendMessage } = useAppContext()

  if (!state.currentSessionId) return null

  const handleSend = () => {
    const content = input.trim()
    if (!content || state.isStreaming) return
    sendMessage(content)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  return (
    <div className="border-t border-[var(--border)] px-4 py-3 bg-[var(--bg-root)]">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          className="flex-1 bg-[var(--bg-input)] border border-[var(--border)] rounded-2xl px-4 py-2.5 text-sm
                     text-[var(--fg-primary)] placeholder-[var(--fg-dim)]
                     resize-none focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20
                     transition-all max-h-[200px]"
          placeholder={state.isStreaming ? 'Claude 正在生成...' : '输入消息...'}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={state.isStreaming}
        />
        <button
          className="px-5 py-2.5 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm
                     transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed
                     shadow-lg shadow-[var(--accent)]/20
                     focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-root)]"
          onClick={handleSend}
          disabled={!input.trim() || state.isStreaming}
        >
          发送
        </button>
      </div>
      <div className="flex items-center justify-between mt-2 px-1">
        <ModelSelect />
        <div className="flex items-center gap-3 text-[10px] text-[var(--fg-dim)]">
          <span><kbd className="px-1 py-0.5 bg-[var(--bg-input)] rounded font-mono text-[10px] text-[var(--fg-muted)]">Enter</kbd> 发送</span>
          <span className="w-px h-3 bg-[var(--border)]" />
          <span><kbd className="px-1 py-0.5 bg-[var(--bg-input)] rounded font-mono text-[10px] text-[var(--fg-muted)]">Shift+Enter</kbd> 换行</span>
        </div>
      </div>
    </div>
  )
}
