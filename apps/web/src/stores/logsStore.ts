import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MockQueryResult } from '../utils/mockResults'
import type { SiemPlatform } from '../types/queryPlan'

/**
 * Explicit "scratch only" sentinel for `caseTargetId`.
 *
 * `caseTargetId` has three states:
 *   - `null`      → unset; the Logs page defaults to the active investigation.
 *   - `<inv id>`  → save/pin/note target that specific case.
 *   - SCRATCH     → the analyst explicitly chose no case; results stay scratch and
 *                   are never coerced back to the active investigation.
 * Using a distinct sentinel (not `null`/`''`) is what makes "None (scratch only)" stick.
 */
export const SCRATCH_CASE_TARGET = 'scratch'

interface LogsState {
  kql: string
  results: MockQueryResult | null
  recentQueries: string[]
  savedQueries: string[]
  showSummary: boolean
  pinned: boolean
  pinnedFindingText: string | null
  pinnedInvId: string | null
  caseTargetId: string | null
  /** Currently selected SIEM platform — affects query rendering across the app */
  selectedPlatform: SiemPlatform

  setKql: (kql: string) => void
  setResults: (r: MockQueryResult | null) => void
  addRecentQuery: (kql: string) => void
  addSavedQuery: (kql: string) => void
  removeSavedQuery: (kql: string) => void
  setShowSummary: (v: boolean) => void
  setPinned: (v: boolean, text?: string, invId?: string) => void
  setCaseTargetId: (id: string | null) => void
  setSelectedPlatform: (p: SiemPlatform) => void
  clearResults: () => void
  // Persistence (v1.2.0) — hydrate saved/recent queries + platform from the local store;
  // reset those to defaults. Transient editor state (kql, results) is never persisted.
  hydrateLogsMemory: (m: { savedQueries?: string[]; recentQueries?: string[]; selectedPlatform?: SiemPlatform }) => void
  resetLogsMemory: () => void
}

export const useLogsStore = create<LogsState>()(
  persist(
    (set) => ({
      kql: '',
      results: null,
      recentQueries: [],
      savedQueries: [],
      showSummary: false,
      pinned: false,
      pinnedFindingText: null,
      pinnedInvId: null,
      caseTargetId: null,
      selectedPlatform: 'sentinel',

      setKql: (kql) => set({ kql }),
      setResults: (results) => set({ results }),

      addRecentQuery: (kql) =>
        set((s) => ({
          recentQueries: [kql, ...s.recentQueries.filter((q) => q !== kql)].slice(0, 20),
        })),

      addSavedQuery: (kql) =>
        set((s) => ({
          savedQueries: [kql, ...s.savedQueries.filter((q) => q !== kql)].slice(0, 20),
        })),

      removeSavedQuery: (kql) =>
        set((s) => ({ savedQueries: s.savedQueries.filter((q) => q !== kql) })),

      setShowSummary: (v) => set({ showSummary: v }),

      setPinned: (v, text, invId) =>
        set({
          pinned: v,
          pinnedFindingText: v ? (text ?? null) : null,
          pinnedInvId: v ? (invId ?? null) : null,
        }),

      setCaseTargetId: (id) => set({ caseTargetId: id }),

      setSelectedPlatform: (selectedPlatform) => set({ selectedPlatform }),

      clearResults: () =>
        set({ results: null, pinned: false, pinnedFindingText: null, pinnedInvId: null, showSummary: false }),

      hydrateLogsMemory: (m) =>
        set((s) => ({
          savedQueries: Array.isArray(m.savedQueries) ? m.savedQueries.slice(0, 20) : s.savedQueries,
          recentQueries: Array.isArray(m.recentQueries) ? m.recentQueries.slice(0, 20) : s.recentQueries,
          selectedPlatform: m.selectedPlatform ?? s.selectedPlatform,
        })),

      resetLogsMemory: () =>
        set({ savedQueries: [], recentQueries: [], selectedPlatform: 'sentinel', kql: '', results: null }),
    }),
    {
      name: 'sentinel-iq-logs-v1',
      partialize: (s) => ({
        kql: s.kql,
        recentQueries: s.recentQueries,
        savedQueries: s.savedQueries,
        caseTargetId: s.caseTargetId,
        selectedPlatform: s.selectedPlatform,
      }),
    },
  ),
)
