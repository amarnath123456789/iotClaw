import React from 'react'

function parseContent(text, mode) {
  if (mode !== 'poweruser') return <p className="text-sm font-body leading-relaxed">{text}</p>

  // For power user: detect ```json blocks and render them highlighted
  const parts = text.split(/(```json[\s\S]*?```)/g)
  return (
    <div className="space-y-3">
      {parts.map((part, i) => {
        if (part.startsWith('```json')) {
          const code = part.replace(/^```json\n?/, '').replace(/```$/, '')
          return (
            <pre key={i} className="bg-claw-bg border border-claw-border rounded-xl p-4
              text-claw-accent font-mono text-xs overflow-x-auto">
              {code}
            </pre>
          )
        }
        return part.trim()
          ? <p key={i} className="text-sm font-body leading-relaxed">{part.trim()}</p>
          : null
      })}
    </div>
  )
}

export function UserMessage({ text }) {
  return (
    <div className="flex justify-end animate-fadeup">
      <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-br-sm
        bg-claw-accent/15 border border-claw-accent/20 text-claw-text">
        <p className="text-sm font-body leading-relaxed">{text}</p>
      </div>
    </div>
  )
}

export function BotMessage({ text, mode, isLoading }) {
  const modeAccent = {
    consumer: 'text-claw-accent',
    maker: 'text-claw-amber',
    poweruser: 'text-claw-blue',
  }
  const modeBorder = {
    consumer: 'border-claw-accent/15',
    maker: 'border-claw-amber/15',
    poweruser: 'border-claw-blue/15',
  }

  return (
    <div className="flex gap-3 animate-fadeup">
      <div className={`w-7 h-7 rounded-lg bg-claw-surface border ${modeBorder[mode]}
        flex items-center justify-center shrink-0 mt-0.5`}>
        <span className={`text-xs font-mono ${modeAccent[mode]}`}>⌥</span>
      </div>
      <div className={`flex-1 px-4 py-3 rounded-2xl rounded-tl-sm
        bg-claw-surface border ${modeBorder[mode]} text-claw-text`}>
        {isLoading ? (
          <div className="flex items-center gap-1.5 h-5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-claw-sub animate-pulse_dot"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        ) : parseContent(text, mode)}
      </div>
    </div>
  )
}