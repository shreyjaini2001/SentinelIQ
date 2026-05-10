import { create } from 'zustand'
import type { QueryResult, SuggestionChip, BreadcrumbEntry, Mode, ActionData } from '../types'

interface SessionState {
  sessionId: string | null
  currentMode: Mode
  currentResult: QueryResult | null
  chips: SuggestionChip[]
  breadcrumbs: BreadcrumbEntry[]
  submitHistory: string[]           // all recent submitted prompts (query + action), deduped
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
  pushSubmitHistory: (text: string) => void
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
  submitHistory: [],
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
    set((state) => {
      // Skip if the most recent breadcrumb is identical text
      if (state.breadcrumbs[0]?.original_text === entry.original_text) return state
      return { breadcrumbs: [entry, ...state.breadcrumbs].slice(0, 5) }
    }),
  pushSubmitHistory: (text) =>
    set((state) => {
      const trimmed = text.trim()
      if (!trimmed) return state
      // Move to front (dedup) and cap at 20
      const filtered = state.submitHistory.filter(h => h !== trimmed)
      return { submitHistory: [trimmed, ...filtered].slice(0, 20) }
    }),
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
