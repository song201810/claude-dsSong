// src/renderer/src/App.tsx
import React from 'react'
import Sidebar from './components/Sidebar'
import ChatView from './components/ChatView'
import InputArea from './components/InputArea'

export default function App() {
  return (
    <div className="flex h-screen bg-[#1e1f22] text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <ChatView />
        <InputArea />
      </div>
    </div>
  )
}
