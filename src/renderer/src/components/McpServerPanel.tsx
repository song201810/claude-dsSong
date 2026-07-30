// src/renderer/src/components/McpServerPanel.tsx
import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { McpServerConfig } from '../../../shared/types'

interface FormData {
  name: string
  command: string
  args: string
  env: string
  type: 'stdio' | 'http'
  url: string
}

function emptyForm(): FormData {
  return { name: '', command: '', args: '', env: '', type: 'stdio', url: '' }
}

function serverToForm(s: McpServerConfig): FormData {
  return {
    name: s.name,
    command: s.type === 'http' ? '' : s.command,
    args: (s.args || []).join(', '),
    env: Object.entries(s.env || {}).map(([k, v]) => `${k}=${v}`).join(', '),
    type: s.type === 'http' ? 'http' : 'stdio',
    url: s.url || '',
  }
}

function formToServer(f: FormData): McpServerConfig {
  const env: Record<string, string> = {}
  if (f.env.trim()) {
    f.env.split(',').forEach(pair => {
      const eq = pair.indexOf('=')
      if (eq > 0) env[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim()
    })
  }
  const args = f.args.trim() ? f.args.split(',').map(s => s.trim()).filter(Boolean) : []
  if (f.type === 'http') {
    return { name: f.name.trim(), command: f.url.trim(), args: [], env: {}, type: 'http', url: f.url.trim() }
  }
  return { name: f.name.trim(), command: f.command.trim(), args, env, type: 'stdio' }
}

export default function McpServerPanel() {
  const [servers, setServers] = useState<McpServerConfig[]>([])
  const [editing, setEditing] = useState<McpServerConfig | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm())
  const [error, setError] = useState('')

  useEffect(() => {
    window.api.listMcpServers().then(setServers).catch(() => {})
  }, [])

  const refresh = () => {
    window.api.listMcpServers().then(setServers).catch(() => {})
  }

  const handleAdd = () => {
    setEditing(null)
    setForm({ ...emptyForm(), name: '__new__' })
    setError('')
  }

  const handleEdit = (s: McpServerConfig) => {
    setEditing(s)
    setForm(serverToForm(s))
    setError('')
  }

  // Default to not showing form until user clicks "Add"
  const isFormOpen = form.name !== '' || editing !== null
  const showFormFlag = editing || (form.name !== '' && !editing)

  const handleSave = async () => {
    const server = formToServer(form)
    const isHttp = form.type === 'http'
    if (!server.name) {
      setError('服务器名称为必填项')
      return
    }
    if (isHttp && !form.url.trim()) {
      setError('HTTP 类型需要填写 URL')
      return
    }
    if (!isHttp && !form.command.trim()) {
      setError('命令为必填项')
      return
    }
    try {
      if (editing) {
        await window.api.updateMcpServer(editing.name, server)
      } else {
        await window.api.addMcpServer(server)
      }
      refresh()
      setEditing(null)
      setForm(emptyForm())
      setError('')
    } catch (e: any) {
      setError(e.message || '保存失败')
    }
  }

  const handleDelete = async (name: string) => {
    await window.api.deleteMcpServer(name)
    refresh()
  }

  const showForm = editing !== null || form.name === '__new__'

  return (
    <div>
      {error && (
        <div className="mb-3 px-3 py-2 text-[13px] rounded-lg bg-[var(--error-bg)] text-[var(--error-text)]">
          {error}
        </div>
      )}

      {/* Server list */}
      {servers.map(s => (
        <div key={s.name} className="flex items-center gap-3 px-3 py-2.5 mb-1.5 rounded-lg
                        bg-[var(--bg-card)] border border-[var(--border)]">
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-[var(--fg-primary)]">{s.name}</div>
            <div className="text-[12px] text-[var(--fg-muted)] truncate">
              {s.type === 'http'
                ? `HTTP: ${s.url || s.command || ''}`
                : `${s.command} ${s.args?.join(' ') || ''}`
              }
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${s.type === 'http' ? 'bg-blue-400' : 'bg-green-400'}`} title={s.type === 'http' ? 'HTTP 远程' : 'stdio 本地'} />
            <button
              className="p-1 rounded text-[var(--fg-muted)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              onClick={() => handleEdit(s)}
            >
              <Pencil size={14} />
            </button>
            <button
              className="p-1 rounded text-[var(--fg-muted)] hover:text-[var(--error-text)] hover:bg-[var(--bg-hover)] transition-colors"
              onClick={() => handleDelete(s.name)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      {servers.length === 0 && !showFormFlag && (
        <p className="text-[13px] text-[var(--fg-muted)] text-center py-8">
          暂无 MCP 服务器配置。点击下方按钮新增。
        </p>
      )}

      {/* Add button */}
      {!showFormFlag && (
        <button
          className="mt-2 flex items-center gap-1.5 px-3 py-2 text-[13px] rounded-lg
                     bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--accent)]
                     transition-colors focus:outline-none"
          onClick={handleAdd}
        >
          <Plus size={16} />
          新增 MCP 服务器
        </button>
      )}

      {/* Form */}
      {showFormFlag && (
        <div className="mt-3 p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
          <h3 className="text-[13px] font-semibold text-[var(--fg-primary)] mb-3">
            {editing ? '编辑' : '新增'} MCP 服务器
          </h3>
          <div className="space-y-2.5">
            <div>
              <label className="block text-[12px] text-[var(--fg-muted)] mb-1">类型</label>
              <select
                className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px]
                           text-[var(--fg-primary)] focus:outline-none focus:border-[var(--accent)]"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as 'stdio' | 'http' })}
              >
                <option value="stdio">stdio (本地命令)</option>
                <option value="http">HTTP (远程服务)</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] text-[var(--fg-muted)] mb-1">服务器名称 *</label>
              <input
                className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px]
                           text-[var(--fg-primary)] focus:outline-none focus:border-[var(--accent)]"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="例如: weather-mcp"
              />
            </div>
            {form.type === 'http' ? (
              <div>
                <label className="block text-[12px] text-[var(--fg-muted)] mb-1">URL *</label>
                <input
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px]
                             text-[var(--fg-primary)] focus:outline-none focus:border-[var(--accent)]"
                  value={form.url}
                  onChange={e => setForm({ ...form, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-[12px] text-[var(--fg-muted)] mb-1">命令 *</label>
                  <input
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px]
                               text-[var(--fg-primary)] focus:outline-none focus:border-[var(--accent)]"
                    value={form.command}
                    onChange={e => setForm({ ...form, command: e.target.value })}
                    placeholder="例如: npx"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-[var(--fg-muted)] mb-1">参数（逗号分隔）</label>
                  <input
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px]
                               text-[var(--fg-primary)] focus:outline-none focus:border-[var(--accent)]"
                    value={form.args}
                    onChange={e => setForm({ ...form, args: e.target.value })}
                    placeholder="例如: -y, @org/mcp-server"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-[var(--fg-muted)] mb-1">环境变量（KEY=VALUE, ...）</label>
                  <input
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px]
                               text-[var(--fg-primary)] focus:outline-none focus:border-[var(--accent)]"
                    value={form.env}
                    onChange={e => setForm({ ...form, env: e.target.value })}
                    placeholder="例如: KEY1=val1, KEY2=val2"
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              className="px-3 py-1.5 text-[12px] rounded-lg bg-[var(--bg-input)] hover:bg-[var(--bg-hover)]
                         text-[var(--fg-muted)] transition-colors"
              onClick={() => { setEditing(null); setForm(emptyForm()); setError('') }}
            >
              取消
            </button>
            <button
              className="px-3 py-1.5 text-[12px] rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)]
                         text-white font-medium transition-colors"
              onClick={handleSave}
            >
              保存
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
