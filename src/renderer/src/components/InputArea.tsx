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
    <div className="border-t border-gray-700/50 px-4 py-3 bg-[#1e1f22]">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          className="flex-1 bg-[#313338] border border-gray-600 rounded-xl px-4 py-2.5 text-sm
                     resize-none focus:outline-none focus:border-[#6c8ce0] transition-colors
                     placeholder-gray-500 max-h-[200px]"
          placeholder={state.isStreaming ? 'Claude 正在生成...' : '输入消息...'}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={state.isStreaming}
        />
        {state.isStreaming ? (
          <button
            className="px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-sm
                       transition-colors font-medium"
            onClick={cancelMessage}
          >
            停止
          </button>
        ) : (
          <button
            className="px-4 py-2.5 rounded-xl bg-[#6c8ce0] hover:bg-blue-500 text-sm
                       transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            发送
          </button>
        )}
      </div>
      <div className="flex items-center justify-between mt-2 px-1">
        <ModelSelect />
      </div>
    </div>
  )
}
