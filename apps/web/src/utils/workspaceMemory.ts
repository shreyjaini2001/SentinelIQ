import { SCRATCH_WORKSPACE_ID } from '../types/workspace'

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

/*
 * v1.2 persistence boundary
 * -------------------------
 * Workspace memory currently lives in `workspaceStore` (localStorage) — the
 * `LocalWorkspaceMemoryProvider`. When v1.2 introduces a local database / backend,
 * implement a `FutureDatabaseWorkspaceMemoryProvider` with the same surface:
 *
 *   interface WorkspaceMemoryProvider {
 *     getWorkspace(id: string): Promise<CaseWorkspaceState>
 *     patchWorkspace(id: string, partial: Partial<CaseWorkspaceState>): Promise<void>
 *   }
 *
 * Callers already go through workspaceStore's getWorkspace/patchWorkspace, so swapping the
 * provider should not require touching UI components.
 */
