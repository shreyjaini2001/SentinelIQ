import type { HandoffBriefingResult, HandoffItem, SLAIndicator } from '../../types'
import type { AiOrchestrationResult } from '../../types/aiOrchestration'
import { ContextUsedPanel } from '../ai/ContextUsedPanel'
import { ExecutionTrace } from '../ai/ExecutionTrace'
import { SaveAiOutputActions } from '../ai/SaveAiOutputActions'

interface Props {
  result: HandoffBriefingResult
  orchestration?: AiOrchestrationResult
}

const URGENCY_CONFIG: Record<string, { badge: string; bar: string; dot: string; border: string }> = {
  critical: { badge: 'text-red-400 border-red-500/40 bg-red-500/10',    bar: 'bg-red-500',    dot: 'bg-red-500',    border: 'border-l-red-500/60'    },
  high:     { badge: 'text-orange-400 border-orange-500/40 bg-orange-500/10', bar: 'bg-orange-500', dot: 'bg-orange-500', border: 'border-l-orange-500/60' },
  medium:   { badge: 'text-amber-400 border-amber-500/40 bg-amber-500/10',  bar: 'bg-amber-500',  dot: 'bg-amber-400',  border: 'border-l-amber-500/40'  },
  low:      { badge: 'text-gray-400 border-gray-600/40 bg-gray-700/10',    bar: 'bg-gray-500',   dot: 'bg-gray-500',   border: 'border-l-gray-600/40'   },
}

const SLA_STATUS: Record<string, string> = {
  on_track: 'text-emerald-400',
  at_risk:  'text-amber-400',
  breached: 'text-red-400',
}

function UrgencyBadge({ urgency }: { urgency: HandoffItem['urgency'] }) {
  const cfg = URGENCY_CONFIG[urgency] ?? URGENCY_CONFIG.low
  return (
    <span className={`px-1.5 py-0.5 rounded-md text-[10px] border font-mono uppercase font-semibold shrink-0 ${cfg.badge}`}>
      {urgency}
    </span>
  )
}

function SLARow({ sla }: { sla: SLAIndicator }) {
  const pct = Math.min(100, Math.round((sla.current_minutes / sla.target_minutes) * 100))
  const barColor = sla.status === 'on_track' ? 'bg-emerald-500' : sla.status === 'at_risk' ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-40 shrink-0 truncate">{sla.category}</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-mono shrink-0 tabular-nums ${SLA_STATUS[sla.status]}`}>
        {sla.current_minutes}m / {sla.target_minutes}m
      </span>
    </div>
  )
}

export function HandoffBriefingPanel({ result, orchestration }: Props) {
  const criticalCount = result.open_items.filter(i => i.urgency === 'critical').length
  const highCount = result.open_items.filter(i => i.urgency === 'high').length

  const briefText = [
    result.key_context,
    ...result.recommended_next_actions,
  ].join('\n')

  return (
    <div data-testid="handoff-briefing-panel" className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/50 bg-gray-900/60">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full bg-cyan-500/70" />
          <span className="text-sm font-semibold text-white tracking-tight">Shift Handoff</span>
          <span className="px-2 py-0.5 rounded-md text-xs border text-cyan-400 border-cyan-500/40 bg-cyan-500/10 font-mono">
            {result.shift_window}
          </span>
        </div>
        <span className="text-xs text-gray-500 font-mono">{result.duration_ms}ms</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Summary stat row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg bg-red-950/20 border border-red-500/20 px-2.5 py-2 text-center">
            <div className="text-xl font-bold text-red-400 font-mono">{criticalCount}</div>
            <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Critical</div>
          </div>
          <div className="rounded-lg bg-orange-950/20 border border-orange-500/20 px-2.5 py-2 text-center">
            <div className="text-xl font-bold text-orange-400 font-mono">{highCount}</div>
            <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">High</div>
          </div>
          <div className="rounded-lg bg-gray-800/60 border border-gray-700/40 px-2.5 py-2 text-center">
            <div className="text-xl font-bold text-gray-300 font-mono">{result.open_items.length}</div>
            <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Open</div>
          </div>
          <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/20 px-2.5 py-2 text-center">
            <div className="text-xl font-bold text-emerald-400 font-mono">{result.closed_items.length}</div>
            <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Closed</div>
          </div>
        </div>

        {/* Key context */}
        <div className="rounded-lg bg-gray-800/40 border border-gray-700/40 p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-0.5 h-3 rounded-full bg-cyan-500/60" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Key Context</span>
          </div>
          <p className="text-sm text-gray-200 leading-relaxed">{result.key_context}</p>
        </div>

        {/* SLA indicators */}
        {result.sla_indicators.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-0.5 h-3 rounded-full bg-amber-500/60" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">SLA Status</span>
            </div>
            <div className="space-y-2.5">
              {result.sla_indicators.map((sla, i) => <SLARow key={i} sla={sla} />)}
            </div>
          </div>
        )}

        {/* Watch list */}
        {result.watch_list.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-0.5 h-3 rounded-full bg-amber-500/60" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Watch List</span>
            </div>
            <div className="space-y-1">
              {result.watch_list.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs rounded-lg bg-amber-950/10 border border-amber-500/10 px-3 py-2">
                  <span className="text-amber-500/60 shrink-0 mt-0.5">▸</span>
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open items */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-0.5 h-3 rounded-full bg-red-500/60" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Open Items</span>
            <span className="ml-auto text-[10px] font-mono text-gray-600">{result.open_items.length} total</span>
          </div>
          <div className="space-y-1.5">
            {result.open_items.slice(0, 8).map((item) => {
              const cfg = URGENCY_CONFIG[item.urgency] ?? URGENCY_CONFIG.low
              return (
                <div
                  key={item.item_id}
                  className={`flex items-start gap-2.5 rounded-lg bg-gray-800/25 border border-l-2 border-gray-700/30 px-3 py-2 ${cfg.border}`}
                >
                  <UrgencyBadge urgency={item.urgency} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-gray-200 truncate">{item.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 font-mono">{item.entity_scope}</div>
                    {item.notes && <div className="text-xs text-gray-600 mt-0.5 truncate">{item.notes}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recommended actions */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-0.5 h-3 rounded-full bg-blue-500/60" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Recommended Next Actions</span>
          </div>
          <ol className="space-y-1.5">
            {result.recommended_next_actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs rounded-lg bg-gray-800/20 border border-gray-700/20 px-3 py-2">
                <span className="text-blue-400 font-mono shrink-0 w-5 font-semibold">{i + 1}.</span>
                <span className="text-gray-300 leading-relaxed">{action}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* AI Orchestration context + save actions */}
        {orchestration && (
          <div className="space-y-2 pt-1 border-t border-gray-800/60">
            <ContextUsedPanel orchestration={orchestration} />
            <ExecutionTrace orchestration={orchestration} />
            <SaveAiOutputActions orchestration={orchestration} content={briefText} />
          </div>
        )}
      </div>
    </div>
  )
}
