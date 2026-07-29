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
      <span className="w-2 h-2 rounded-full bg-[var(--fg-muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 rounded-full bg-[var(--fg-muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 rounded-full bg-[var(--fg-muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

export default function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === 'user'
  const isEmpty = !message.content
  const showLoading = !isUser && isEmpty && isStreaming
  const [thinkingExpanded, setThinkingExpanded] = useState(false)

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2 px-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-[var(--accent-hover)] text-white rounded-br-md shadow-sm'
            : 'bg-[var(--bg-card)] text-[var(--fg-primary)] rounded-bl-md'
        }`}
      >
        {message.thinking && (
          <div className="mb-2">
            <button
              className="flex items-center gap-1.5 text-xs text-[var(--fg-muted)] hover:text-[var(--fg-primary)]
                         transition-colors mb-1"
              onClick={() => setThinkingExpanded(!thinkingExpanded)}
            >
              <span>{thinkingExpanded ? '▼' : '▶'}</span>
              <span>思考过程</span>
            </button>
            {thinkingExpanded && (
              <div className="text-xs text-[var(--fg-muted)] bg-[var(--bg-root)]/40 rounded-lg px-3 py-2
                              border-l-2 border-[var(--accent)] italic whitespace-pre-wrap">
                {message.thinking}
              </div>
            )}
          </div>
        )}

        {showLoading ? (
          <TypingDots />
        ) : (
          <div className="prose prose-invert prose-sm max-w-none break-words overflow-x-auto
                          prose-headings:text-[var(--fg-primary)] prose-a:text-[var(--accent)]
                          prose-strong:text-[var(--fg-primary)]">
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const codeStr = String(children).replace(/\n$/, '')
                  const isInline = !match && !codeStr.includes('\n')
                  if (isInline) {
                    return (
                      <code className="bg-[var(--bg-root)]/50 rounded px-1.5 py-0.5 text-xs text-[var(--accent)]" {...props}>
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
              <span className="inline-block w-2 h-4 bg-[var(--accent)] ml-0.5 animate-pulse align-text-bottom rounded-sm" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
