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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="bg-[#231f1d] rounded-xl shadow-2xl w-[420px] p-6 border border-[#3a3430]"
        onKeyDown={handleKeyDown}
      >
        <h2 className="text-lg font-semibold mb-4 text-[#faf7f2]">新建会话</h2>

        <label className="block text-sm text-[#a8a29e] mb-1">会话名称</label>
        <input
          type="text"
          className="w-full bg-[#332e2b] border border-[#3a3430] rounded-lg px-3 py-2.5 text-sm
                     text-[#faf7f2] placeholder-[#6b6560]
                     focus:outline-none focus:border-[#f0836a] focus:ring-1 focus:ring-[#f0836a]/30
                     transition-all mb-4"
          placeholder="例如：前端Bug修复"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <label className="block text-sm text-[#a8a29e] mb-1">工作目录</label>
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            className="flex-1 bg-[#332e2b] border border-[#3a3430] rounded-lg px-3 py-2.5 text-sm
                       text-[#a8a29e] placeholder-[#6b6560]
                       focus:outline-none focus:border-[#f0836a] focus:ring-1 focus:ring-[#f0836a]/30
                       transition-all"
            placeholder="点击右侧按钮选择..."
            value={workDir}
            onChange={(e) => setWorkDir(e.target.value)}
            readOnly
          />
          <button
            className="px-3 py-2.5 text-sm rounded-lg bg-[#332e2b] border border-[#3a3430]
                       text-[#a8a29e] hover:text-[#faf7f2] hover:border-[#57534e]
                       transition-all whitespace-nowrap"
            onClick={handleSelectDir}
          >
            浏览...
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 text-sm rounded-lg bg-[#292524] hover:bg-[#332e2b]
                       text-[#a8a29e] transition-all"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="px-4 py-2 text-sm rounded-lg bg-[#f0836a] hover:bg-[#e0684e]
                       text-white font-medium transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed"
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
