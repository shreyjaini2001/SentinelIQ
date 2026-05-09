import { create } from 'zustand'
import type { QueryResult, SuggestionChip, BreadcrumbEntry, Mode, ActionData } from '../types'

interface SessionState {
  sessionId: string | null
  currentMode: Mode
  currentResult: QueryResult | null
  chips: SuggestionChip[]
  breadcrumbs: BreadcrumbEntry[]
  actionOutput: string | null
  actionData: ActionData | null
  actionProgress: string | null
  isLoading: boolean
  isActionRunning: boolean
  pendingQuery: string | null

  setSessionId: (id: string) => void
  setMode: (mode: Mode) => void
  setResult: (result: QueryResult | null) => void
  setChips: (chips: SuggestionChip[]) => void
  pushBreadcrumb: (entry: BreadcrumbEntry) => void
  setActionOutput: (output: string | null) => void
  setActionData: (data: ActionData | null) => void
  setActionProgress: (progress: string | null) => void
  setLoading: (loading: boolean) => void
  setActionRunning: (running: boolean) => void
  setPendingQuery: (text: string | null) => void
  clear: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  currentMode: 'query',
  currentResult: null,
  chips: [],
  breadcrumbs: [],
  actionOutput: null,
  actionData: null,
  actionProgress: null,
  isLoading: false,
  isActionRunning: false,
  pendingQuery: null,

  setSessionId: (id) => set({ sessionId: id }),
  setMode: (mode) => set({ currentMode: mode }),
  setResult: (result) => set({ currentResult: result }),
  setChips: (chips) => set({ chips }),
  pushBreadcrumb: (entry) =>
    set((state) => ({
      breadcrumbs: [entry, ...state.breadcrumbs].slice(0, 3),
    })),
  setActionOutput: (output) => set({ actionOutput: output }),
  setActionData: (data) => set({ actionData: data }),
  setActionProgress: (progress) => set({ actionProgress: progress }),
  setPendingQuery: (text) => set({ pendingQuery: text }),
  setLoading: (loading) => set({ isLoading: loading }),
  setActionRunning: (running) => set({ isActionRunning: running }),
  clear: () =>
    set({
      currentResult: null,
      chips: [],
      actionOutput: null,
      actionData: null,
      actionProgress: null,
      isLoading: false,
      isActionRunning: false,
    }),
}))
