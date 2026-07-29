// src/renderer/src/components/Sidebar.tsx
import React, { useState } from 'react'
import SessionList from './SessionList'
import NewSessionModal from './NewSessionModal'
import { useAppContext } from '../context/AppContext'

export default function Sidebar() {
  const [showModal, setShowModal] = useState(false)
  const { state, createSession, setTheme } = useAppContext()

  return (
    <>
      <div className="flex flex-col h-full bg-[var(--bg-side)] w-[280px] min-w-[200px] border-r border-[var(--border)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h1 className="text-sm font-semibold tracking-wide text-[var(--fg-primary)]">Claude Code</h1>
          <button
            className="w-11 h-11 flex items-center justify-center rounded-md
                       hover:bg-[var(--bg-hover)] transition-colors text-lg text-[var(--fg-muted)] hover:text-[var(--fg-primary)]"
            onClick={() => setShowModal(true)}
            title="新建会话"
          >
            +
          </button>
        </div>
        <SessionList />
        <div className="mt-auto border-t border-[var(--border)] px-4 py-3">
          <span className="text-xs text-[var(--fg-dim)]">主题</span>
          <div className="flex gap-2 mt-2">
            <div className="flex flex-col items-center gap-1">
              <button
                className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer
                bg-[#231f1d] ${state.theme === 'warm' ? 'border-[var(--accent)] scale-110' : 'border-transparent'}`}
                onClick={() => setTheme('warm')}
                title="暖色暗色"
              />
              <span className="text-[10px] text-[var(--fg-dim)]">暖色</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer
                bg-[#161822] ${state.theme === 'cool' ? 'border-[var(--accent)] scale-110' : 'border-transparent'}`}
                onClick={() => setTheme('cool')}
                title="冷色暗色"
              />
              <span className="text-[10px] text-[var(--fg-dim)]">冷色</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer
                bg-[#ffffff] ${state.theme === 'light' ? 'border-[var(--accent)] scale-110' : 'border-transparent'}`}
                onClick={() => setTheme('light')}
                title="明亮"
              />
              <span className="text-[10px] text-[var(--fg-dim)]">明亮</span>
            </div>
          </div>
        </div>
      </div>

      <NewSessionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={createSession}
      />
    </>
  )
}
