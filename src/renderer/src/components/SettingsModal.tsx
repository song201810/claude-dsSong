// src/renderer/src/components/SettingsModal.tsx
import React, { useState } from 'react'
import { X } from 'lucide-react'
import McpServerPanel from './McpServerPanel'
import McpWhitelistPanel from './McpWhitelistPanel'

interface Props {
  onClose: () => void
}

type Tab = 'mcp' | 'whitelist'

export default function SettingsModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('mcp')

  return (
    <div
      className="fixed inset-0 z-[300] bg-[var(--bg-overlay)] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[var(--bg-side)] rounded-xl shadow-2xl w-[640px] max-h-[80vh] flex flex-col border border-[var(--border)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-[15px] font-semibold text-[var(--fg-primary)]">设置</h2>
          <button
            className="w-7 h-7 rounded-lg flex items-center justify-center
                       text-[var(--fg-muted)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-hover)]
                       transition-colors focus:outline-none"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] px-5">
          <button
            className={`px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2
              ${tab === 'mcp'
                ? 'text-[var(--accent)] border-[var(--accent)]'
                : 'text-[var(--fg-muted)] border-transparent hover:text-[var(--fg-primary)]'
              }`}
            onClick={() => setTab('mcp')}
          >
            MCP 服务器
          </button>
          <button
            className={`px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2
              ${tab === 'whitelist'
                ? 'text-[var(--accent)] border-[var(--accent)]'
                : 'text-[var(--fg-muted)] border-transparent hover:text-[var(--fg-primary)]'
              }`}
            onClick={() => setTab('whitelist')}
          >
            白名单
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'mcp' && <McpServerPanel />}
          {tab === 'whitelist' && <McpWhitelistPanel />}
        </div>
      </div>
    </div>
  )
}
