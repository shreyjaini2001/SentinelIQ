import { SCRATCH_WORKSPACE_ID } from '../types/workspace'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useLogsStore, SCRATCH_CASE_TARGET } from '../stores/logsStore'
import { useAlertStore } from '../stores/alertStore'
import { coerceStatusFilter, coerceSeverityFilter, filterValidAlertIds } from './workspaceRestoreGuards'
import type { SiemPlatform } from '../types/queryPlan'

/**
 * Resolve the current workspace id from the active investigation.
 * `null` active case → the neutral Scratch workspace.
 */
export function workspaceIdFor(activeInvestigationId: string | null): string {
  return activeInvestigationId ?? SCRATCH_WORKSPACE_ID
}

export function isScratchWorkspace(id: string): boolean {
  return id === SCRATCH_WORKSPACE_ID
}

// ──────────────────────────────────────────────────────────────────────────
// Per-workspace Logs state (v1.1.5)
//
// logsStore is a single global store. To make Logs feel workspace-scoped without a large
// rewrite, we snapshot the relevant Logs UI state into the outgoing workspace's checkpoint
// and restore it (or reset to a fresh scratch state) when entering a workspace. Query
// *results* are intentionally NOT snapshotted — they are transient/heavy and re-run cheaply.
// ──────────────────────────────────────────────────────────────────────────

/** Snapshot the current Logs editor state into a case workspace. Scratch is ephemeral — skipped. */
export function snapshotWorkspaceLogs(workspaceId: string): void {
  if (isScratchWorkspace(workspaceId)) return
  const ls = useLogsStore.getState()
  useWorkspaceStore.getState().patchWorkspace(workspaceId, {
    logsState: {
      kql: ls.kql,
      selectedPlatform: ls.selectedPlatform,
      caseTargetId: ls.caseTargetId,
    },
  })
}

/**
 * Restore Logs state when entering a workspace. Scratch is always reset to a fresh, neutral
 * editor (scratch case target). A case restores its saved editor if a checkpoint exists,
 * otherwise defaults to an empty editor targeting the active case. Results are always cleared.
 */
export function restoreWorkspaceLogs(workspaceId: string): void {
  const ls = useLogsStore.getState()
  ls.clearResults()

  if (isScratchWorkspace(workspaceId)) {
    ls.setKql('')
    ls.setCaseTargetId(SCRATCH_CASE_TARGET) // explicit scratch — save/pin require a case
    return
  }

  const saved = useWorkspaceStore.getState().getWorkspace(workspaceId).logsState
  ls.setKql(saved?.kql ?? '')
  ls.setCaseTargetId(saved?.caseTargetId ?? null) // null → LogsPage defaults to the active case
  if (saved?.selectedPlatform) ls.setSelectedPlatform(saved.selectedPlatform as SiemPlatform)
}

// ──────────────────────────────────────────────────────────────────────────
// Per-workspace Alerts state (v1.1.6)
//
// alertStore is a single global store holding filters / Load-More count / selection (UI
// state) alongside the alert data itself. We snapshot ONLY the UI state into the workspace
// checkpoint and restore it on entry — alert *data* (statuses, audit trail, links) is global
// SOC state and is never workspace-scoped. Scratch is reset to default filters (fresh).
// ──────────────────────────────────────────────────────────────────────────

/** Snapshot Alerts UI state (filters, count, selection) into a case workspace. Scratch skipped. */
export function snapshotWorkspaceAlerts(workspaceId: string): void {
  if (isScratchWorkspace(workspaceId)) return
  const as = useAlertStore.getState()
  useWorkspaceStore.getState().patchAlertsState(workspaceId, {
    statusFilter: as.filters.status,
    severityFilter: as.filters.severity,
    visibleCount: as.visibleCount,
    selectedAlertIds: [...as.selectedIds],
  })
}

/**
 * Restore Alerts UI state on workspace entry. Scratch always resets to default filters and
 * clears selection (fresh). A case restores its saved filters/count/selection, with every
 * selected id validated so a removed alert can never leave a dangling selection.
 */
export function restoreWorkspaceAlerts(workspaceId: string): void {
  const as = useAlertStore.getState()

  if (isScratchWorkspace(workspaceId)) {
    as.resetUi()
    return
  }

  const saved = useWorkspaceStore.getState().getWorkspace(workspaceId).alertsState
  as.hydrateUi({
    status: coerceStatusFilter(saved?.statusFilter),
    severity: coerceSeverityFilter(saved?.severityFilter),
    visibleCount: saved?.visibleCount,
    selectedIds: filterValidAlertIds(saved?.selectedAlertIds),
  })
}

// ──────────────────────────────────────────────────────────────────────────
// Unified workspace snapshot / restore (v1.1.6)
//
// Global-store-backed surfaces (Logs editor + Alerts UI state) are snapshotted/restored here
// so a workspace switch never leaks one case's global filters/editor into another. Finer,
// page-local selections (Alerts detail panel, Evidence node, Reports selection, Hunts
// template) are owned by their pages: each reads its checkpoint on mount (validated) and
// records on change, and skips persistence in Scratch — so Scratch stays ephemeral there too.
// ──────────────────────────────────────────────────────────────────────────

/** Snapshot the outgoing workspace's global-store UI state. No-op for Scratch. */
export function snapshotCurrentWorkspace(workspaceId: string): void {
  snapshotWorkspaceLogs(workspaceId)
  snapshotWorkspaceAlerts(workspaceId)
}

/** Restore the incoming workspace (Scratch → fresh defaults; a case → its checkpoint). */
export function restoreWorkspace(workspaceId: string): void {
  restoreWorkspaceLogs(workspaceId)
  restoreWorkspaceAlerts(workspaceId)
}

/*
 * v1.2 persistence boundaries
 * ---------------------------
 * Workspace memory currently lives in `workspaceStore` (localStorage) — the
 * `LocalWorkspaceMemoryProvider`. Boundaries a v1.2 phase should implement without changing
 * UI callers (they already go through workspaceStore + these helpers):
 *
 *   LocalWorkspaceMemoryProvider        — current: localStorage-backed workspaceStore.
 *   FutureDatabaseWorkspaceMemoryProvider — persist workspace checkpoints to a local DB / backend:
 *       getWorkspace(id): Promise<CaseWorkspaceState>
 *       patchWorkspace(id, partial): Promise<void>
 *   FutureSiemWorkspaceContextProvider  — resolve real, case-scoped SIEM context (entities,
 *       saved queries, evidence) for the active workspace instead of mock fixtures.
 */
