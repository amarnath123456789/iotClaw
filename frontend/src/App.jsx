import React, { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Chat from './components/Chat.jsx'
import WorkflowList from './components/WorkflowList.jsx'
import WorkflowEditor from './components/WorkflowEditor.jsx'
import Dashboard from './components/Dashboard.jsx'

export default function App() {
  const [mode, setMode] = useState('consumer')
  const [view, setView] = useState('chat')
  const [messagesByMode, setMessagesByMode] = useState({ consumer: [], maker: [], poweruser: [] })
  const [wfView, setWfView]       = useState('list')
  const [editingWf, setEditingWf] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  function setMessages(msgs) {
    setMessagesByMode(prev => ({ ...prev, [mode]: msgs }))
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        mode={mode} setMode={setMode}
        view={view} setView={v => { setView(v); if (v !== 'workflows') setWfView('list') }}
        onClear={() => setMessagesByMode(prev => ({ ...prev, [mode]: [] }))}
      />
      <main className="flex-1 overflow-hidden">
        {view === 'chat' && (
          <Chat mode={mode} messages={messagesByMode[mode]} setMessages={setMessages}
            onWorkflowSaved={() => setRefreshKey(k => k + 1)} />
        )}
        {view === 'workflows' && wfView === 'list' && (
          <WorkflowList refreshKey={refreshKey}
            onEdit={wf => { setEditingWf(wf); setWfView('editor') }}
            onNew={() => { setEditingWf(null); setWfView('editor') }} />
        )}
        {view === 'workflows' && wfView === 'editor' && (
          <WorkflowEditor initial={editingWf}
            onSaved={() => { setRefreshKey(k => k + 1); setWfView('list'); setEditingWf(null) }}
            onCancel={() => setWfView('list')} />
        )}
        {view === 'dashboard' && <Dashboard />}
      </main>
    </div>
  )
}