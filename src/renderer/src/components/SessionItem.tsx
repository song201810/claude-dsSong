// src/renderer/src/components/SessionItem.tsx
import React from 'react'
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
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`确定删除会话「${session.name}」？`)) {
      onDelete(session.id)
    }
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
      <button
        className="opacity-0 group-hover:opacity-100 text-[var(--fg-dim)] hover:text-[var(--accent)]
                   text-[11px] px-1 py-0.5 rounded transition-all min-w-[44px] min-h-[44px]
                   focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        onClick={handleDelete}
        title="删除会话"
      >
        ✕
      </button>
    </div>
  )
}
