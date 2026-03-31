import React from 'react'

const modes = [
  { id: 'consumer',  label: 'Consumer',   icon: '◎',   desc: 'Chat in plain language', color: 'text-claw-accent', activeBg: 'bg-claw-accent/10 border-claw-accent/30' },
  { id: 'maker',     label: 'Maker',      icon: '⬡',   desc: 'Build + save workflows', color: 'text-claw-amber',  activeBg: 'bg-claw-amber/10 border-claw-amber/30' },
  { id: 'poweruser', label: 'Power User', icon: '⟨/⟩', desc: 'Get raw JSON output',    color: 'text-claw-blue',   activeBg: 'bg-claw-blue/10 border-claw-blue/30' },
]

const views = [
  { id: 'chat',      label: 'Chat',      icon: '◈' },
  { id: 'workflows', label: 'Workflows', icon: '⬡' },
  { id: 'dashboard', label: 'Dashboard', icon: '◩' },
]

export default function Sidebar({ mode, setMode, view, setView, onClear }) {
  return (
    <aside className="w-64 h-screen flex flex-col bg-claw-surface border-r border-claw-border shrink-0">
      <div className="px-6 pt-7 pb-5 border-b border-claw-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-claw-accent/20 flex items-center justify-center">
            <span className="text-claw-accent text-sm font-mono font-bold">⌥</span>
          </div>
          <span className="font-display text-lg text-claw-text tracking-tight">OpenClaw</span>
        </div>
        <p className="text-claw-sub text-xs mt-1.5 font-body">AI Automation Platform</p>
      </div>

      <div className="px-4 pt-4">
        <p className="text-claw-sub text-xs font-body font-medium uppercase tracking-widest mb-2 px-2">View</p>
        <div className="flex gap-1">
          {views.map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-body font-medium flex flex-col items-center gap-0.5
                transition-all duration-150 border
                ${view === v.id ? 'bg-claw-muted border-claw-border text-claw-text' : 'border-transparent text-claw-sub hover:text-claw-text hover:bg-claw-muted/40'}`}>
              <span className="font-mono text-sm">{v.icon}</span>
              <span>{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 flex-1">
        <p className="text-claw-sub text-xs font-body font-medium uppercase tracking-widest mb-2 px-2">Mode</p>
        <div className="space-y-1.5">
          {modes.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all duration-150
                ${mode === m.id ? `${m.activeBg} border` : 'border-transparent hover:bg-claw-muted/40'}`}>
              <div className="flex items-center gap-2.5">
                <span className={`text-base font-mono ${mode === m.id ? m.color : 'text-claw-sub'}`}>{m.icon}</span>
                <div>
                  <p className={`text-sm font-medium font-body ${mode === m.id ? 'text-claw-text' : 'text-claw-sub'}`}>{m.label}</p>
                  <p className="text-claw-sub text-xs font-body">{m.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-4 px-3 py-3 rounded-xl bg-claw-muted/30 border border-claw-border">
          {mode === 'consumer'  && <p className="text-claw-sub text-xs font-body leading-relaxed">Describe what you want. OpenClaw handles the rest.</p>}
          {mode === 'maker'     && <p className="text-claw-sub text-xs font-body leading-relaxed">Chat builds workflows. Save and edit in the Workflows view.</p>}
          {mode === 'poweruser' && <p className="text-claw-sub text-xs font-body leading-relaxed">Full JSON output. Copy or save directly to the engine.</p>}
        </div>
      </div>

      <div className="px-4 pb-6 pt-4 border-t border-claw-border">
        <button onClick={onClear}
          className="w-full px-3 py-2.5 rounded-xl text-claw-sub text-sm font-body
            hover:bg-claw-muted/40 hover:text-claw-text border border-transparent
            hover:border-claw-border transition-all duration-150 text-left">
          ↺ &nbsp;Clear chat
        </button>
      </div>
    </aside>
  )
}