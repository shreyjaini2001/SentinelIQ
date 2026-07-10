import type { AlertSeverity, AlertStatus } from '../../types/alerts'

export const SEV_CONFIG: Record<AlertSeverity, { color: string; dot: string }> = {
  critical: { color: 'text-red-400',    dot: 'bg-red-500' },
  high:     { color: 'text-orange-400', dot: 'bg-orange-500' },
  medium:   { color: 'text-amber-400',  dot: 'bg-amber-500' },
  low:      { color: 'text-gray-400',   dot: 'bg-gray-500' },
}

export const STATUS_STYLE: Record<AlertStatus, string> = {
  open:          'text-blue-300 bg-blue-500/10 border-blue-500/25',
  investigating: 'text-orange-300 bg-orange-500/10 border-orange-500/25',
  acknowledged:  'text-gray-400 bg-gray-500/10 border-gray-500/25',
  closed:        'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  suppressed:    'text-purple-300 bg-purple-500/10 border-purple-500/25',
  false_positive:'text-gray-400 bg-gray-700/10 border-gray-600/25',
  escalated:     'text-purple-400 bg-purple-500/10 border-purple-500/25',
}

export const STATUS_LABEL: Record<AlertStatus, string> = {
  open:          'Open',
  investigating: 'Investigating',
  acknowledged:  'Acknowledged',
  closed:        'Closed',
  suppressed:    'Suppressed',
  false_positive:'False Positive',
  escalated:     'Escalated',
}

/** Statuses that mean the alert is resolved / out of the Open queue. */
export const RESOLVED_STATUSES: AlertStatus[] = ['closed', 'false_positive', 'suppressed']
