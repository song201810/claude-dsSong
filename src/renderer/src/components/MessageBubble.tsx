// src/renderer/src/components/MessageBubble.tsx
import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import CodeBlock from './CodeBlock'
import type { Message } from '../../../shared/types'

interface Props {
  message: Message
  isStreaming: boolean
}

export default function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === 'user'
  const isEmpty = !message.content
  const showLoading = !isUser && isEmpty && isStreaming

  const content = message.content

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 px-4`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-[#2b3b52] text-white rounded-br-md'
            : 'bg-[#2d2f34] text-gray-100 rounded-bl-md'
        }`}
      >
        {message.thinking && (
          <div className="mb-2">
            <button
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-300
                         transition-colors mb-1"
              onClick={() => setThinkingExpanded(!thinkingExpanded)}
            >
              <span>{thinkingExpanded ? '▼' : '▶'}</span>
              <span>思考过程</span>
            </button>
            {thinkingExpanded && (
              <div className="text-xs text-gray-400 bg-black/20 rounded-lg px-3 py-2
                              border-l-2 border-gray-500 italic whitespace-pre-wrap">
                {message.thinking}
              </div>
            )}
          </div>
        )}

        <div className="prose prose-invert prose-sm max-w-none break-words overflow-x-auto">
          <ReactMarkdown
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                const codeStr = String(children).replace(/\n$/, '')
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const isInline = !match && !codeStr.includes('\n')
                if (isInline) {
                  return (
                    <code className="bg-black/30 rounded px-1.5 py-0.5 text-xs" {...props}>
                      {children}
                    </code>
                  )
                }
                return <CodeBlock language={match?.[1] || ''} code={codeStr} />
              },
              pre({ children }) {
                return <>{children}</>
              },
            }}
          >
            {content || (message.role === 'assistant' ? '▊' : '')}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
