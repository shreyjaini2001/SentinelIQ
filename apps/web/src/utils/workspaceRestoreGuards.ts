import { useAlertStore } from '../stores/alertStore'
import { useInvestigationStore } from '../stores/investigationStore'
import type { AlertStatus, AlertSeverity } from '../types/alerts'

/**
 * Restore-validation guards (v1.1.6)
 * ----------------------------------
 * Workspace memory stores lightweight IDs and filter values captured earlier. Before a
 * page re-applies any of them, it validates them here so a stale/removed selection can
 * never crash a page or show a dangling detail panel — an invalid value is simply ignored
 * and the page falls back to its default view.
 *
 * These are non-reactive reads (`getState()`), safe to call from `useState` initializers
 * and effects without creating Zustand subscription loops.
 */

const ALERT_STATUSES: AlertStatus[] = [
  'open', 'investigating', 'acknowledged', 'closed', 'suppressed', 'false_positive', 'escalated',
]
const ALERT_SEVERITIES: AlertSeverity[] = ['critical', 'high', 'medium', 'low']

/** True only if the alert id still exists in the alert store. */
export function isValidAlertId(id?: string | null): id is string {
  if (!id) return false
  return !!useAlertStore.getState().getAlertById(id)
}

/** True only if the investigation id still exists. */
export function isValidInvestigationId(id?: string | null): id is string {
  if (!id) return false
  return useInvestigationStore.getState().investigations.some((i) => i.id === id)
}

/** Keep only alert ids that still exist. */
export function filterValidAlertIds(ids?: string[] | null): string[] {
  if (!ids?.length) return []
  const store = useAlertStore.getState()
  return ids.filter((id) => !!store.getAlertById(id))
}

/** Coerce an unknown persisted value to a valid status filter, defaulting to 'all'. */
export function coerceStatusFilter(v: unknown): AlertStatus | 'all' {
  return v === 'all' || (typeof v === 'string' && ALERT_STATUSES.includes(v as AlertStatus))
    ? (v as AlertStatus | 'all')
    : 'all'
}

/** Coerce an unknown persisted value to a valid severity filter, defaulting to 'all'. */
export function coerceSeverityFilter(v: unknown): AlertSeverity | 'all' {
  return v === 'all' || (typeof v === 'string' && ALERT_SEVERITIES.includes(v as AlertSeverity))
    ? (v as AlertSeverity | 'all')
    : 'all'
}
