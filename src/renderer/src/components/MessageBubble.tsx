// src/renderer/src/components/MessageBubble.tsx
import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import CodeBlock from './CodeBlock'
import type { Message } from '../../../shared/types'

interface Props {
  message: Message
  isStreaming: boolean
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="w-2 h-2 rounded-full bg-[#a8a29e] animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 rounded-full bg-[#a8a29e] animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 rounded-full bg-[#a8a29e] animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

export default function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === 'user'
  const isEmpty = !message.content
  const showLoading = !isUser && isEmpty && isStreaming
  const [thinkingExpanded, setThinkingExpanded] = useState(false)

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 px-4`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-[#e0684e] text-white rounded-br-md shadow-sm'
            : 'bg-[#292524] text-[#d6cbc4] rounded-bl-md'
        }`}
      >
        {message.thinking && (
          <div className="mb-2">
            <button
              className="flex items-center gap-1.5 text-xs text-[#a8a29e] hover:text-[#d6cbc4]
                         transition-colors mb-1"
              onClick={() => setThinkingExpanded(!thinkingExpanded)}
            >
              <span>{thinkingExpanded ? '▼' : '▶'}</span>
              <span>思考过程</span>
            </button>
            {thinkingExpanded && (
              <div className="text-xs text-[#a8a29e] bg-[#1c1917]/40 rounded-lg px-3 py-2
                              border-l-2 border-[#f0836a] italic whitespace-pre-wrap">
                {message.thinking}
              </div>
            )}
          </div>
        )}

        {showLoading ? (
          <TypingDots />
        ) : (
          <div className="prose prose-invert prose-sm max-w-none break-words overflow-x-auto
                          prose-headings:text-[#faf7f2] prose-a:text-[#f0836a]
                          prose-strong:text-[#faf7f2]">
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const codeStr = String(children).replace(/\n$/, '')
                  const isInline = !match && !codeStr.includes('\n')
                  if (isInline) {
                    return (
                      <code className="bg-[#1c1917]/50 rounded px-1.5 py-0.5 text-xs text-[#f0836a]" {...props}>
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
              {isEmpty ? '' : message.content}
            </ReactMarkdown>
            {(isStreaming || isEmpty) && !showLoading && (
              <span className="inline-block w-2 h-4 bg-[#f0836a] ml-0.5 animate-pulse align-text-bottom rounded-sm" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
