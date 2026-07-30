// src/renderer/src/components/GroupHeader.tsx
import React, { useState, useRef, useEffect } from 'react'
import { ChevronRight, ChevronDown, Plus, MoreHorizontal } from 'lucide-react'
import type { SessionGroup } from '../../../shared/types'

interface Props {
  group: SessionGroup
  isExpanded: boolean
  sessionCount: number
  onToggle: () => void
  onRename: (newName: string) => void
  onDelete: () => void
  onCreateSession: () => void
}

export default function GroupHeader({
  group,
  isExpanded,
  sessionCount,
  onToggle,
  onRename,
  onDelete,
  onCreateSession,
}: Props) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(group.name)
  const [showMenu, setShowMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isRenaming])

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMenu])

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== group.name) {
      onRename(trimmed)
    } else {
      setRenameValue(group.name)
    }
    setIsRenaming(false)
  }

  const handleDeleteClick = () => {
    setShowMenu(false)
    if (confirm(`确定删除分组「${group.name}」？会话将保留但取消分组。`)) {
      onDelete()
    }
  }

  return (
    <div
      className="group-header flex items-center px-3 py-1.5 cursor-pointer
                 border-l-[3px] border-[var(--accent)] bg-[var(--accent-soft)]
                 hover:bg-[var(--bg-hover)] transition-colors duration-150
                 select-none"
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle() }}
    >
      {/* Chevron */}
      <span className="mr-1 text-[var(--fg-muted)] flex-shrink-0">
        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </span>

      {/* Group name (double-click to rename) */}
      {isRenaming ? (
        <input
          ref={inputRef}
          className="flex-1 min-w-0 bg-[var(--bg-input)] text-[var(--fg-primary)] text-[13px]
                     px-1.5 py-0.5 rounded border border-[var(--accent)]
                     focus:outline-none"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRenameSubmit()
            if (e.key === 'Escape') {
              setRenameValue(group.name)
              setIsRenaming(false)
            }
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="flex-1 text-[13px] font-medium text-[var(--fg-primary)] truncate min-w-0"
          onDoubleClick={(e) => {
            e.stopPropagation()
            setIsRenaming(true)
          }}
          title="双击重命名"
        >
          {group.name}
        </span>
      )}

      {/* Session count badge */}
      <span className="text-[11px] text-[var(--fg-dim)] mr-1 flex-shrink-0">
        {sessionCount}
      </span>

      {/* Add session button */}
      <button
        className="flex items-center justify-center w-6 h-6 rounded
                   hover:bg-[var(--bg-active)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)]
                   transition-colors flex-shrink-0"
        onClick={(e) => { e.stopPropagation(); onCreateSession() }}
        title="在此分组中新建会话"
      >
        <Plus size={13} />
      </button>

      {/* More menu */}
      <div className="relative flex-shrink-0" ref={menuRef}>
        <button
          className="flex items-center justify-center w-6 h-6 rounded
                     hover:bg-[var(--bg-active)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)]
                     transition-colors"
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
          title="更多操作"
        >
          <MoreHorizontal size={13} />
        </button>

        {showMenu && (
          <div
            className="absolute right-0 top-full mt-1 z-50 min-w-[120px]
                       bg-[var(--bg-side)] border border-[var(--border)] rounded-lg shadow-xl py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full text-left px-3 py-1.5 text-[13px] text-[var(--fg-primary)]
                         hover:bg-[var(--bg-hover)] transition-colors"
              onClick={() => { setShowMenu(false); setIsRenaming(true) }}
            >
              重命名
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-[13px] text-[var(--accent)]
                         hover:bg-[var(--bg-hover)] transition-colors"
              onClick={handleDeleteClick}
            >
              删除分组
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
