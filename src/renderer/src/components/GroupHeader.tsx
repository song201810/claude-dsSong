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
  onDelete: (deleteSessions?: boolean) => void
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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const moreBtnRef = useRef<HTMLButtonElement>(null)
  const [menuPos, setMenuPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 })

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isRenaming])

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu && !confirmDelete) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      // Don't close if clicking on the more button or inside the menu
      if (moreBtnRef.current?.contains(target)) return
      // Check if click is inside any menu element
      const menuEl = document.querySelector('.group-dropdown-menu')
      if (menuEl?.contains(target)) return
      setShowMenu(false)
      setConfirmDelete(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMenu, confirmDelete])

  const openMenu = () => {
    if (moreBtnRef.current) {
      const rect = moreBtnRef.current.getBoundingClientRect()
      setMenuPos({ left: rect.right - 120, top: rect.bottom + 4 })
    }
    setShowMenu(true)
  }

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
    setConfirmDelete(true)
  }

  const handleConfirmDelete = (deleteSessions: boolean) => {
    setConfirmDelete(false)
    onDelete(deleteSessions)
  }

  return (
    <>
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

        {/* More button */}
        <button
          ref={moreBtnRef}
          className="flex items-center justify-center w-6 h-6 rounded
                     hover:bg-[var(--bg-active)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)]
                     transition-colors flex-shrink-0"
          onClick={(e) => { e.stopPropagation(); openMenu() }}
          title="更多操作"
        >
          <MoreHorizontal size={13} />
        </button>
      </div>

      {/* Dropdown menu — rendered at fixed position to avoid overflow clipping */}
      {showMenu && (
        <div
          className="group-dropdown-menu fixed z-[100] min-w-[120px]
                     bg-[var(--bg-side)] border border-[var(--border)] rounded-lg shadow-xl py-1"
          style={{ left: menuPos.left, top: menuPos.top }}
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

      {/* Inline delete confirmation — two options */}
      {confirmDelete && (
        <div className="group-dropdown-menu fixed z-[100] min-w-[280px]
                        bg-[var(--bg-side)] border border-[var(--border)] rounded-lg shadow-xl p-4"
          style={{ left: Math.min(menuPos.left, window.innerWidth - 300), top: menuPos.top }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[13px] text-[var(--fg-primary)] mb-3">
            删除分组「{group.name}」？
          </p>

          {/* Option 1: Release sessions to ungrouped */}
          <button
            className="w-full text-left px-3 py-2 rounded-md mb-2
                       bg-[var(--bg-card)] hover:bg-[var(--bg-input)] transition-colors
                       border border-[var(--border)]"
            onClick={() => handleConfirmDelete(false)}
          >
            <span className="text-[13px] font-medium text-[var(--fg-primary)] block">
              保留会话，取消分组
            </span>
            <span className="text-[11px] text-[var(--fg-dim)] block mt-0.5">
              {sessionCount > 0 ? `将 ${sessionCount} 个会话移至未分组` : '组内无会话'}
            </span>
          </button>

          {/* Option 2: Delete everything */}
          <button
            className="w-full text-left px-3 py-2 rounded-md
                       bg-[var(--error-bg)] hover:bg-[var(--error-bg)]/80 transition-colors
                       border border-[var(--error-border)]"
            onClick={() => handleConfirmDelete(true)}
          >
            <span className="text-[13px] font-medium text-[var(--error-text)] block">
              同时删除组内所有会话
            </span>
            <span className="text-[11px] text-[var(--error-text)]/70 block mt-0.5">
              {sessionCount > 0 ? `将永久删除 ${sessionCount} 个会话及其消息` : '组内无会话'}
            </span>
          </button>

          <button
            className="w-full mt-2 px-3 py-1.5 text-[12px] rounded-md
                       text-[var(--fg-muted)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-hover)]
                       transition-colors text-center"
            onClick={() => setConfirmDelete(false)}
          >
            取消
          </button>
        </div>
      )}
    </>
  )
}
