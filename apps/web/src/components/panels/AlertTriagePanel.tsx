import { useState } from 'react'
import { clsx } from 'clsx'
import type { TriageResult } from '../../types'

interface Props {
  result: TriageResult
}

function VerdictBadge({ tp }: { tp: number }) {
  if (tp >= 70) return <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30">Likely TP</span>
  if (tp < 30) return <span className="px-2 py-0.5 rounded text-xs bg-gray-500/20 text-gray-400 border border-gray-600">Likely FP</span>
  return <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">Uncertain</span>
}

function ProbabilityBar({ tp }: { tp: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500 w-6">TP</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
        <div className="h-full bg-red-500/70 rounded-full" style={{ width: `${tp}%` }} />
      </div>
      <span className="text-gray-400 w-8">{tp}%</span>
    </div>
  )
}

export function AlertTriagePanel({ result }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Summary header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-gray-900/50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">Alert Triage</span>
          <span className="text-xs text-gray-500">{result.total_alerts} alerts · {result.duration_ms}ms</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-red-400">{result.likely_tp} likely TP</span>
          <span className="text-gray-500">{result.uncertain} uncertain</span>
          <span className="text-gray-400">{result.likely_fp} likely FP</span>
        </div>
      </div>

      {/* Verdict list */}
      <div className="divide-y divide-gray-800">
        {result.verdicts.map((verdict) => (
          <div key={verdict.alert_id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <VerdictBadge tp={verdict.tp_probability} />
                  <code className="text-xs text-gray-500 font-mono">{verdict.alert_id.slice(0, 8)}...</code>
                  <span className={clsx(
                    'text-xs',
                    verdict.confidence === 'high' ? 'text-green-400' :
                    verdict.confidence === 'medium' ? 'text-amber-400' : 'text-gray-500'
                  )}>{verdict.confidence} conf.</span>
                </div>
                <ProbabilityBar tp={verdict.tp_probability} />
              </div>
              <button
                onClick={() => setExpanded(expanded === verdict.alert_id ? null : verdict.alert_id)}
                className="text-xs text-gray-500 hover:text-gray-300 shrink-0"
              >
                {expanded === verdict.alert_id ? 'Less' : 'Explain'}
              </button>
            </div>

            {expanded === verdict.alert_id && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-300 leading-relaxed">{verdict.reasoning}</p>
                {verdict.influencing_fields.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-gray-500">Key fields:</span>
                    {verdict.influencing_fields.map((f) => (
                      <code key={f} className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-blue-300">{f}</code>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
