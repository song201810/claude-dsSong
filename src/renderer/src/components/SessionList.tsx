// src/renderer/src/components/SessionList.tsx
import React from 'react'
import SessionItem from './SessionItem'
import { useAppContext } from '../context/AppContext'

export default function SessionList() {
  const { state, switchSession, removeSession } = useAppContext()

  if (state.sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="text-4xl mb-3">💬</div>
        <p className="text-gray-400 text-sm">暂无会话</p>
        <p className="text-gray-600 text-xs mt-1">点击上方 + 创建第一个会话</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      {state.sessions.map((s) => (
        <SessionItem
          key={s.id}
          session={s}
          isActive={s.id === state.currentSessionId}
          onSelect={switchSession}
          onDelete={removeSession}
        />
      ))}
    </div>
  )
}
