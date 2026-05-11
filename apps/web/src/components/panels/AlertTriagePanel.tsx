import { useState } from 'react'
import { clsx } from 'clsx'
import type { TriageResult } from '../../types'

interface Props {
  result: TriageResult
}

function VerdictBadge({ tp }: { tp: number }) {
  if (tp >= 70) return <span className="px-2 py-0.5 rounded-md text-xs bg-red-500/20 text-red-400 border border-red-500/30 font-medium">Likely TP</span>
  if (tp < 30) return <span className="px-2 py-0.5 rounded-md text-xs bg-gray-700/60 text-gray-400 border border-gray-600/60 font-medium">Likely FP</span>
  return <span className="px-2 py-0.5 rounded-md text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium">Uncertain</span>
}

function ProbabilityBar({ tp }: { tp: number }) {
  const color = tp >= 70 ? 'bg-red-500' : tp < 30 ? 'bg-gray-600' : 'bg-amber-500'
  return (
    <div className="flex items-center gap-2 text-xs mt-1.5">
      <span className="text-gray-600 w-5 font-mono">TP</span>
      <div className="flex-1 h-2 rounded-full bg-gray-800/80 overflow-hidden">
        <div className={`h-full rounded-full ${color} opacity-70 transition-all`} style={{ width: `${tp}%` }} />
      </div>
      <span className="text-gray-400 w-8 text-right font-mono tabular-nums">{tp}%</span>
    </div>
  )
}

function ConfidenceDot({ confidence }: { confidence: string }) {
  const cls = confidence === 'high' ? 'bg-emerald-400' : confidence === 'medium' ? 'bg-amber-400' : 'bg-gray-500'
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${cls} shrink-0`} />
}

export function AlertTriagePanel({ result }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div data-testid="alert-triage-panel" className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/50 bg-gray-900/60">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full bg-red-500/70" />
          <span className="text-sm font-semibold text-white tracking-tight">Alert Triage</span>
        </div>
        <span className="text-xs text-gray-500 font-mono">{result.total_alerts} alerts · {result.duration_ms}ms</span>
      </div>

      {/* Summary stat row */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b border-gray-800/60">
        <div className="rounded-lg bg-red-500/8 border border-red-500/20 px-3 py-2.5 text-center">
          <div className="text-2xl font-bold text-red-400 font-mono">{result.likely_tp}</div>
          <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Likely TP</div>
        </div>
        <div className="rounded-lg bg-amber-500/8 border border-amber-500/20 px-3 py-2.5 text-center">
          <div className="text-2xl font-bold text-amber-400 font-mono">{result.uncertain}</div>
          <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Uncertain</div>
        </div>
        <div className="rounded-lg bg-gray-800/60 border border-gray-700/40 px-3 py-2.5 text-center">
          <div className="text-2xl font-bold text-gray-400 font-mono">{result.likely_fp}</div>
          <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Likely FP</div>
        </div>
      </div>

      {/* Verdict list */}
      <div className="divide-y divide-gray-800/50">
        {result.verdicts.map((verdict) => {
          const isTP = verdict.tp_probability >= 70
          const isFP = verdict.tp_probability < 30
          return (
            <div
              key={verdict.alert_id}
              className={clsx(
                'px-5 py-3.5 border-l-2 transition-colors hover:bg-gray-800/20',
                isTP ? 'border-l-red-500/60' : isFP ? 'border-l-gray-600/40' : 'border-l-amber-500/60',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <VerdictBadge tp={verdict.tp_probability} />
                    <code className="text-xs text-gray-600 font-mono">{verdict.alert_id.slice(0, 8)}</code>
                    <div className="flex items-center gap-1 ml-auto">
                      <ConfidenceDot confidence={verdict.confidence} />
                      <span className="text-xs text-gray-500">{verdict.confidence}</span>
                    </div>
                  </div>
                  <ProbabilityBar tp={verdict.tp_probability} />
                </div>
                <button
                  onClick={() => setExpanded(expanded === verdict.alert_id ? null : verdict.alert_id)}
                  className="text-xs text-gray-600 hover:text-blue-400 transition-colors shrink-0 mt-0.5"
                >
                  {expanded === verdict.alert_id ? 'Hide ▴' : 'Explain ▾'}
                </button>
              </div>

              {expanded === verdict.alert_id && (
                <div className="mt-3 pl-1 space-y-2.5">
                  <p className="text-xs text-gray-300 leading-relaxed">{verdict.reasoning}</p>
                  {verdict.influencing_fields.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-gray-600 uppercase tracking-wider">Key fields</span>
                      {verdict.influencing_fields.map((f) => (
                        <code key={f} className="text-xs px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono">{f}</code>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
