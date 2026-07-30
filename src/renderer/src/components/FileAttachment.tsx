// src/renderer/src/components/FileAttachment.tsx
import React from 'react'
import { X } from 'lucide-react'

interface Props {
  filePath: string
  onRemove: () => void
}

const imageExts = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'])

export default function FileAttachment({ filePath, onRemove }: Props) {
  const name = filePath.split(/[\\/]/).pop() || filePath
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const isImage = imageExts.has(ext)

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg
                    bg-[var(--bg-input)] border border-[var(--border)]
                    text-[13px] text-[var(--fg-primary)] max-w-[200px] group"
      title={filePath}
    >
      {isImage ? (
        <span className="text-[15px] flex-shrink-0">🖼️</span>
      ) : (
        <span className="text-[15px] flex-shrink-0">📄</span>
      )}
      <span className="truncate text-[12px]">{name}</span>
      <button
        className="flex-shrink-0 ml-0.5 w-4 h-4 rounded-full flex items-center justify-center
                   text-[var(--fg-dim)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-hover)]
                   transition-colors focus:outline-none"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        title="移除文件"
      >
        <X size={12} />
      </button>
    </div>
  )
}
