// src/renderer/src/components/Sidebar.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { Plus, FolderPlus } from 'lucide-react'
import SessionList from './SessionList'
import NewSessionModal from './NewSessionModal'
import { useAppContext } from '../context/AppContext'

export default function Sidebar() {
  const [showModal, setShowModal] = useState(false)
  const [pendingGroupId, setPendingGroupId] = useState<string | undefined>()
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const { state, createSession, createGroup, setTheme } = useAppContext()

  // Listen for create-session-in-group events from SessionList
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { groupId: string }
      setPendingGroupId(detail.groupId)
      setShowModal(true)
    }
    window.addEventListener('create-session-in-group', handler)
    return () => window.removeEventListener('create-session-in-group', handler)
  }, [])

  const handleCreateSession = useCallback((name: string, workDir: string) => {
    createSession(name, workDir, pendingGroupId)
    setPendingGroupId(undefined)
  }, [createSession, pendingGroupId])

  const handleCreateGroup = () => {
    setIsCreatingGroup(true)
    setNewGroupName('')
  }

  const handleSubmitGroup = () => {
    const name = newGroupName.trim()
    if (name) createGroup(name)
    setIsCreatingGroup(false)
    setNewGroupName('')
  }

  return (
    <>
      <div className="flex flex-col h-full bg-[var(--bg-side)] w-[280px] min-w-[200px] border-r border-[var(--border)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h1 className="text-sm font-semibold tracking-wide text-[var(--fg-primary)]">Claude Code</h1>
          <div className="flex items-center gap-1">
            <button
              className="w-11 h-11 flex items-center justify-center rounded-md
                         hover:bg-[var(--bg-hover)] transition-colors text-lg text-[var(--fg-muted)] hover:text-[var(--fg-primary)]
                         focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 focus:ring-offset-[var(--bg-side)]"
              onClick={handleCreateGroup}
              title="新建分组"
            >
              <FolderPlus size={18} />
            </button>
            <button
              className="w-11 h-11 flex items-center justify-center rounded-md
                         hover:bg-[var(--bg-hover)] transition-colors text-lg text-[var(--fg-muted)] hover:text-[var(--fg-primary)]
                         focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 focus:ring-offset-[var(--bg-side)]"
              onClick={() => setShowModal(true)}
              title="新建会话"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Inline new group form */}
        {isCreatingGroup && (
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-root)]">
            <input
              type="text"
              className="flex-1 min-w-0 bg-[var(--bg-input)] border border-[var(--accent)] rounded-md
                         px-2 py-1 text-[13px] text-[var(--fg-primary)] placeholder-[var(--fg-dim)]
                         focus:outline-none"
              placeholder="输入分组名称"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmitGroup()
                if (e.key === 'Escape') {
                  setIsCreatingGroup(false)
                  setNewGroupName('')
                }
              }}
              autoFocus
            />
            <button
              className="px-2 py-1 text-[13px] rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)]
                         text-white font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={handleSubmitGroup}
              disabled={!newGroupName.trim()}
            >
              确定
            </button>
            <button
              className="px-2 py-1 text-[13px] rounded-md bg-[var(--bg-card)] hover:bg-[var(--bg-input)]
                         text-[var(--fg-muted)] transition-colors"
              onClick={() => {
                setIsCreatingGroup(false)
                setNewGroupName('')
              }}
            >
              取消
            </button>
          </div>
        )}

        <SessionList />
        <div className="mt-auto border-t border-[var(--border)] px-4 py-3">
          <span className="text-xs text-[var(--fg-dim)]">主题</span>
          <div className="flex gap-2 mt-2">
            <div className="flex flex-col items-center gap-1">
              <button
                className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer
                bg-[#231f1d] ${state.theme === 'warm' ? 'border-[var(--accent)] scale-110' : 'border-transparent'}
                focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 focus:ring-offset-[var(--bg-side)]`}
                onClick={() => setTheme('warm')}
                title="暖色暗色"
              />
              <span className="text-[10px] text-[var(--fg-dim)]">暖色</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer
                bg-[#161822] ${state.theme === 'cool' ? 'border-[var(--accent)] scale-110' : 'border-transparent'}
                focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 focus:ring-offset-[var(--bg-side)]`}
                onClick={() => setTheme('cool')}
                title="冷色暗色"
              />
              <span className="text-[10px] text-[var(--fg-dim)]">冷色</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer
                bg-[#ffffff] ${state.theme === 'light' ? 'border-[var(--accent)] scale-110' : 'border-transparent'}
                focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 focus:ring-offset-[var(--bg-side)]`}
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
        onClose={() => {
          setShowModal(false)
          setPendingGroupId(undefined)
        }}
        onCreate={handleCreateSession}
        groupId={pendingGroupId}
      />
    </>
  )
}
