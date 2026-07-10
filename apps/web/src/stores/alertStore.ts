import { create } from 'zustand'
import { ALL_ALERTS } from '../data/mockSocData'
import type { MockAlert, AlertStatus, AlertSeverity, AlertStats, AlertTriageScopeType, AlertAuditEvent } from '../types/alerts'

const PAGE_SIZE = 25
const ACTOR = 'analyst_1'

function auditEvent(prev: AlertStatus, next: AlertStatus, reason: string): AlertAuditEvent {
  return { timestamp: new Date().toISOString(), previousStatus: prev, newStatus: next, actor: ACTOR, reason }
}

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
  getAlertById: (id: string) => MockAlert | undefined
  // Actions
  setStatusFilter: (status: AlertStatus | 'all') => void
  setSeverityFilter: (severity: AlertSeverity | 'all') => void
  loadMore: () => void
  toggleSelection: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  /** Change status for the given alerts, appending an audit event to each. */
  applyStatusChange: (ids: string[], newStatus: AlertStatus, reason?: string) => void
  /** Link alerts to an investigation (records an audit event; does not change status). */
  linkAlertsToCase: (ids: string[], caseId: string, caseTitle: string) => void
  /** Revert an alert to the previous status from its latest status-change audit event. */
  undoLastAction: (id: string) => void
  // Workspace-memory hydration (does NOT touch alert data — UI selection/filter state only)
  /** Restore per-workspace UI state (filters, Load-More count, selection) on workspace entry. */
  hydrateUi: (ui: { status?: AlertStatus | 'all'; severity?: AlertSeverity | 'all'; visibleCount?: number; selectedIds?: string[] }) => void
  /** Reset UI state to defaults (used when entering Scratch — keeps Scratch fresh). */
  resetUi: () => void
  // Persistence (v1.2.0) — hydrate the alert dataset (statuses, audit trail, links) from the
  // local store; reset to the deterministic mock seed.
  hydrateAlerts: (alerts: MockAlert[]) => void
  resetAlerts: () => void
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

  getAlertById: (id) => get().alerts.find((a) => a.id === id),

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

  applyStatusChange: (ids, newStatus, reason = 'manual') => {
    if (ids.length === 0) return
    const now = new Date().toISOString()
    const idSet = new Set(ids)
    set({
      alerts: get().alerts.map((a) => {
        if (!idSet.has(a.id) || a.status === newStatus) return a
        return {
          ...a,
          status: newStatus,
          updatedAt: now,
          auditTrail: [...(a.auditTrail ?? []), auditEvent(a.status, newStatus, reason)],
        }
      }),
    })
  },

  linkAlertsToCase: (ids, caseId, caseTitle) => {
    if (ids.length === 0) return
    const now = new Date().toISOString()
    const idSet = new Set(ids)
    set({
      alerts: get().alerts.map((a) => {
        if (!idSet.has(a.id) || a.linkedInvestigationId === caseId) return a
        return {
          ...a,
          linkedInvestigationId: caseId,
          updatedAt: now,
          auditTrail: [...(a.auditTrail ?? []), auditEvent(a.status, a.status, `Linked to case ${caseTitle}`)],
        }
      }),
    })
  },

  hydrateUi: (ui) => {
    const { filters } = get()
    set({
      filters: {
        status: ui.status ?? filters.status,
        severity: ui.severity ?? filters.severity,
      },
      visibleCount: Math.max(PAGE_SIZE, ui.visibleCount ?? PAGE_SIZE),
      selectedIds: new Set(ui.selectedIds ?? []),
    })
  },

  resetUi: () =>
    set({ filters: { status: 'all', severity: 'all' }, visibleCount: PAGE_SIZE, selectedIds: new Set() }),

  hydrateAlerts: (alerts) => {
    if (Array.isArray(alerts) && alerts.length > 0) set({ alerts })
  },

  resetAlerts: () =>
    set({
      alerts: ALL_ALERTS,
      filters: { status: 'all', severity: 'all' },
      visibleCount: PAGE_SIZE,
      selectedIds: new Set(),
    }),

  undoLastAction: (id) => {
    const alert = get().alerts.find((a) => a.id === id)
    const trail = alert?.auditTrail ?? []
    // Find the most recent event that actually changed status (skip link-only events).
    const last = [...trail].reverse().find((e) => e.previousStatus !== e.newStatus)
    if (!alert || !last) return
    const target = last.previousStatus
    const now = new Date().toISOString()
    set({
      alerts: get().alerts.map((a) =>
        a.id === id
          ? {
              ...a,
              status: target,
              updatedAt: now,
              auditTrail: [...(a.auditTrail ?? []), auditEvent(a.status, target, 'undo last action')],
            }
          : a,
      ),
    })
  },
}))
