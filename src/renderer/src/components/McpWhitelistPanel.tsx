// src/renderer/src/components/McpWhitelistPanel.tsx
import React, { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'

export default function McpWhitelistPanel() {
  const [items, setItems] = useState<string[]>([])
  const [newItem, setNewItem] = useState('')

  useEffect(() => {
    window.api.getWhitelist().then(setItems).catch(() => {})
  }, [])

  const save = async (list: string[]) => {
    setItems(list)
    await window.api.setWhitelist(list)
  }

  const handleAdd = () => {
    const name = newItem.trim()
    if (!name || items.includes(name)) return
    save([...items, name])
    setNewItem('')
  }

  const handleRemove = (name: string) => {
    save(items.filter(i => i !== name))
  }

  return (
    <div>
      <p className="text-[13px] text-[var(--fg-muted)] mb-4">
        白名单中的工具在 MCP 调用时将跳过确认弹窗，直接放行。
      </p>

      {/* Add input */}
      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px]
                     text-[var(--fg-primary)] focus:outline-none focus:border-[var(--accent)]"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          placeholder="输入工具名称，例如: read_file"
        />
        <button
          className="px-3 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)]
                     text-white text-[13px] font-medium transition-colors flex items-center gap-1"
          onClick={handleAdd}
        >
          <Plus size={14} />
          添加
        </button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <p className="text-[13px] text-[var(--fg-dim)] text-center py-6">白名单为空</p>
      ) : (
        <div className="space-y-1">
          {items.map(name => (
            <div key={name} className="flex items-center gap-2 px-3 py-2 rounded-lg
                            bg-[var(--bg-card)] border border-[var(--border)]">
              <span className="flex-1 text-[13px] text-[var(--fg-primary)]">{name}</span>
              <button
                className="p-1 rounded text-[var(--fg-muted)] hover:text-[var(--error-text)] transition-colors"
                onClick={() => handleRemove(name)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
