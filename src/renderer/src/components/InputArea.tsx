// src/renderer/src/components/InputArea.tsx
import React, { useState, useRef } from 'react'
import ModelSelect from './ModelSelect'
import { useAppContext } from '../context/AppContext'

export default function InputArea() {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { state, sendMessage, cancelMessage } = useAppContext()

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
    if (e.key === 'Escape' && state.isStreaming) {
      cancelMessage()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  return (
    <div className="border-t border-[#3a3430] px-4 py-3 bg-[#1c1917]">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          className="flex-1 bg-[#332e2b] border border-[#3a3430] rounded-2xl px-4 py-2.5 text-sm
                     text-[#faf7f2] placeholder-[#6b6560]
                     resize-none focus:outline-none focus:border-[#f0836a] focus:ring-1 focus:ring-[#f0836a]/20
                     transition-all max-h-[200px]"
          placeholder={state.isStreaming ? 'Claude 正在生成...' : '输入消息...'}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={state.isStreaming}
        />
        {state.isStreaming ? (
          <button
            className="px-5 py-2.5 rounded-2xl bg-[#f0836a]/20 text-[#f0836a] border border-[#f0836a]/30
                       text-sm transition-all font-medium hover:bg-[#f0836a]/30"
            onClick={cancelMessage}
          >
            停止
          </button>
        ) : (
          <button
            className="px-5 py-2.5 rounded-2xl bg-[#f0836a] hover:bg-[#e0684e] text-white text-sm
                       transition-all font-medium disabled:opacity-40 disabled:cursor-not-allowed
                       shadow-lg shadow-[#f0836a]/20"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            发送
          </button>
        )}
      </div>
      <div className="flex items-center justify-between mt-2 px-1">
        <ModelSelect />
        <div className="flex items-center gap-3 text-[10px] text-[#6b6560]">
          <span><kbd className="px-1 py-0.5 bg-[#332e2b] rounded font-mono text-[10px] text-[#a8a29e]">Enter</kbd> 发送</span>
          <span className="w-px h-3 bg-[#3a3430]" />
          <span><kbd className="px-1 py-0.5 bg-[#332e2b] rounded font-mono text-[10px] text-[#a8a29e]">Shift+Enter</kbd> 换行</span>
          <span className="w-px h-3 bg-[#3a3430]" />
          <span><kbd className="px-1 py-0.5 bg-[#332e2b] rounded font-mono text-[10px] text-[#a8a29e]">Esc</kbd> 取消</span>
        </div>
      </div>
    </div>
  )
}
