import { create } from 'zustand'
import type { IngestionRun, TestConnectionResult } from '../types/connectors'
import type { NormalizedSecurityEvent } from '../types/events'
import { getConnector, isMockConnector } from '../utils/connectors/connectorRegistry'
import * as api from '../api/client'

/**
 * Connector runtime state (v1.3.0). The connector *registry* is the deterministic source of
 * truth for metadata; this store holds transient runtime state — test results, the event
 * preview, and ingestion-run history. Ingestion runs are persisted to the backend when
 * reachable, with a graceful in-memory fallback so the page always works.
 */
interface ConnectorStoreState {
  ingestionRuns: IngestionRun[]
  lastTest: Record<string, TestConnectionResult>
  lastSync: Record<string, string> // connectorId → ISO timestamp
  previewConnectorId: string | null
  previewEvents: NormalizedSecurityEvent[]
  previewLoading: boolean
  previewError: string | null
  hydrated: boolean

  hydrate: () => Promise<void>
  testConnection: (id: string) => TestConnectionResult
  preview: (id: string) => Promise<void>
  clearPreview: () => void
  runSync: (id: string) => Promise<IngestionRun>
}

function buildRun(id: string): IngestionRun {
  const connector = getConnector(id)
  const startedAt = new Date().toISOString()
  if (!connector || !isMockConnector(id)) {
    return {
      id: `RUN-${Date.now()}`,
      connectorId: id,
      connectorName: connector?.meta.name ?? id,
      startedAt,
      completedAt: new Date().toISOString(),
      status: 'failed',
      recordsFetched: 0,
      recordsNormalized: 0,
      alertsCreated: 0,
      errors: ['Connector not configured — real integration is future work.'],
      mode: 'real_placeholder',
    }
  }
  const alerts = connector.fetchAlerts()
  const samples = connector.fetchSampleEvents(12)
  const fetched = alerts.length + samples.length
  return {
    id: `RUN-${Date.now()}`,
    connectorId: id,
    connectorName: connector.meta.name,
    startedAt,
    completedAt: new Date().toISOString(),
    status: 'success',
    recordsFetched: fetched,
    recordsNormalized: fetched,
    alertsCreated: alerts.length,
    errors: [],
    mode: 'mock',
  }
}

export const useConnectorStore = create<ConnectorStoreState>((set, get) => ({
  ingestionRuns: [],
  lastTest: {},
  lastSync: {},
  previewConnectorId: null,
  previewEvents: [],
  previewLoading: false,
  previewError: null,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return
    try {
      const { runs } = await api.getIngestionRuns()
      const list = (runs as IngestionRun[]) ?? []
      const lastSync: Record<string, string> = {}
      for (const r of list) {
        if (r.status === 'success' && r.completedAt && !lastSync[r.connectorId]) {
          lastSync[r.connectorId] = r.completedAt
        }
      }
      set({ ingestionRuns: list, lastSync, hydrated: true })
    } catch {
      // Backend unavailable — the page still works with in-memory runs.
      set({ hydrated: true })
    }
  },

  testConnection: (id) => {
    const connector = getConnector(id)
    const result: TestConnectionResult = connector
      ? connector.testConnection()
      : { ok: false, status: 'error', message: 'Unknown connector.' }
    set((s) => ({ lastTest: { ...s.lastTest, [id]: result } }))
    // Best-effort backend echo (non-blocking).
    void api.testConnector(id).catch(() => {})
    return result
  },

  preview: async (id) => {
    // Prevent duplicate/overlapping loads.
    if (get().previewLoading) return
    set({ previewConnectorId: id, previewEvents: [], previewLoading: true, previewError: null })

    // The local MockSocConnector is the deterministic, always-available source of truth.
    const connector = getConnector(id)
    const localEvents = connector ? connector.fetchSampleEvents(12) : []

    // Prefer the backend (real async, exercises the route); fall back to local if it's down
    // or returns nothing. Either way the preview is deterministic and never throws.
    let events: NormalizedSecurityEvent[] = localEvents
    try {
      const res = await api.getSampleEvents(id, 12)
      const backendEvents = (res?.events as NormalizedSecurityEvent[]) ?? []
      if (backendEvents.length > 0) events = backendEvents
    } catch {
      // Backend unavailable — keep the local events.
    }

    // Ignore stale responses if the user switched connectors mid-load.
    if (get().previewConnectorId !== id) return
    set({
      previewEvents: events,
      previewLoading: false,
      previewError: events.length > 0 ? null : 'No sample events available for this connector.',
    })
  },

  clearPreview: () => set({ previewConnectorId: null, previewEvents: [], previewLoading: false, previewError: null }),

  runSync: async (id) => {
    const run = buildRun(id)
    // Optimistically show the run; persist to the backend best-effort.
    set((s) => ({
      ingestionRuns: [run, ...s.ingestionRuns].slice(0, 50),
      lastSync: run.status === 'success' && run.completedAt
        ? { ...s.lastSync, [id]: run.completedAt }
        : s.lastSync,
    }))
    try {
      const res = await api.syncConnector(id, run)
      const persisted = (res?.run as IngestionRun) ?? run
      // Reconcile with the backend's stored record (id/counts authoritative if present).
      set((s) => ({ ingestionRuns: [persisted, ...s.ingestionRuns.filter((r) => r.id !== run.id)].slice(0, 50) }))
      return persisted
    } catch {
      return run
    }
  },
}))
