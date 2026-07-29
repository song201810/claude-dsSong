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
    <div className="my-3 rounded-lg overflow-hidden border border-gray-700">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800/80">
        <span className="text-xs text-gray-400">{language || 'code'}</span>
        <button
          className="text-xs px-2 py-0.5 rounded hover:bg-gray-700 transition-colors
                     text-gray-400 hover:text-white"
          onClick={handleCopy}
        >
          {copied ? '已复制 ✓' : '复制'}
        </button>
      </div>
      <pre className="px-3 py-2.5 text-sm overflow-x-auto bg-gray-900/50 font-mono
                       leading-relaxed text-gray-200">
        <code>{code}</code>
      </pre>
    </div>
  )
}
