import { clsx } from 'clsx'
import { useAlertStore } from '../stores/alertStore'
import { submitCommand } from '../utils/commandRunner'
import type { AlertStatus, AlertSeverity, MockAlert } from '../types/alerts'

const SEV_CONFIG: Record<AlertSeverity, { color: string; dot: string }> = {
  critical: { color: 'text-red-400',    dot: 'bg-red-500' },
  high:     { color: 'text-orange-400', dot: 'bg-orange-500' },
  medium:   { color: 'text-amber-400',  dot: 'bg-amber-500' },
  low:      { color: 'text-gray-400',   dot: 'bg-gray-500' },
}

const STATUS_STYLE: Record<AlertStatus, string> = {
  open:          'text-blue-300 bg-blue-500/10 border-blue-500/25',
  investigating: 'text-orange-300 bg-orange-500/10 border-orange-500/25',
  acknowledged:  'text-gray-400 bg-gray-500/10 border-gray-500/25',
  closed:        'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  suppressed:    'text-gray-500 bg-gray-700/10 border-gray-600/25',
  false_positive:'text-gray-500 bg-gray-700/10 border-gray-600/25',
  escalated:     'text-purple-400 bg-purple-500/10 border-purple-500/25',
}

const STATUS_LABEL: Record<AlertStatus, string> = {
  open:          'Open',
  investigating: 'Investigating',
  acknowledged:  'Acknowledged',
  closed:        'Closed',
  suppressed:    'Suppressed',
  false_positive:'False Positive',
  escalated:     'Escalated',
}

type StatusTab = AlertStatus | 'all'

const STATUS_TABS: Array<{ id: StatusTab; label: string }> = [
  { id: 'all',          label: 'All' },
  { id: 'open',         label: 'Open' },
  { id: 'investigating',label: 'Investigating' },
  { id: 'acknowledged', label: 'Acknowledged' },
  { id: 'closed',       label: 'Closed' },
  { id: 'false_positive',label: 'False Positive' },
]

function AlertRow({
  alert,
  selected,
  onToggle,
}: {
  alert: MockAlert
  selected: boolean
  onToggle: () => void
}) {
  const sev = SEV_CONFIG[alert.severity]
  const statusCls = STATUS_STYLE[alert.status]
  const timestamp = alert.createdAt.replace('T', ' ').slice(5, 16)

  return (
    <tr
      className={clsx(
        'border-b border-gray-800/30 hover:bg-gray-800/25 transition-colors',
        selected && 'bg-blue-500/5',
      )}
    >
      {/* Checkbox */}
      <td className="px-3 py-2.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="rounded border-gray-600 bg-gray-800 text-blue-500 cursor-pointer"
        />
      </td>
      {/* Time */}
      <td className="px-3 py-2.5 text-xs text-gray-500 font-mono whitespace-nowrap">{timestamp}</td>
      {/* Alert name */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className={clsx('w-1.5 h-1.5 rounded-full shrink-0', sev.dot)} />
          <span className="text-xs text-gray-200 truncate max-w-[240px]">{alert.name}</span>
        </div>
      </td>
      {/* Severity */}
      <td className="px-3 py-2.5">
        <span className={clsx('text-[10px] font-semibold uppercase tracking-wide', sev.color)}>
          {alert.severity}
        </span>
      </td>
      {/* Entity */}
      <td className="px-3 py-2.5 text-xs text-gray-400 font-mono max-w-[160px] truncate">{alert.entity}</td>
      {/* Detection rule */}
      <td className="px-3 py-2.5 text-[10px] text-gray-600 font-mono truncate max-w-[160px] hidden lg:table-cell">
        {alert.detectionRule}
      </td>
      {/* Status */}
      <td className="px-3 py-2.5">
        <span className={clsx('text-[10px] px-1.5 py-0.5 rounded border', statusCls)}>
          {STATUS_LABEL[alert.status]}
        </span>
      </td>
    </tr>
  )
}

export function AlertsPage() {
  const {
    filters,
    visibleAlerts,
    filteredAlerts,
    stats,
    selectedIds,
    hasMore,
    setStatusFilter,
    setSeverityFilter,
    toggleSelection,
    selectAll,
    clearSelection,
    loadMore,
  } = useAlertStore()

  const s = stats()
  const visible = visibleAlerts()
  const filtered = filteredAlerts()
  const selCount = selectedIds.size

  function handleTriageScope(scope: string) {
    const prompt = scope === 'selected'
      ? 'Triage selected alerts'
      : scope === 'visible'
      ? 'Triage visible open alerts'
      : 'Triage my open alerts'
    void submitCommand(prompt, { source: 'overview_chip' })
  }

  return (
    <div className="space-y-4">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Alerts</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {s.total} total · {s.critical} critical · {s.open} open
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selCount > 0 && (
            <button
              onClick={() => handleTriageScope('selected')}
              className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-medium hover:bg-blue-600/30 transition-colors"
            >
              Triage {selCount} selected →
            </button>
          )}
          <button
            onClick={() => handleTriageScope('visible')}
            className="px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-medium hover:bg-purple-600/30 transition-colors"
          >
            Triage visible →
          </button>
          <button
            onClick={() => handleTriageScope('all')}
            className="px-3 py-1.5 rounded-lg bg-red-600/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-600/20 transition-colors"
          >
            Triage all open →
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 border-b border-gray-800/60 pb-0">
        {STATUS_TABS.map((tab) => {
          const active = filters.status === tab.id
          const count = tab.id === 'all' ? s.total : s[tab.id as AlertStatus] ?? 0
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={clsx(
                'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
                active
                  ? 'border-blue-500 text-blue-300'
                  : 'border-transparent text-gray-500 hover:text-gray-300',
              )}
            >
              {tab.label}
              {count > 0 && (
                <span className={clsx(
                  'ml-1.5 text-[10px] font-mono px-1 py-0.5 rounded',
                  active ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-800/60 text-gray-600',
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Severity filter pills + selection controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => {
          const active = sev === 'all' ? filters.severity === 'all' : filters.severity === sev
          return (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev === 'all' ? 'all' : sev)}
              className={clsx(
                'text-xs px-2.5 py-1 rounded-lg border transition-colors capitalize',
                active
                  ? 'bg-blue-600/20 border-blue-500/30 text-blue-300'
                  : 'border-gray-700/50 text-gray-500 hover:text-gray-300 hover:border-gray-600',
              )}
            >
              {sev === 'all' ? 'All Severity' : sev}
            </button>
          )
        })}
        <span className="ml-auto text-[10px] text-gray-600">
          {filtered.length} matching
        </span>
        {selCount > 0 ? (
          <button
            onClick={clearSelection}
            className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
          >
            Clear {selCount} selected ×
          </button>
        ) : (
          <button
            onClick={selectAll}
            className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
          >
            Select visible
          </button>
        )}
      </div>

      {/* Alert table */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800/80">
              <th className="px-3 py-2.5 w-8">
                <input
                  type="checkbox"
                  checked={selCount > 0 && selCount === visible.length}
                  onChange={selCount > 0 ? clearSelection : selectAll}
                  className="rounded border-gray-600 bg-gray-800 text-blue-500 cursor-pointer"
                />
              </th>
              {['Time', 'Alert Name', 'Severity', 'Entity', 'Detection Rule', 'Status'].map((col) => (
                <th
                  key={col}
                  className={clsx(
                    'text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-3 py-2.5',
                    col === 'Detection Rule' && 'hidden lg:table-cell',
                  )}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                selected={selectedIds.has(alert.id)}
                onToggle={() => toggleSelection(alert.id)}
              />
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-gray-600">
                  No alerts match the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-800/60 flex items-center justify-between">
          <span className="text-[10px] text-gray-600">
            Showing {visible.length} of {filtered.length} · {s.total} total · Mock data
          </span>
          {hasMore() && (
            <button
              onClick={loadMore}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Load more ↓
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
