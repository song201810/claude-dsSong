// src/renderer/src/components/SessionItem.tsx
import React, { useState, useRef, useEffect } from 'react'
import type { SessionSummary } from '../../../shared/types'

interface Props {
  session: SessionSummary
  isActive: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onContextMenu?: (e: React.MouseEvent) => void
  isIndented?: boolean
}

export default function SessionItem({ session, isActive, onSelect, onDelete, onContextMenu, isIndented }: Props) {
  const [confirming, setConfirming] = useState(false)
  const deleteBtnRef = useRef<HTMLButtonElement>(null)

  // Close confirmation on outside click
  useEffect(() => {
    if (!confirming) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (deleteBtnRef.current?.contains(target)) return
      const confirmEl = document.querySelector('.session-delete-confirm')
      if (confirmEl?.contains(target)) return
      setConfirming(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [confirming])

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirming(true)
  }

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirming(false)
    onDelete(session.id)
  }

  return (
    <div
      className={`
        group flex items-center px-3 py-2 cursor-pointer border-b border-[var(--border-muted)]
        transition-colors duration-150
        ${isActive ? 'bg-[var(--bg-active)]' : 'hover:bg-[var(--bg-hover)]'}
        ${isIndented ? 'pl-7' : ''}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-inset
      `}
      onClick={() => onSelect(session.id)}
      onContextMenu={(e) => {
        e.preventDefault()
        onContextMenu?.(e)
      }}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(session.id) }}
    >
      <span className={`text-[13px] font-medium truncate flex-1 ${isActive ? 'text-[var(--fg-primary)]' : 'text-[var(--fg-muted)]'}`}>
        {session.name}
      </span>

      {/* Delete button: shows inline confirm on first click, confirms on second */}
      {confirming ? (
        <div
          className="session-delete-confirm flex items-center gap-1 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[11px] text-[var(--fg-dim)]">删除?</span>
          <button
            className="px-1.5 py-0.5 text-[11px] rounded bg-[var(--accent)] hover:bg-[var(--accent-hover)]
                       text-white font-medium transition-colors"
            onClick={handleConfirmDelete}
          >
            确认
          </button>
          <button
            className="px-1.5 py-0.5 text-[11px] rounded bg-[var(--bg-card)] hover:bg-[var(--bg-input)]
                       text-[var(--fg-muted)] transition-colors"
            onClick={(e) => { e.stopPropagation(); setConfirming(false) }}
          >
            取消
          </button>
        </div>
      ) : (
        <button
          ref={deleteBtnRef}
          className="opacity-0 group-hover:opacity-100 text-[var(--fg-dim)] hover:text-[var(--accent)]
                     text-[11px] px-1 py-0.5 rounded transition-all min-w-[44px] min-h-[44px]
                     focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          onClick={handleDeleteClick}
          title="删除会话"
        >
          ✕
        </button>
      )}
    </div>
  )
}
