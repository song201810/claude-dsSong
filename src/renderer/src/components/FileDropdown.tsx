// src/renderer/src/components/FileDropdown.tsx
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { FileNode } from '../../../shared/types'

interface Props {
  filter: string
  files: FileNode[]
  anchorRect: DOMRect | null
  onSelect: (relPath: string) => void
  onClose: () => void
}

export default function FileDropdown({ filter, files, anchorRect, onSelect, onClose }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef(false)

  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(filter.toLowerCase()) ||
    f.path.toLowerCase().includes(filter.toLowerCase())
  ).slice(0, 10)

  useEffect(() => {
    setActiveIndex(0)
  }, [filter, files])

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handler)
    }
  }, [onClose])

  // Keyboard navigation
  useEffect(() => {
    selectedRef.current = false
    const handler = (e: KeyboardEvent) => {
      const len = filtered.length
      if (len === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex(prev => (prev + 1) % len)
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex(prev => (prev - 1 + len) % len)
          break
        case 'Enter':
          e.preventDefault()
          if (selectedRef.current) break
          selectedRef.current = true
          onSelect(filtered[activeIndex]?.path || '')
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [filtered, activeIndex, onSelect, onClose])

  // Scroll active into view
  useEffect(() => {
    if (!listRef.current) return
    const active = listRef.current.querySelector(`[data-index="${activeIndex}"]`)
    if (active) {
      active.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  if (!anchorRect || filtered.length === 0) return null

  // Position: below the textarea, clamped within viewport
  const dropdownH = Math.min(filtered.length * 36, 280) + 8 // 36px per row, max 280px
  const spaceBelow = window.innerHeight - anchorRect.bottom
  const spaceAbove = anchorRect.top
  const openUpward = spaceBelow < dropdownH && spaceAbove > spaceBelow

  const top = openUpward
    ? anchorRect.top - dropdownH - 4
    : anchorRect.bottom + 4
  const left = Math.max(8, Math.min(anchorRect.left, window.innerWidth - 340))

  return createPortal(
    <div
      ref={listRef}
      className="fixed z-[9999] bg-[var(--bg-side)] border border-[var(--border)] rounded-lg shadow-2xl
                 overflow-y-auto"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        maxHeight: `${dropdownH}px`,
        minWidth: '320px',
      }}
    >
      {filtered.map((f, i) => (
        <div
          key={f.path}
          data-index={i}
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-[13px] transition-colors
            ${i === activeIndex
              ? 'bg-[var(--accent)] text-white'
              : 'text-[var(--fg-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          onMouseDown={(e) => {
            e.preventDefault()
            onSelect(f.path)
          }}
          onMouseEnter={() => setActiveIndex(i)}
        >
          <span className="text-[14px] flex-shrink-0">{f.isDir ? '📁' : '📄'}</span>
          <span className="truncate">{f.path}</span>
        </div>
      ))}
    </div>,
    document.body
  )
}
