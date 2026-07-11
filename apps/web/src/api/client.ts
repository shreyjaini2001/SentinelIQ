import type {
  ClassifyResult,
  QueryResult,
  SuggestionChip,
  AutocompleteCompletion,
  ActionProgressEvent,
} from '../types'
import { API_BASE as BASE } from '../utils/apiBase'

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json()
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`, window.location.origin)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function classify(text: string, sessionId?: string): Promise<ClassifyResult> {
  return post('/classify', { text, session_id: sessionId })
}

export async function query(
  text: string,
  sessionId: string,
  mode: 'query' | 'refine' = 'query',
): Promise<QueryResult> {
  return post('/query', { text, session_id: sessionId, mode })
}

export async function createSession(analystId = 'default'): Promise<{ session_id: string; expires_at: string }> {
  return post(`/session?analyst_id=${analystId}`, {})
}

export async function getSuggestions(sessionId: string): Promise<{ chips: SuggestionChip[] }> {
  return get('/suggestions', { session_id: sessionId })
}

export async function getAutocomplete(q: string, sessionId?: string): Promise<{ completions: AutocompleteCompletion[] }> {
  const params: Record<string, string> = { q }
  if (sessionId) params.session_id = sessionId
  return get('/autocomplete', params)
}

export function streamAction(
  text: string,
  sessionId: string,
  confirmedHandler: string | undefined,
  onEvent: (event: ActionProgressEvent) => void,
  onDone: () => void,
): () => void {
  let aborted = false

  const run = async () => {
    try {
      const res = await fetch(`${BASE}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, session_id: sessionId, confirmed_handler: confirmedHandler }),
      })
      if (!res.ok) {
        onEvent({ type: 'error', message: `Server error ${res.status}` })
        return
      }
      if (!res.body) {
        onEvent({ type: 'error', message: 'No response body from server' })
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (!aborted) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''
        for (const part of parts) {
          const lines = part.trim().split('\n')
          let eventType = 'progress'
          let data = ''
          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7)
            if (line.startsWith('data: ')) data = line.slice(6)
          }
          if (data) {
            try {
              onEvent({ type: eventType as ActionProgressEvent['type'], ...JSON.parse(data) })
            } catch {
              // malformed SSE chunk — skip
            }
          }
        }
      }
      reader.cancel()
    } catch (err) {
      onEvent({ type: 'error', message: err instanceof Error ? err.message : 'Network error' })
    } finally {
      onDone()
    }
  }

  run()
  return () => { aborted = true }
}

export async function shareSession(sessionId: string): Promise<{ share_token: string; share_url: string; expires_at: string }> {
  return post(`/session/${sessionId}/share`, {})
}

// ── Connectors / ingestion (v1.3.0) ────────────────────────────────────────
// Deterministic mock endpoints. Callers wrap these in try/catch so the Data Sources page
// stays fully usable (frontend registry is the source of truth) when the backend is down.

export async function getConnectors(): Promise<{ connectors: unknown[] }> {
  return get('/connectors')
}

export async function testConnector(id: string): Promise<unknown> {
  return post(`/connectors/${id}/test`, {})
}

/** Persist an ingestion run for a connector. Sends the run the frontend built; backend stores it. */
export async function syncConnector(id: string, run?: unknown): Promise<{ run: unknown }> {
  return post(`/connectors/${id}/sync`, run ?? {})
}

export async function getIngestionRuns(): Promise<{ runs: unknown[] }> {
  return get('/ingestion-runs')
}

export async function getSampleEvents(
  id: string,
  limit = 12,
): Promise<{ connectorId: string; status: string; events: unknown[] }> {
  return get(`/connectors/${id}/sample-events`, { limit: String(limit) })
}
