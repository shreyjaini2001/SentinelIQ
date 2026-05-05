import type {
  ClassifyResult,
  QueryResult,
  SuggestionChip,
  AutocompleteCompletion,
  ActionProgressEvent,
} from '../types'

const BASE = '/api/v1'

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
  confirmedHandler?: string,
  onEvent?: (event: ActionProgressEvent) => void,
): () => void {
  let aborted = false

  const run = async () => {
    const res = await fetch(`${BASE}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, session_id: sessionId, confirmed_handler: confirmedHandler }),
    })
    if (!res.body) return
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
        if (data && onEvent) {
          try {
            onEvent({ type: eventType as ActionProgressEvent['type'], ...JSON.parse(data) })
          } catch {}
        }
      }
    }
    reader.cancel()
  }

  run()
  return () => { aborted = true }
}

export async function shareSession(sessionId: string): Promise<{ share_token: string; share_url: string; expires_at: string }> {
  return post(`/session/${sessionId}/share`, {})
}
