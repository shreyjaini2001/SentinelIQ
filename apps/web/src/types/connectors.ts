import type { SourcePlatform, NormalizedSecurityEvent, EventCategory } from './events'

/**
 * Connector / ingestion foundation types (v1.3.0).
 *
 * Defines the boundary for how future security data enters SentinelIQ. Only the mock
 * connector is implemented; Sentinel/Splunk/Elastic/EDR/IdP are declared placeholders that
 * report `not_configured` and never call a real API.
 */

export type ConnectorStatus = 'connected' | 'not_configured' | 'error' | 'disabled'

/** How an ingestion run executed (never real yet). */
export type ConnectorMode = 'mock' | 'dry_run' | 'real_placeholder'

export type ConnectorCapability =
  | 'authentication'
  | 'process'
  | 'network'
  | 'identity'
  | 'cloud'
  | 'alerts'
  | 'rules'
  | 'query'

export interface ConnectorSource {
  name: string
  kind: 'table' | 'index' | 'stream'
  category?: EventCategory
}

/** Static + runtime metadata describing a connector (what the Data Sources page renders). */
export interface ConnectorMetadata {
  id: string
  name: string
  platform: SourcePlatform
  description: string
  status: ConnectorStatus
  mode: ConnectorMode
  capabilities: ConnectorCapability[]
  recordsAvailable: number
  lastSync: string | null
  /** Plain-language note (e.g. "Planned — real credentials are future work"). */
  note?: string
}

export interface TestConnectionResult {
  ok: boolean
  status: ConnectorStatus
  message: string
}

/**
 * The provider interface every connector implements. Methods are synchronous for the
 * deterministic mock; a future real connector would return Promises (the UI already treats
 * results as data, so widening to async later is a localized change).
 */
export interface SecurityDataConnector {
  meta: ConnectorMetadata
  listSources(): ConnectorSource[]
  testConnection(): TestConnectionResult
  fetchSampleEvents(limit?: number): NormalizedSecurityEvent[]
  fetchAlerts(): NormalizedSecurityEvent[]
  runQuery(renderedQuery: string): NormalizedSecurityEvent[]
  normalize(raw: Record<string, unknown>): NormalizedSecurityEvent
  getLastSync(): string | null
}

// ── Ingestion runs ────────────────────────────────────────────────────────

export type IngestionStatus = 'pending' | 'running' | 'success' | 'failed'

export interface IngestionRun {
  id: string
  connectorId: string
  connectorName: string
  startedAt: string
  completedAt: string | null
  status: IngestionStatus
  recordsFetched: number
  recordsNormalized: number
  alertsCreated: number
  errors: string[]
  mode: ConnectorMode
}
