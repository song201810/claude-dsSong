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
      <div className="flex flex-col h-full bg-[#231f1d] w-[280px] min-w-[200px] border-r border-[#3a3430]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#3a3430]">
          <h1 className="text-sm font-semibold tracking-wide text-[#faf7f2]">Claude Code</h1>
          <button
            className="w-7 h-7 flex items-center justify-center rounded-md
                       hover:bg-[#383230] transition-colors text-lg text-[#a8a29e] hover:text-[#faf7f2]"
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
