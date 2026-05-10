import type { HandoffBriefingResult, HandoffItem, SLAIndicator } from '../../types'

interface Props {
  result: HandoffBriefingResult
}

const URGENCY_COLORS: Record<string, string> = {
  critical: 'text-red-400 border-red-500/40 bg-red-500/10',
  high: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
  medium: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  low: 'text-gray-400 border-gray-600/40 bg-gray-700/10',
}

const SLA_COLORS: Record<string, string> = {
  on_track: 'text-emerald-400',
  at_risk: 'text-amber-400',
  breached: 'text-red-400',
}

function UrgencyBadge({ urgency }: { urgency: HandoffItem['urgency'] }) {
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs border font-mono uppercase ${URGENCY_COLORS[urgency] ?? ''}`}>
      {urgency}
    </span>
  )
}

function SLARow({ sla }: { sla: SLAIndicator }) {
  const pct = Math.min(100, Math.round((sla.current_minutes / sla.target_minutes) * 100))
  const barColor = sla.status === 'on_track' ? 'bg-emerald-500' : sla.status === 'at_risk' ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-40 shrink-0">{sla.category}</span>
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-mono shrink-0 ${SLA_COLORS[sla.status]}`}>
        {sla.current_minutes}m / {sla.target_minutes}m
      </span>
    </div>
  )
}

export function HandoffBriefingPanel({ result }: Props) {
  const criticalCount = result.open_items.filter(i => i.urgency === 'critical').length
  const highCount = result.open_items.filter(i => i.urgency === 'high').length

  return (
    <div data-testid="handoff-briefing-panel" className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-gray-900/50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">Shift Handoff</span>
          <span className="px-2 py-0.5 rounded text-xs border text-cyan-400 border-cyan-500/30 bg-cyan-500/10">
            {result.shift_window}
          </span>
        </div>
        <span className="text-xs text-gray-500">{result.duration_ms}ms</span>
      </div>

      <div className="p-4 space-y-5">
        {/* Summary row */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-red-400 font-mono font-medium">{criticalCount}</span>
            <span className="text-gray-500">critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-orange-400 font-mono font-medium">{highCount}</span>
            <span className="text-gray-500">high</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-300 font-mono font-medium">{result.open_items.length}</span>
            <span className="text-gray-500">total open</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-mono font-medium">{result.closed_items.length}</span>
            <span className="text-gray-500">closed</span>
          </div>
        </div>

        {/* Key context */}
        <div className="rounded-lg bg-gray-800/50 border border-gray-700/40 p-3">
          <div className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Key Context</div>
          <p className="text-sm text-gray-200 leading-relaxed">{result.key_context}</p>
        </div>

        {/* SLA indicators */}
        {result.sla_indicators.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">SLA Status</div>
            <div className="space-y-2">
              {result.sla_indicators.map((sla, i) => <SLARow key={i} sla={sla} />)}
            </div>
          </div>
        )}

        {/* Watch list */}
        {result.watch_list.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Watch List</div>
            <div className="space-y-1">
              {result.watch_list.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="text-amber-400 shrink-0 mt-0.5">▸</span>
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open items */}
        <div>
          <div className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
            Open Items ({result.open_items.length})
          </div>
          <div className="space-y-1.5">
            {result.open_items.slice(0, 8).map((item) => (
              <div key={item.item_id} className="flex items-start gap-2.5 rounded-lg bg-gray-800/30 border border-gray-700/30 px-3 py-2">
                <UrgencyBadge urgency={item.urgency} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-gray-200 truncate">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.entity_scope}</div>
                  <div className="text-xs text-gray-600 mt-0.5 truncate">{item.notes}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended actions */}
        <div>
          <div className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Recommended Next Actions</div>
          <ol className="space-y-1.5">
            {result.recommended_next_actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span className="text-blue-400 font-mono shrink-0 w-4">{i + 1}.</span>
                <span className="text-gray-300">{action}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
