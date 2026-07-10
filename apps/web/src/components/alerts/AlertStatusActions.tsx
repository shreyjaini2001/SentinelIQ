import { clsx } from 'clsx'
import type { AlertStatus } from '../../types/alerts'

interface ActionDef {
  status: AlertStatus
  label: string
  active: string   // classes when this is the chosen decision
  idle: string     // classes otherwise
}

// Staging mode: the analyst picks a target status for a deferred (batch) decision.
const STAGE_ACTIONS: ActionDef[] = [
  {
    status: 'investigating',
    label: 'Mark Investigating',
    active: 'text-orange-300 bg-orange-500/20 border-orange-500/50',
    idle:   'text-orange-400 border-orange-500/30 hover:bg-orange-500/10',
  },
  {
    status: 'false_positive',
    label: 'Mark False Positive',
    active: 'text-gray-200 bg-gray-600/40 border-gray-500/50',
    idle:   'text-gray-500 border-gray-600/40 hover:bg-gray-700/40',
  },
  {
    status: 'closed',
    label: 'Close',
    active: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/50',
    idle:   'text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10',
  },
  {
    status: 'suppressed',
    label: 'Suppress',
    active: 'text-purple-300 bg-purple-500/20 border-purple-500/50',
    idle:   'text-purple-400 border-purple-500/30 hover:bg-purple-500/10',
  },
]

// Button colour by *target* status (immediate mode).
const BTN: Record<AlertStatus, string> = {
  open:          'text-blue-400 border-blue-500/30 hover:bg-blue-500/10',
  investigating: 'text-orange-400 border-orange-500/30 hover:bg-orange-500/10',
  acknowledged:  'text-gray-300 border-gray-600/40 hover:bg-gray-700/40',
  closed:        'text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10',
  false_positive:'text-gray-400 border-gray-600/40 hover:bg-gray-700/40',
  suppressed:    'text-purple-400 border-purple-500/30 hover:bg-purple-500/10',
  escalated:     'text-purple-400 border-purple-500/30 hover:bg-purple-500/10',
}

// Immediate mode: which lifecycle transitions make sense from the current status.
const IMMEDIATE_ACTIONS: Record<AlertStatus, { status: AlertStatus; label: string }[]> = {
  open: [
    { status: 'investigating',  label: 'Mark Investigating' },
    { status: 'closed',         label: 'Close' },
    { status: 'false_positive', label: 'Mark False Positive' },
    { status: 'suppressed',     label: 'Suppress' },
  ],
  investigating: [
    { status: 'acknowledged',   label: 'Acknowledge' },
    { status: 'closed',         label: 'Close' },
    { status: 'false_positive', label: 'Mark False Positive' },
    { status: 'suppressed',     label: 'Suppress' },
    { status: 'open',           label: 'Reopen' },
  ],
  acknowledged: [
    { status: 'investigating',  label: 'Mark Investigating' },
    { status: 'closed',         label: 'Close' },
    { status: 'false_positive', label: 'Mark False Positive' },
    { status: 'open',           label: 'Reopen' },
  ],
  closed: [
    { status: 'open',           label: 'Reopen' },
    { status: 'investigating',  label: 'Mark Investigating' },
  ],
  false_positive: [
    { status: 'open',           label: 'Reopen' },
    { status: 'suppressed',     label: 'Suppress' },
  ],
  suppressed: [
    { status: 'open',           label: 'Unsuppress / Reopen' },
  ],
  escalated: [
    { status: 'investigating',  label: 'Mark Investigating' },
    { status: 'closed',         label: 'Close' },
    { status: 'open',           label: 'Reopen' },
  ],
}

interface Props {
  currentStatus: AlertStatus
  onSet: (status: AlertStatus) => void
  /**
   * 'stage'    — deferred decision picker (batch workspace): shows all targets + Keep Open,
   *              highlights `selected`.
   * 'immediate'— state-aware lifecycle buttons (detail panel): only sensible transitions.
   */
  variant?: 'stage' | 'immediate'
  selected?: AlertStatus
  showKeepOpen?: boolean
}

/**
 * Manual alert lifecycle actions. Every action is an explicit analyst decision — nothing
 * auto-closes or auto-suppresses. `stage` variant powers the batch triage decisions;
 * `immediate` variant powers the single-alert detail panel with status-aware transitions.
 */
export function AlertStatusActions({ currentStatus, onSet, variant = 'stage', selected, showKeepOpen }: Props) {
  if (variant === 'immediate') {
    const actions = IMMEDIATE_ACTIONS[currentStatus] ?? IMMEDIATE_ACTIONS.open
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => onSet(a.status)}
            className={clsx('text-[10px] px-2 py-1 rounded border transition-colors', BTN[a.status])}
          >
            {a.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {showKeepOpen && (
        <button
          onClick={() => onSet('open')}
          className={clsx(
            'text-[10px] px-2 py-1 rounded border transition-colors',
            selected === 'open'
              ? 'text-blue-300 bg-blue-500/20 border-blue-500/50'
              : 'text-blue-400 border-blue-500/30 hover:bg-blue-500/10',
          )}
        >
          Keep Open
        </button>
      )}
      {STAGE_ACTIONS.map((a) => (
        <button
          key={a.status}
          onClick={() => onSet(a.status)}
          className={clsx(
            'text-[10px] px-2 py-1 rounded border transition-colors',
            selected === a.status ? a.active : a.idle,
          )}
        >
          {a.label}
          {currentStatus === a.status && selected === undefined && (
            <span className="ml-1 text-emerald-400">✓</span>
          )}
        </button>
      ))}
    </div>
  )
}
