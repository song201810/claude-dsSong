// src/renderer/src/components/ModelSelect.tsx
import React from 'react'
import { useAppContext } from '../context/AppContext'

export default function ModelSelect() {
  const { state, dispatch } = useAppContext()

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-[var(--fg-dim)]">模型:</span>
      <select
        className="bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs
                   text-[var(--fg-muted)]
                   focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 cursor-pointer transition-all"
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
