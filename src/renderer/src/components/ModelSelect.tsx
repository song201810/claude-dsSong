// src/renderer/src/components/ModelSelect.tsx
import React from 'react'
import { useAppContext } from '../context/AppContext'

export default function ModelSelect() {
  const { state, dispatch } = useAppContext()

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500">模型:</span>
      <select
        className="bg-[#313338] border border-gray-600 rounded px-2 py-1 text-xs
                   focus:outline-none focus:border-[#6c8ce0] cursor-pointer"
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
