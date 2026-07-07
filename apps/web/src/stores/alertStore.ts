import { create } from 'zustand'
import { ALL_ALERTS } from '../data/mockSocData'
import type { MockAlert, AlertStatus, AlertSeverity, AlertStats, AlertTriageScopeType } from '../types/alerts'

const PAGE_SIZE = 25

interface AlertFilters {
  status: AlertStatus | 'all'
  severity: AlertSeverity | 'all'
}

interface AlertStoreState {
  // Raw data (mutated by status changes)
  alerts: MockAlert[]
  // UI state
  filters: AlertFilters
  visibleCount: number
  selectedIds: Set<string>
  // Derived (computed on access)
  filteredAlerts: () => MockAlert[]
  visibleAlerts: () => MockAlert[]
  stats: () => AlertStats
  openCount: () => number
  hasMore: () => boolean
  getTriageAlerts: (scope: AlertTriageScopeType) => MockAlert[]
  // Actions
  setStatusFilter: (status: AlertStatus | 'all') => void
  setSeverityFilter: (severity: AlertSeverity | 'all') => void
  loadMore: () => void
  toggleSelection: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  applyStatusChange: (ids: string[], newStatus: AlertStatus) => void
}

export const useAlertStore = create<AlertStoreState>()((set, get) => ({
  alerts: ALL_ALERTS,
  filters: { status: 'all', severity: 'all' },
  visibleCount: PAGE_SIZE,
  selectedIds: new Set(),

  filteredAlerts: () => {
    const { alerts, filters } = get()
    return alerts.filter((a) => {
      if (filters.status !== 'all' && a.status !== filters.status) return false
      if (filters.severity !== 'all' && a.severity !== filters.severity) return false
      return true
    })
  },

  visibleAlerts: () => {
    const { visibleCount } = get()
    return get().filteredAlerts().slice(0, visibleCount)
  },

  stats: (): AlertStats => {
    const { alerts } = get()
    const s: AlertStats = {
      total: alerts.length,
      open: 0, investigating: 0, acknowledged: 0, closed: 0,
      suppressed: 0, false_positive: 0, escalated: 0,
      critical: 0, high: 0, medium: 0, low: 0,
    }
    for (const a of alerts) {
      s[a.status]++
      s[a.severity]++
    }
    return s
  },

  openCount: () => get().alerts.filter((a) => a.status === 'open').length,

  hasMore: () => {
    const { visibleCount } = get()
    return get().filteredAlerts().length > visibleCount
  },

  getTriageAlerts: (scope: AlertTriageScopeType): MockAlert[] => {
    const { alerts, selectedIds } = get()
    switch (scope) {
      case 'selected':
        return alerts.filter((a) => selectedIds.has(a.id))
      case 'visible_open':
        return get().visibleAlerts().filter((a) => a.status === 'open')
      case 'all_open':
      default:
        return alerts.filter((a) => a.status === 'open')
    }
  },

  setStatusFilter: (status) =>
    set({ filters: { ...get().filters, status }, visibleCount: PAGE_SIZE }),

  setSeverityFilter: (severity) =>
    set({ filters: { ...get().filters, severity }, visibleCount: PAGE_SIZE }),

  loadMore: () =>
    set({ visibleCount: get().visibleCount + PAGE_SIZE }),

  toggleSelection: (id) => {
    const next = new Set(get().selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    set({ selectedIds: next })
  },

  selectAll: () => {
    const ids = new Set(get().visibleAlerts().map((a) => a.id))
    set({ selectedIds: ids })
  },

  clearSelection: () => set({ selectedIds: new Set() }),

  applyStatusChange: (ids, newStatus) => {
    const now = new Date().toISOString()
    set({
      alerts: get().alerts.map((a) =>
        ids.includes(a.id) ? { ...a, status: newStatus, updatedAt: now } : a,
      ),
      selectedIds: new Set(),
    })
  },
}))
