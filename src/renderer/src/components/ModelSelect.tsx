// src/renderer/src/components/ModelSelect.tsx
import React from 'react'
import { useAppContext } from '../context/AppContext'

export default function ModelSelect() {
  const { state, dispatch } = useAppContext()

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-[#6b6560]">模型:</span>
      <select
        className="bg-[#332e2b] border border-[#3a3430] rounded-lg px-2 py-1 text-xs
                   text-[#a8a29e]
                   focus:outline-none focus:border-[#f0836a] cursor-pointer transition-all"
        value={state.currentModel}
        onChange={(e) => dispatch({ type: 'SET_CURRENT_MODEL', payload: e.target.value })}
      >
        {state.models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  )
}
