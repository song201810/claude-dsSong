// src/renderer/src/components/SessionList.tsx
import React, { useState, useMemo } from 'react'
import { MessageSquare } from 'lucide-react'
import SessionItem from './SessionItem'
import GroupHeader from './GroupHeader'
import GroupContextMenu from './GroupContextMenu'
import { useAppContext } from '../context/AppContext'

export default function SessionList() {
  const {
    state,
    switchSession,
    removeSession,
    createSession,
    renameGroup,
    deleteGroup,
    moveSessionToGroup,
  } = useAppContext()

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; sessionId: string
  } | null>(null)

  // Compute ungrouped sessions and group -> sessions mapping
  const { ungrouped, groupSessions } = useMemo(() => {
    const ungrouped = state.sessions.filter(s => !s.groupId)
    const map = new Map<string, typeof state.sessions>()
    for (const g of state.groups) {
      map.set(g.id, state.sessions.filter(s => s.groupId === g.id))
    }
    return { ungrouped, groupSessions: map }
  }, [state.sessions, state.groups])

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const handleContextMenu = (sessionId: string) => (e: React.MouseEvent) => {
    setContextMenu({ x: e.clientX, y: e.clientY, sessionId })
  }

  const handleMoveToGroup = (groupId: string | null) => {
    if (contextMenu) {
      moveSessionToGroup(contextMenu.sessionId, groupId)
    }
  }

  const currentContextSession = contextMenu
    ? state.sessions.find(s => s.id === contextMenu.sessionId)
    : null

  // Empty state — no sessions and no groups
  if (state.sessions.length === 0 && state.groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <MessageSquare size={40} className="mb-3 text-[var(--fg-dim)]" />
        <p className="text-[var(--fg-muted)] text-sm">暂无会话</p>
        <p className="text-[var(--fg-dim)] text-xs mt-1">点击上方 + 创建第一个会话</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      {/* Ungrouped sessions */}
      {ungrouped.map((s) => (
        <SessionItem
          key={s.id}
          session={s}
          isActive={s.id === state.currentSessionId}
          onSelect={switchSession}
          onDelete={removeSession}
          onContextMenu={handleContextMenu(s.id)}
        />
      ))}

      {/* Groups */}
      {state.groups.map((group) => {
        const sessions = groupSessions.get(group.id) ?? []
        const isExpanded = !collapsedGroups.has(group.id)

        return (
          <div key={group.id}>
            <GroupHeader
              group={group}
              isExpanded={isExpanded}
              sessionCount={sessions.length}
              onToggle={() => toggleGroup(group.id)}
              onRename={(name) => renameGroup(group.id, name)}
              onDelete={(deleteSessions) => deleteGroup(group.id, deleteSessions)}
              onCreateSession={() => {
                // Trigger the same modal flow but with groupId
                // We need to access the modal — for now we open via a custom event
                window.dispatchEvent(new CustomEvent('create-session-in-group', {
                  detail: { groupId: group.id }
                }))
              }}
            />

            {isExpanded && sessions.length > 0 && (
              <div>
                {sessions.map((s) => (
                  <SessionItem
                    key={s.id}
                    session={s}
                    isActive={s.id === state.currentSessionId}
                    onSelect={switchSession}
                    onDelete={removeSession}
                    onContextMenu={handleContextMenu(s.id)}
                    isIndented
                  />
                ))}
              </div>
            )}

            {isExpanded && sessions.length === 0 && (
              <div className="pl-7 pr-3 py-2 text-[11px] text-[var(--fg-dim)]">
                此分组暂无会话 — 右键点击会话移动到此处
              </div>
            )}
          </div>
        )
      })}

      {/* Context menu */}
      {contextMenu && (
        <GroupContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          groups={state.groups}
          currentGroupId={currentContextSession?.groupId}
          onMoveToGroup={(groupId) => {
            handleMoveToGroup(groupId)
            setContextMenu(null)
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
