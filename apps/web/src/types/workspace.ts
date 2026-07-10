/**
 * Case Workspace Memory model (v1.1.5).
 *
 * Each "workspace" is either a specific investigation (keyed by its id) or the neutral
 * Scratch workspace. We remember lightweight per-workspace UI state so switching cases
 * restores where the analyst left off — WITHOUT auto-saving any analyst work to a case.
 *
 * This is deliberately UI-state only (no investigation memory lives here — that stays in
 * investigationStore). It is structured so a v1.2 backend provider can persist it verbatim.
 */

export const WORKSPACE_SCHEMA_VERSION = 1

/** The neutral, no-active-case workspace. */
export const SCRATCH_WORKSPACE_ID = 'scratch'

export type WorkspacePageId =
  | 'overview' | 'alerts' | 'investigations' | 'investigation-workspace'
  | 'logs' | 'hunts' | 'rules' | 'reports' | 'assets' | 'data-sources' | 'settings'

export type InvestigationTab =
  | 'overview' | 'alerts' | 'entities' | 'evidence'
  | 'timeline' | 'blast-radius' | 'notes' | 'reports' | 'artifacts'

export interface CaseWorkspaceLogsState {
  kql?: string
  selectedPlatform?: string
  lastResultId?: string
  caseTargetId?: string | null
}

export interface CaseWorkspaceAlertsState {
  statusFilter?: string
  severityFilter?: string
  selectedAlertIds?: string[]
  lastTriageScope?: string
}

export interface CaseWorkspaceReportsState {
  selectedReportId?: string
  reportContextId?: string | null
}

export interface CaseWorkspaceState {
  /** 'scratch' or an investigation id. */
  workspaceId: string
  lastPage?: WorkspacePageId
  lastInvestigationTab?: InvestigationTab
  selectedEntityId?: string
  selectedAlertId?: string
  selectedArtifactId?: string
  selectedReportId?: string
  logsState?: CaseWorkspaceLogsState
  alertsState?: CaseWorkspaceAlertsState
  reportsState?: CaseWorkspaceReportsState
  updatedAt: string
}

/** A fresh, empty workspace record for a given id. */
export function emptyWorkspace(workspaceId: string): CaseWorkspaceState {
  return { workspaceId, updatedAt: new Date().toISOString() }
}
