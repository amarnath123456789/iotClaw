import React, { useState, useEffect, useCallback } from 'react'
import { api } from '../api.js'

const BASE = 'http://localhost:8000'

async function fetchState() {
  const r = await fetch(BASE + '/state')
  return r.json()
}
async function fetchExecLog() {
  const r = await fetch(BASE + '/execlog')
  return r.json()
}
async function fetchNotifications() {
  const r = await fetch(BASE + '/notifications')
  return r.json()
}
async function controlDevice(path, value) {
  await fetch(`${BASE}/state/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value })
  })
}

// ── Sensor card ───────────────────────────────────────────────────────────────
function SensorCard({ topic, data }) {
  const name = data.label || topic.split('/')[1]
  const val = data.value
  const unit = data.unit || ''

  let display = ''
  let color = 'text-claw-sub'
  let bar = null

  if (unit === 'bool') {
    display = val ? 'Active' : 'Idle'
    color = val ? 'text-claw-accent' : 'text-claw-sub'
  } else if (unit === '%') {
    display = `${val}%`
    color = val < 30 ? 'text-red-400' : val > 70 ? 'text-claw-accent' : 'text-claw-amber'
    bar = <div className="mt-2 h-1 rounded-full bg-claw-muted overflow-hidden">
      <div className="h-full rounded-full bg-claw-accent transition-all duration-500"
        style={{ width: `${Math.min(100, val)}%` }} />
    </div>
  } else if (unit === 'C') {
    display = `${val}°C`
    color = val > 30 ? 'text-red-400' : val > 25 ? 'text-claw-amber' : 'text-claw-blue'
    bar = <div className="mt-2 h-1 rounded-full bg-claw-muted overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, ((val - 10) / 30) * 100)}%`,
                 background: val > 30 ? '#E24B4A' : val > 25 ? '#EF9F27' : '#378ADD' }} />
    </div>
  } else if (unit === 'lux') {
    display = `${val} lux`
    color = 'text-claw-amber'
  } else {
    display = String(val)
  }

  return (
    <div className="p-4 rounded-xl border border-claw-border bg-claw-surface">
      <div className="flex items-center justify-between mb-1">
        <span className="text-claw-sub text-xs font-body uppercase tracking-widest">{name}</span>
        <span className="w-2 h-2 rounded-full bg-claw-accent animate-pulse" />
      </div>
      <p className={`text-lg font-body font-medium ${color}`}>{display}</p>
      {bar}
    </div>
  )
}

// ── Device card ───────────────────────────────────────────────────────────────
function DeviceCard({ topic, data, onToggle }) {
  const name = data.label || topic.split('/')[1]
  const isOn = data.value === true || data.value === 'on'
  const isState = data.unit === 'state'

  return (
    <div className={`p-4 rounded-xl border transition-all duration-200
      ${isOn || (isState && data.value !== 'idle')
        ? 'border-claw-accent/30 bg-claw-accent/5'
        : 'border-claw-border bg-claw-surface'
      }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-claw-text text-sm font-body font-medium">{name}</p>
          <p className={`text-xs font-body mt-0.5 ${
            isOn || (isState && data.value !== 'idle') ? 'text-claw-accent' : 'text-claw-sub'
          }`}>
            {isState ? String(data.value) : isOn ? 'On' : 'Off'}
          </p>
        </div>
        {!isState && (
          <button
            onClick={() => onToggle(topic, !isOn)}
            className={`w-11 h-6 rounded-full border transition-all duration-200 relative
              ${isOn ? 'bg-claw-accent/20 border-claw-accent/40' : 'bg-claw-muted border-claw-border'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200
              ${isOn ? 'left-5 bg-claw-accent' : 'left-0.5 bg-claw-sub'}`} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Exec log row ──────────────────────────────────────────────────────────────
function LogRow({ entry }) {
  const time = entry.ts ? entry.ts.split('T')[1]?.split('.')[0] || '' : ''
  const isOk = entry.status === 'ok'
  return (
    <div className="flex items-start gap-3 py-2 border-b border-claw-border/40 last:border-0">
      <span className={`text-xs font-mono shrink-0 mt-0.5 ${isOk ? 'text-claw-accent' : 'text-red-400'}`}>
        {isOk ? '✓' : '✗'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-claw-text text-xs font-body font-medium truncate">{entry.workflow}</span>
          <span className="text-claw-border text-xs">·</span>
          <span className="text-claw-sub text-xs font-body">{entry.action}</span>
        </div>
        {entry.detail && <p className="text-claw-sub text-xs font-body mt-0.5 truncate">{entry.detail}</p>}
      </div>
      <span className="text-claw-sub text-xs font-mono shrink-0">{time}</span>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [state, setState] = useState({})
  const [execLog, setExecLog] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const [s, l, n] = await Promise.all([fetchState(), fetchExecLog(), fetchNotifications()])
      setState(s)
      setExecLog(l)
      setNotifications(n)
      setLastRefresh(new Date().toLocaleTimeString())
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 2000)
    return () => clearInterval(interval)
  }, [refresh])

  async function handleDeviceToggle(topic, value) {
    await controlDevice(topic, value)
    setTimeout(refresh, 200)
  }

  const sensors = Object.entries(state).filter(([k]) => k.startsWith('sensor/'))
  const devices = Object.entries(state).filter(([k]) => k.startsWith('device/'))

  return (
    <div className="flex flex-col h-full overflow-hidden bg-claw-bg">
      {/* Header */}
      <div className="px-6 py-5 border-b border-claw-border bg-claw-surface/50 shrink-0 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg text-claw-text">Dashboard</h2>
          <p className="text-claw-sub text-xs font-body mt-0.5">
            Live simulation &nbsp;·&nbsp; refreshes every 2s
            {lastRefresh && <span> &nbsp;·&nbsp; {lastRefresh}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-claw-accent animate-pulse" />
          <span className="text-claw-accent text-xs font-body">Live</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex gap-1.5">
              {[0,1,2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-claw-sub animate-pulse_dot"
                  style={{ animationDelay: `${i*0.2}s` }} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Notifications strip */}
            {notifications.length > 0 && (
              <div className="space-y-2">
                {notifications.slice(0, 3).map((n, i) => (
                  <div key={i} className="px-4 py-3 rounded-xl border border-claw-amber/30
                    bg-claw-amber/5 flex items-center gap-3 animate-fadeup">
                    <span className="text-claw-amber text-xs">⚑</span>
                    <span className="text-claw-text text-sm font-body flex-1">{n.message}</span>
                    <span className="text-claw-sub text-xs font-mono shrink-0">
                      {n.ts?.split('T')[1]?.split('.')[0]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Sensors */}
            <div>
              <p className="text-claw-sub text-xs font-body uppercase tracking-widest mb-3">Sensors</p>
              <div className="grid grid-cols-2 gap-3">
                {sensors.map(([topic, data]) => (
                  <SensorCard key={topic} topic={topic} data={data} />
                ))}
              </div>
            </div>

            {/* Devices */}
            <div>
              <p className="text-claw-sub text-xs font-body uppercase tracking-widest mb-3">Devices</p>
              <div className="grid grid-cols-2 gap-3">
                {devices.map(([topic, data]) => (
                  <DeviceCard
                    key={topic} topic={topic} data={data}
                    onToggle={handleDeviceToggle}
                  />
                ))}
              </div>
            </div>

            {/* Execution log */}
            <div>
              <p className="text-claw-sub text-xs font-body uppercase tracking-widest mb-3">Execution log</p>
              <div className="rounded-xl border border-claw-border bg-claw-surface px-4 py-2">
                {execLog.length === 0 ? (
                  <p className="text-claw-sub text-sm font-body py-4 text-center">
                    No executions yet. Enable a workflow to see activity.
                  </p>
                ) : (
                  execLog.slice(0, 20).map((entry, i) => <LogRow key={i} entry={entry} />)
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}