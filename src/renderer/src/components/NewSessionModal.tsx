// src/renderer/src/components/NewSessionModal.tsx
import React, { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string, workDir: string) => void
}

export default function NewSessionModal({ isOpen, onClose, onCreate }: Props) {
  const [name, setName] = useState('')
  const [workDir, setWorkDir] = useState('')

  if (!isOpen) return null

  const handleCreate = () => {
    if (!name.trim()) return
    onCreate(name.trim(), workDir.trim() || '.')
    setName('')
    setWorkDir('')
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="bg-[#1a1b1e] rounded-lg shadow-xl w-[420px] p-6"
        onKeyDown={handleKeyDown}
      >
        <h2 className="text-lg font-semibold mb-4">新建会话</h2>

        <label className="block text-sm text-gray-400 mb-1">会话名称</label>
        <input
          type="text"
          className="w-full bg-[#313338] border border-gray-600 rounded px-3 py-2 text-sm
                     focus:outline-none focus:border-[#6c8ce0] mb-4"
          placeholder="例如：前端Bug修复"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <label className="block text-sm text-gray-400 mb-1">工作目录（可选）</label>
        <input
          type="text"
          className="w-full bg-[#313338] border border-gray-600 rounded px-3 py-2 text-sm
                     focus:outline-none focus:border-[#6c8ce0] mb-6"
          placeholder="留空使用当前目录"
          value={workDir}
          onChange={(e) => setWorkDir(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 text-sm rounded bg-gray-700 hover:bg-gray-600 transition-colors"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="px-4 py-2 text-sm rounded bg-[#6c8ce0] hover:bg-blue-500 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleCreate}
            disabled={!name.trim()}
          >
            创建
          </button>
        </div>
      </div>
    </div>
  )
}
