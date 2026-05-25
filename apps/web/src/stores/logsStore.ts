import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MockQueryResult } from '../utils/mockResults'

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

  setKql: (kql: string) => void
  setResults: (r: MockQueryResult | null) => void
  addRecentQuery: (kql: string) => void
  addSavedQuery: (kql: string) => void
  removeSavedQuery: (kql: string) => void
  setShowSummary: (v: boolean) => void
  setPinned: (v: boolean, text?: string, invId?: string) => void
  setCaseTargetId: (id: string | null) => void
  clearResults: () => void
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

      clearResults: () =>
        set({ results: null, pinned: false, pinnedFindingText: null, pinnedInvId: null, showSummary: false }),
    }),
    {
      name: 'sentinel-iq-logs-v1',
      partialize: (s) => ({
        kql: s.kql,
        recentQueries: s.recentQueries,
        savedQueries: s.savedQueries,
        caseTargetId: s.caseTargetId,
      }),
    },
  ),
)
