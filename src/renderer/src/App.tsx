// src/renderer/src/App.tsx
import React, { useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ChatView from './components/ChatView'
import InputArea from './components/InputArea'
import { useAppContext } from './context/AppContext'

export default function App() {
  const { state } = useAppContext()
  const themeClass = `theme-${state.theme}`

  useEffect(() => {
    document.documentElement.className = themeClass
  }, [themeClass])

  return (
    <div className="flex h-screen bg-[var(--bg-root)] text-[var(--fg-primary)] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <ChatView />
        <InputArea />
      </div>
    </div>
  )
}
