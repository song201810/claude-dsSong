// src/renderer/src/components/McpConfirmDialog.tsx
import React from 'react'

interface Props {
  toolName: string
  serverName: string
  params: string
  onAllow: (addToWhitelist: boolean) => void
  onDeny: () => void
}

export default function McpConfirmDialog({ toolName, serverName, params, onAllow, onDeny }: Props) {
  const [addToWhitelist, setAddToWhitelist] = React.useState(false)

  return (
    <div
      className="fixed inset-0 z-[400] bg-[var(--bg-overlay)] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onDeny() }}
    >
      <div className="bg-[var(--bg-side)] rounded-xl shadow-2xl w-[440px] border border-[var(--border)] p-5">
        <h3 className="text-[15px] font-semibold text-[var(--fg-primary)] mb-1">MCP 工具调用确认</h3>
        <p className="text-[13px] text-[var(--fg-muted)] mb-4">
          Claude 正在尝试调用 MCP 工具，请确认是否允许。
        </p>

        <div className="space-y-2.5 mb-4">
          <div className="px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
            <span className="text-[11px] text-[var(--fg-dim)]">工具名称</span>
            <div className="text-[13px] text-[var(--fg-primary)] font-mono">{toolName}</div>
          </div>
          <div className="px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
            <span className="text-[11px] text-[var(--fg-dim)]">MCP 服务</span>
            <div className="text-[13px] text-[var(--fg-primary)]">{serverName}</div>
          </div>
          <div className="px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
            <span className="text-[11px] text-[var(--fg-dim)]">参数</span>
            <div className="text-[12px] text-[var(--fg-primary)] font-mono whitespace-pre-wrap break-all max-h-[120px] overflow-y-auto">
              {params || '(无参数)'}
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={addToWhitelist}
            onChange={e => setAddToWhitelist(e.target.checked)}
            className="w-3.5 h-3.5 rounded accent-[var(--accent)] cursor-pointer"
          />
          <span className="text-[12px] text-[var(--fg-muted)]">将此工具加入白名单（以后不再询问）</span>
        </label>

        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 text-[13px] rounded-lg bg-[var(--bg-input)] hover:bg-[var(--bg-hover)]
                       text-[var(--fg-muted)] transition-colors"
            onClick={onDeny}
          >
            拒绝
          </button>
          <button
            className="px-4 py-2 text-[13px] rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)]
                       text-white font-medium transition-colors"
            onClick={() => onAllow(addToWhitelist)}
          >
            允许
          </button>
        </div>
      </div>
    </div>
  )
}
