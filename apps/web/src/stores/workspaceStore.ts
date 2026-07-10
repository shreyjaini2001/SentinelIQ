import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  WORKSPACE_SCHEMA_VERSION,
  emptyWorkspace,
  type CaseWorkspaceState,
  type WorkspacePageId,
  type InvestigationTab,
} from '../types/workspace'

/**
 * Per-workspace UI memory (Scratch + each investigation). Persisted to localStorage under a
 * versioned key so stale/older shapes never crash the app — a bad blob is dropped and we
 * start clean. This is UI continuity only; it never holds investigation memory or auto-saves
 * analyst work to a case.
 *
 * v1.2 boundary: this is the `LocalWorkspaceMemoryProvider`. A future
 * `FutureDatabaseWorkspaceMemoryProvider` can implement the same read/patch surface against
 * a backend without changing callers.
 */
interface WorkspaceStoreState {
  workspaces: Record<string, CaseWorkspaceState>
  /** Non-reactive read — returns an existing record or a fresh empty one (not persisted until patched). */
  getWorkspace: (id: string) => CaseWorkspaceState
  patchWorkspace: (id: string, partial: Partial<CaseWorkspaceState>) => void
  setLastPage: (id: string, page: WorkspacePageId) => void
  setInvestigationTab: (id: string, tab: InvestigationTab) => void
}

export const useWorkspaceStore = create<WorkspaceStoreState>()(
  persist(
    (set, get) => ({
      workspaces: {},

      getWorkspace: (id) => get().workspaces[id] ?? emptyWorkspace(id),

      patchWorkspace: (id, partial) =>
        set((s) => {
          const prev = s.workspaces[id] ?? emptyWorkspace(id)
          return {
            workspaces: {
              ...s.workspaces,
              [id]: { ...prev, ...partial, workspaceId: id, updatedAt: new Date().toISOString() },
            },
          }
        }),

      setLastPage: (id, page) => get().patchWorkspace(id, { lastPage: page }),

      setInvestigationTab: (id, tab) => get().patchWorkspace(id, { lastInvestigationTab: tab }),
    }),
    {
      name: 'sentinel-iq-workspace-v1',
      version: WORKSPACE_SCHEMA_VERSION,
      partialize: (s) => ({ workspaces: s.workspaces }),
      // Any older/unknown persisted shape is discarded rather than trusted — never crash.
      migrate: (persisted, version) => {
        if (version !== WORKSPACE_SCHEMA_VERSION || !persisted || typeof persisted !== 'object') {
          return { workspaces: {} } as { workspaces: Record<string, CaseWorkspaceState> }
        }
        const p = persisted as { workspaces?: unknown }
        return { workspaces: (p.workspaces && typeof p.workspaces === 'object' ? p.workspaces : {}) as Record<string, CaseWorkspaceState> }
      },
    },
  ),
)
