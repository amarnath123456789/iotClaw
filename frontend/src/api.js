const BASE = 'http://localhost:8000'

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`)
  return res.json()
}

export const api = {
  chat:              (messages, mode) => req('POST', '/chat', { messages, mode }),
  listWorkflows:     ()               => req('GET',  '/workflows'),
  createWorkflow:    (data)           => req('POST', '/workflows', data),
  getWorkflow:       (id)             => req('GET',  `/workflows/${id}`),
  updateWorkflow:    (id, data)       => req('PUT',  `/workflows/${id}`, data),
  deleteWorkflow:    (id)             => req('DELETE',`/workflows/${id}`),
  toggleWorkflow:    (id)             => req('PATCH', `/workflows/${id}/toggle`),
  getAudit:          ()               => req('GET',  '/audit'),
}