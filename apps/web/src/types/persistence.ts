import type { Investigation } from './investigation'
import type { MockAlert } from './alerts'
import type { CaseWorkspaceState } from './workspace'
import type { SiemPlatform } from './queryPlan'

/**
 * Local demo persistence model (v1.2.0).
 *
 * The serialized, backend-persisted slice of SentinelIQ's domain state. This is the ONLY
 * shape that crosses the persistence boundary — transient UI state (command overlay,
 * loading, chips, action output, unsaved editor text) is deliberately excluded.
 */
export const PERSISTENCE_SCHEMA_VERSION = 1

export interface PersistedLogsMemory {
  selectedPlatform?: SiemPlatform
}

export interface PersistedSentinelIQState {
  schemaVersion: number
  generatedAt: string
  investigations: Investigation[]
  alerts: MockAlert[]
  workspaceMemory: Record<string, CaseWorkspaceState>
  logsMemory: PersistedLogsMemory
  savedQueries: string[]
  recentQueries: string[]
  userPreferences: Record<string, unknown>
  demoMetadata: { appVersion?: string; lastResetAt?: string }
}

/** Server hydration response — every domain field may be null when nothing is persisted yet. */
export interface PersistenceStateResponse {
  schemaVersion: number
  generatedAt: string
  hasPersistedState: boolean
  investigations: Investigation[] | null
  alerts: MockAlert[] | null
  workspaceMemory: Record<string, CaseWorkspaceState> | null
  logsMemory: PersistedLogsMemory | null
  savedQueries: string[] | null
  recentQueries: string[] | null
  userPreferences: Record<string, unknown> | null
  demoMetadata: PersistedSentinelIQState['demoMetadata'] | null
}

export interface PersistenceHealth {
  status: string
  storageMode: string
  mockMode: boolean
  dbPath: string
  schemaVersion: number
  documentCount: number
  lastUpdated: string | null
  lastSaved: string | null
}

export type BackendStatus = 'idle' | 'connecting' | 'connected' | 'disconnected'
export type StorageMode = 'local-sqlite' | 'browser-fallback'
