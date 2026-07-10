import { useInvestigationStore } from '../stores/investigationStore'
import { useAlertStore } from '../stores/alertStore'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useLogsStore } from '../stores/logsStore'
import {
  PERSISTENCE_SCHEMA_VERSION,
  type PersistedSentinelIQState,
  type PersistenceStateResponse,
} from '../types/persistence'
import { APP_VERSION } from './appVersion'
import { resetPersistedState } from './persistenceClient'

/**
 * Serialize the persist-worthy domain state (v1.2.0) and apply a hydration payload back.
 *
 * Persisted: investigations (turns/artifacts/query results/notes/pinned findings/reports),
 * alert data (status/audit trail/linked case), workspace checkpoints, saved/recent queries,
 * and platform preference. NOT persisted: command overlay, loading/running state, chips,
 * action output, unsaved editor text, or the active-case selection (scratch-first is kept).
 */

export function buildSnapshot(): PersistedSentinelIQState {
  const inv = useInvestigationStore.getState()
  const alerts = useAlertStore.getState()
  const ws = useWorkspaceStore.getState()
  const logs = useLogsStore.getState()

  return {
    schemaVersion: PERSISTENCE_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    investigations: inv.investigations,
    alerts: alerts.alerts,
    workspaceMemory: ws.workspaces,
    logsMemory: { selectedPlatform: logs.selectedPlatform },
    savedQueries: logs.savedQueries,
    recentQueries: logs.recentQueries,
    userPreferences: {},
    demoMetadata: { appVersion: APP_VERSION },
  }
}

/**
 * A stable signature of the persist-worthy state (excludes `generatedAt`) so the autosave
 * loop can skip no-op writes — e.g. typing in the Logs editor doesn't change this.
 */
export function snapshotSignature(snap: PersistedSentinelIQState): string {
  const { generatedAt: _omit, ...rest } = snap
  return JSON.stringify(rest)
}

/**
 * Apply a server hydration payload to the stores. Every field is validated/defaulted:
 * missing or malformed sections are skipped (the store keeps its mock seed). Never throws,
 * never sets the active case (scratch-first landing preserved).
 */
export function applySnapshot(state: PersistenceStateResponse): void {
  try {
    if (Array.isArray(state.investigations) && state.investigations.length > 0) {
      useInvestigationStore.getState().hydrateInvestigations(state.investigations)
    }
    if (Array.isArray(state.alerts) && state.alerts.length > 0) {
      useAlertStore.getState().hydrateAlerts(state.alerts)
    }
    if (state.workspaceMemory && typeof state.workspaceMemory === 'object') {
      useWorkspaceStore.getState().hydrateWorkspaces(state.workspaceMemory)
    }
    useLogsStore.getState().hydrateLogsMemory({
      savedQueries: state.savedQueries ?? undefined,
      recentQueries: state.recentQueries ?? undefined,
      selectedPlatform: state.logsMemory?.selectedPlatform,
    })
  } catch {
    // Corrupt payload → keep in-memory mock state. Persistence must never crash the app.
  }
}

/**
 * Reset demo data: clear the backend store (best-effort) and reseed every store to its mock
 * default, returning to Scratch Mode. Local stores are reset even if the backend is down; the
 * autosave loop then re-persists the seed once the backend is reachable.
 */
export async function resetDemoData(): Promise<void> {
  try {
    await resetPersistedState()
  } catch {
    // Backend unavailable — still reset local state below.
  }
  useInvestigationStore.getState().resetToSeed() // also clears the active case → Scratch
  useAlertStore.getState().resetAlerts()
  useWorkspaceStore.getState().resetWorkspaces()
  useLogsStore.getState().resetLogsMemory()
}

