// src/renderer/src/components/InputArea.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Paperclip } from 'lucide-react'
import ModelSelect from './ModelSelect'
import FileDropdown from './FileDropdown'
import FileAttachment from './FileAttachment'
import McpSelector from './McpSelector'
import { useAppContext } from '../context/AppContext'
import type { FileNode } from '../../../shared/types'

export default function InputArea() {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { state, sendMessage, removeAttachedFile, addAttachedFiles, enabledMcp, setEnabledMcp } = useAppContext()

  // @file autocomplete state
  const [atFilter, setAtFilter] = useState('')
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [files, setFiles] = useState<FileNode[]>([])
  const [atActive, setAtActive] = useState(false)

  // Parse @ trigger from cursor position
  const checkAtTrigger = useCallback((value: string, cursorPos: number) => {
    const textBefore = value.slice(0, cursorPos)
    const atIdx = textBefore.lastIndexOf('@')

    if (atIdx === -1 || atIdx > 0 && /\w/.test(textBefore[atIdx - 1])) {
      setAtActive(false)
      setAtFilter('')
      setAnchorRect(null)
      return
    }

    const filterText = textBefore.slice(atIdx + 1)
    if (filterText.includes(' ')) {
      setAtActive(false)
      setAtFilter('')
      setAnchorRect(null)
      return
    }

    setAtFilter(filterText)
    setAtActive(true)
  }, [])

  // Fetch files when at-trigger activates
  useEffect(() => {
    if (!atActive || !state.currentSessionId) return
    const session = state.sessions.find(s => s.id === state.currentSessionId)
    if (!session?.workDir) return

    window.api.listFiles(session.workDir).then(setFiles).catch(() => setFiles([]))
  }, [atActive, state.currentSessionId, state.sessions])

  // Update anchor rect on render
  useEffect(() => {
    if (atActive && textareaRef.current) {
      setAnchorRect(textareaRef.current.getBoundingClientRect())
    }
  }, [atActive, input /* re-measure when content changes size */])

  const handleFileSelect = useCallback((relPath: string) => {
    if (!textareaRef.current) return

    const el = textareaRef.current
    const cursorPos = el.selectionStart
    const value = el.value
    const textBefore = value.slice(0, cursorPos)
    const atIdx = textBefore.lastIndexOf('@')

    if (atIdx === -1) return

    const beforeAt = value.slice(0, atIdx)
    const afterCursor = value.slice(cursorPos)
    const newValue = beforeAt + '@' + relPath + ' ' + afterCursor

    setInput(newValue)
    setAtActive(false)
    setAtFilter('')
    setAnchorRect(null)

    const newCursorPos = atIdx + relPath.length + 2
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(newCursorPos, newCursorPos)
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`
    }, 0)
  }, [])

  const handleCloseDropdown = useCallback(() => {
    setAtActive(false)
    setAtFilter('')
    setAnchorRect(null)
  }, [])

  const handleAttach = useCallback(async () => {
    const session = state.sessions.find(s => s.id === state.currentSessionId)
    if (!session?.workDir) return
    const result = await window.api.selectFiles(session.workDir)
    if (result && result.length > 0) {
      addAttachedFiles(result)
    }
  }, [addAttachedFiles, state.sessions, state.currentSessionId])

  if (!state.currentSessionId) return null

  const handleSend = () => {
    const content = input.trim()
    if (!content || state.isStreaming) return
    sendMessage(content)
    setInput('')
    setAtActive(false)
    setAtFilter('')
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
    const value = e.target.value
    setInput(value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
    const cursorPos = el.selectionStart
    checkAtTrigger(value, cursorPos)
  }

  const attachedFiles = state.attachedFiles || []

  return (
    <div className="border-t border-[var(--border)] px-4 py-3 bg-[var(--bg-root)]">
      {/* File attachment tags */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2 max-h-[120px] overflow-y-auto">
          {attachedFiles.map((f) => (
            <FileAttachment
              key={f}
              filePath={f}
              onRemove={() => removeAttachedFile(f)}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {/* Attach button */}
        <button
          className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--bg-input)] border border-[var(--border)]
                     hover:bg-[var(--bg-hover)] hover:border-[var(--accent)]
                     text-[var(--fg-dim)] hover:text-[var(--accent)]
                     transition-all flex items-center justify-center
                     focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          onClick={handleAttach}
          title="选择文件"
          disabled={state.isStreaming}
        >
          <Paperclip size={16} />
        </button>

        {/* MCP Selector */}
        <McpSelector
          enabled={enabledMcp}
          onChange={setEnabledMcp}
        />

        <div className="flex-1 flex items-stretch bg-[var(--bg-input)] border border-[var(--border)] rounded-lg
                        focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)]/20
                        transition-all">
          <textarea
            ref={textareaRef}
            className="flex-1 bg-transparent px-3 py-1.5 text-[13px] leading-5
                       text-[var(--fg-primary)] placeholder-[var(--fg-dim)]
                       resize-none focus:outline-none
                       max-h-[200px]"
            placeholder={state.isStreaming ? 'Claude 正在生成...' : '输入消息...'}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={state.isStreaming}
        />
        </div>
        <button
          className="flex-shrink-0 px-4 h-8 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[13px] leading-none
                     transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed
                     shadow-lg shadow-[var(--accent)]/20 flex items-center justify-center
                     focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 focus:ring-offset-[var(--bg-root)]"
          onClick={handleSend}
          disabled={!input.trim() || state.isStreaming}
        >
          发送
        </button>
      </div>

      {/* Rendered via portal, takes anchorRect directly */}
      <FileDropdown
        filter={atFilter}
        files={files}
        anchorRect={anchorRect}
        onSelect={handleFileSelect}
        onClose={handleCloseDropdown}
      />

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
