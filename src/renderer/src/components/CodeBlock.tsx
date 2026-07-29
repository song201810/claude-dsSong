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
    <div className="my-3 rounded-xl overflow-hidden border border-[#3a3430]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#332e2b]">
        <span className="text-xs text-[#a8a29e] font-mono">{language || 'code'}</span>
        <button
          className="text-xs px-2 py-0.5 rounded-md hover:bg-[#44403c] transition-colors
                     text-[#a8a29e] hover:text-[#faf7f2]"
          onClick={handleCopy}
        >
          {copied ? '已复制 ✓' : '复制'}
        </button>
      </div>
      <pre className="px-3 py-2.5 text-sm overflow-x-auto bg-[#1e1b19] font-mono
                       leading-relaxed text-[#d6cbc4]">
        <code>{code}</code>
      </pre>
    </div>
  )
}
