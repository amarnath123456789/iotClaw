import React, { useEffect, useState } from 'react'
import { api } from '../api.js'

const TRIGGER_ICONS = { mqtt_event: '⬡', time: '◷', manual: '▷' }
const TRIGGER_LABELS = { mqtt_event: 'MQTT event', time: 'Time trigger', manual: 'Manual' }

export default function WorkflowList({ onEdit, onNew, refreshKey }) {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    setLoading(true)
    api.listWorkflows()
      .then(setWorkflows)
      .catch(() => setError('Could not reach backend'))
      .finally(() => setLoading(false))
  }, [refreshKey])

  async function handleToggle(e, wf) {
    e.stopPropagation()
    const updated = await api.toggleWorkflow(wf.id)
    setWorkflows(prev => prev.map(w => w.id === wf.id ? { ...w, enabled: updated.enabled } : w))
  }

  async function handleDelete(e, wf) {
    e.stopPropagation()
    if (!confirm(`Delete "${wf.name}"?`)) return
    await api.deleteWorkflow(wf.id)
    setWorkflows(prev => prev.filter(w => w.id !== wf.id))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-claw-border shrink-0">
        <div>
          <h2 className="font-display text-lg text-claw-text">Workflows</h2>
          <p className="text-claw-sub text-xs font-body mt-0.5">{workflows.length} saved automation{workflows.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={onNew}
          className="px-4 py-2 rounded-xl bg-claw-amber/15 border border-claw-amber/30
            text-claw-amber text-sm font-body font-medium hover:bg-claw-amber/25 transition-all"
        >
          + New
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="flex gap-1.5">
              {[0,1,2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-claw-sub animate-pulse_dot"
                  style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-body">
            {error}
          </div>
        )}
        {!loading && !error && workflows.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <span className="text-3xl text-claw-border">⬡</span>
            <p className="text-claw-sub text-sm font-body">No workflows yet.<br/>Create one or ask the AI in chat.</p>
          </div>
        )}
        {workflows.map(wf => (
          <div
            key={wf.id}
            onClick={() => onEdit(wf)}
            className="group px-4 py-3.5 rounded-xl border border-claw-border
              bg-claw-surface hover:border-claw-amber/30 hover:bg-claw-muted/20
              cursor-pointer transition-all duration-150 animate-fadeup"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-claw-amber text-xs font-mono">
                    {TRIGGER_ICONS[wf.trigger?.type] || '▷'}
                  </span>
                  <span className="text-claw-text text-sm font-body font-medium truncate">{wf.name}</span>
                  <span className="text-claw-sub text-xs font-mono shrink-0">v{wf.version}</span>
                </div>
                {wf.description && (
                  <p className="text-claw-sub text-xs font-body truncate mb-2">{wf.description}</p>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-claw-sub text-xs font-body">
                    {TRIGGER_LABELS[wf.trigger?.type] || 'Manual'}
                  </span>
                  <span className="text-claw-border text-xs">·</span>
                  <span className="text-claw-sub text-xs font-body">
                    {wf.actions?.length || 0} action{(wf.actions?.length || 0) !== 1 ? 's' : ''}
                  </span>
                  {wf.conditions?.length > 0 && (
                    <>
                      <span className="text-claw-border text-xs">·</span>
                      <span className="text-claw-sub text-xs font-body">
                        {wf.conditions.length} condition{wf.conditions.length !== 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={e => handleToggle(e, wf)}
                  className={`w-9 h-5 rounded-full border transition-all duration-200 relative
                    ${wf.enabled
                      ? 'bg-claw-accent/20 border-claw-accent/40'
                      : 'bg-claw-muted border-claw-border'
                    }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200
                    ${wf.enabled ? 'left-4 bg-claw-accent' : 'left-0.5 bg-claw-sub'}`} />
                </button>
                <button
                  onClick={e => handleDelete(e, wf)}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg
                    flex items-center justify-center text-claw-sub hover:text-red-400
                    hover:bg-red-500/10 transition-all text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}