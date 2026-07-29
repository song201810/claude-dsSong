// src/renderer/src/components/CodeBlock.tsx
import React, { useState } from 'react'

interface Props {
  language: string
  code: string
}

export default function CodeBlock({ language, code }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-[var(--border)]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-input)]">
        <span className="text-xs text-[var(--fg-muted)] font-mono">{language || 'code'}</span>
        <button
          className="text-xs px-2 py-0.5 rounded-md hover:bg-[var(--bg-active)] transition-colors
                     text-[var(--fg-muted)] hover:text-[var(--fg-primary)]"
          onClick={handleCopy}
        >
          {copied ? '已复制 ✓' : '复制'}
        </button>
      </div>
      <pre className="px-3 py-2.5 text-sm overflow-x-auto bg-[var(--bg-code)] font-mono
                       leading-relaxed text-[var(--fg-muted)]">
        <code>{code}</code>
      </pre>
    </div>
  )
}
