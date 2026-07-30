// src/renderer/src/components/McpSelector.tsx
import React, { useState, useEffect, useRef } from 'react'
import type { McpServerConfig } from '../../../shared/types'

interface Props {
  enabled: string[]
  onChange: (names: string[]) => void
}

export default function McpSelector({ enabled, onChange }: Props) {
  const [servers, setServers] = useState<McpServerConfig[]>([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.api.listMcpServers().then(setServers).catch(() => {})
  }, [])

  // Click outside to close
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handler)
    }
  }, [open])

  const toggle = (name: string) => {
    if (enabled.includes(name)) {
      onChange(enabled.filter(n => n !== name))
    } else {
      onChange([...enabled, name])
    }
  }

  return (
    <div className="relative">
      <button
        className={`flex-shrink-0 w-8 h-8 rounded-lg border transition-all flex items-center justify-center
                    focus:outline-none focus:ring-2 focus:ring-[var(--accent)]
                    ${enabled.length > 0
                      ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                      : 'bg-[var(--bg-input)] border-[var(--border)] text-[var(--fg-dim)] hover:bg-[var(--bg-hover)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                    }`}
        onClick={() => setOpen(!open)}
        title="MCP 服务"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"/>
          <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"/>
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute bottom-full mb-2 left-0 z-[250] bg-[var(--bg-side)] border border-[var(--border)]
                     rounded-lg shadow-xl w-[280px]"
        >
          <div className="px-3 py-2 border-b border-[var(--border)]">
            <span className="text-[13px] font-medium text-[var(--fg-primary)]">MCP 服务</span>
            <span className="text-[11px] text-[var(--fg-dim)] ml-2">选择启用的服务</span>
          </div>

          <div className="max-h-[200px] overflow-y-auto p-2">
            {servers.length === 0 ? (
              <p className="text-[12px] text-[var(--fg-muted)] text-center py-4">
                暂无 MCP 服务器，请在设置中配置
              </p>
            ) : (
              servers.map(s => {
                const isOn = enabled.includes(s.name)
                return (
                  <label
                    key={s.name}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-md cursor-pointer
                               hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={() => toggle(s.name)}
                      className="w-3.5 h-3.5 rounded accent-[var(--accent)] cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-[var(--fg-primary)] truncate">{s.name}</div>
                      <div className="text-[11px] text-[var(--fg-dim)] truncate">{s.command}</div>
                    </div>
                  </label>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
