// src/renderer/src/components/SessionItem.tsx
import React from 'react'
import type { SessionSummary } from '../../../shared/types'

interface Props {
  session: SessionSummary
  isActive: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export default function SessionItem({ session, isActive, onSelect, onDelete }: Props) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`确定删除会话「${session.name}」？`)) {
      onDelete(session.id)
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    return d.toLocaleDateString('zh-CN')
  }

  return (
    <div
      className={`
        group flex flex-col px-3 py-2.5 cursor-pointer border-b border-gray-700/50
        transition-colors duration-100
        ${isActive ? 'bg-[#3a3b3f]' : 'hover:bg-[#2c2d30]'}
      `}
      onClick={() => onSelect(session.id)}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate">{session.name}</span>
        <button
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400
                     text-xs px-1 py-0.5 rounded transition-all"
          onClick={handleDelete}
          title="删除会话"
        >
          ✕
        </button>
      </div>
      <span className="text-xs text-gray-500 mt-0.5">
        {session.messageCount} 条消息 · {formatDate(session.updatedAt)}
      </span>
    </div>
  )
}
