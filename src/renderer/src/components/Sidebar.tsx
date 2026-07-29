// src/renderer/src/components/Sidebar.tsx
import React, { useState } from 'react'
import SessionList from './SessionList'
import NewSessionModal from './NewSessionModal'
import { useAppContext } from '../context/AppContext'

export default function Sidebar() {
  const [showModal, setShowModal] = useState(false)
  const { createSession } = useAppContext()

  return (
    <>
      <div className="flex flex-col h-full bg-[#1a1b1e] w-[280px] min-w-[200px] border-r border-gray-700/50">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          <h1 className="text-sm font-semibold tracking-wide">Claude Code</h1>
          <button
            className="w-7 h-7 flex items-center justify-center rounded-md
                       hover:bg-[#2c2d30] transition-colors text-lg text-gray-300"
            onClick={() => setShowModal(true)}
            title="新建会话"
          >
            +
          </button>
        </div>
        <SessionList />
      </div>

      <NewSessionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreate={createSession}
      />
    </>
  )
}
