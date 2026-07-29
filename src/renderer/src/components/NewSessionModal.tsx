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
    onCreate(name.trim(), workDir || '.')
    setName('')
    setWorkDir('')
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) handleCreate()
    if (e.key === 'Escape') onClose()
  }

  const handleSelectDir = async () => {
    const dir = await window.api.selectDirectory()
    if (dir) {
      setWorkDir(dir)
    }
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

        <label className="block text-sm text-gray-400 mb-1">工作目录</label>
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            className="flex-1 bg-[#313338] border border-gray-600 rounded px-3 py-2 text-sm
                       focus:outline-none focus:border-[#6c8ce0] text-gray-300"
            placeholder="点击右侧按钮选择..."
            value={workDir}
            onChange={(e) => setWorkDir(e.target.value)}
            readOnly
          />
          <button
            className="px-3 py-2 text-sm rounded bg-gray-600 hover:bg-gray-500 transition-colors
                       whitespace-nowrap"
            onClick={handleSelectDir}
          >
            浏览...
          </button>
        </div>

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
