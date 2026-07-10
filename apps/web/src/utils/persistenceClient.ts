import { API_BASE } from './apiBase'
import type {
  PersistedSentinelIQState,
  PersistenceStateResponse,
  PersistenceHealth,
} from '../types/persistence'

/**
 * Thin client for the v1.2.0 local demo persistence API. Every call is best-effort: callers
 * are expected to catch and degrade gracefully (browser-fallback) so persistence never
 * freezes the app. A short timeout keeps a down backend from hanging hydration.
 */

const TIMEOUT_MS = 4000

async function withTimeout(input: string, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    return await fetch(input, { ...init, signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

export async function fetchPersistedState(): Promise<PersistenceStateResponse> {
  const res = await withTimeout(`${API_BASE}/persistence/state`)
  if (!res.ok) throw new Error(`persistence GET ${res.status}`)
  return res.json()
}

export async function savePersistedState(
  snapshot: PersistedSentinelIQState,
): Promise<{ savedAt: string }> {
  const res = await withTimeout(`${API_BASE}/persistence/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
  })
  if (!res.ok) throw new Error(`persistence PUT ${res.status}`)
  return res.json()
}

export async function resetPersistedState(): Promise<void> {
  const res = await withTimeout(`${API_BASE}/persistence/reset`, { method: 'POST' })
  if (!res.ok) throw new Error(`persistence reset ${res.status}`)
}

export async function fetchPersistenceHealth(): Promise<PersistenceHealth> {
  const res = await withTimeout(`${API_BASE}/persistence/health`)
  if (!res.ok) throw new Error(`persistence health ${res.status}`)
  return res.json()
}
