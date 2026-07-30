// src/renderer/src/components/GroupContextMenu.tsx
import React, { useEffect, useRef } from 'react'
import type { SessionGroup } from '../../../shared/types'

interface Props {
  x: number
  y: number
  groups: SessionGroup[]
  currentGroupId?: string
  onMoveToGroup: (groupId: string | null) => void
  onClose: () => void
}

export default function GroupContextMenu({
  x, y, groups, currentGroupId, onMoveToGroup, onClose,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    // Delay to avoid the right-click event itself triggering close
    setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
      document.addEventListener('contextmenu', handleClick)
    }, 0)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('contextmenu', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  // Adjust position to stay within viewport
  const adjustedX = Math.min(x, window.innerWidth - 200)
  const adjustedY = Math.min(y, window.innerHeight - groups.length * 36 - 80)

  return (
    <div
      ref={ref}
      className="group-context-menu fixed z-[100] min-w-[180px]
                 bg-[var(--bg-side)] border border-[var(--border)] rounded-lg shadow-xl py-1"
      style={{ left: adjustedX, top: adjustedY }}
    >
      <div className="px-3 py-1 text-[11px] text-[var(--fg-dim)] font-medium">
        移动到分组
      </div>

      {/* No group option */}
      <button
        className="group-context-menu-item w-full text-left px-3 py-1.5 text-[13px]
                   text-[var(--fg-primary)] hover:bg-[var(--bg-hover)] transition-colors
                   flex items-center gap-2"
        onClick={() => { onMoveToGroup(null); onClose() }}
      >
        <span className="w-4 flex-shrink-0">
          {!currentGroupId ? '✓' : ''}
        </span>
        <span>无分组</span>
      </button>

      <div className="border-t border-[var(--border-muted)] my-1" />

      {/* Group options */}
      {groups.map(g => (
        <button
          key={g.id}
          className="group-context-menu-item w-full text-left px-3 py-1.5 text-[13px]
                     text-[var(--fg-primary)] hover:bg-[var(--bg-hover)] transition-colors
                     flex items-center gap-2"
          onClick={() => { onMoveToGroup(g.id); onClose() }}
        >
          <span className="w-4 flex-shrink-0">
            {g.id === currentGroupId ? '✓' : ''}
          </span>
          <span className="truncate">{g.name}</span>
        </button>
      ))}

      {groups.length === 0 && (
        <div className="px-3 py-2 text-[12px] text-[var(--fg-dim)] text-center">
          暂无分组，请先在侧边栏创建
        </div>
      )}
    </div>
  )
}
