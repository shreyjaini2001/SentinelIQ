import { useState } from 'react'
import type { RuleSuggestionResult } from '../../types'

interface Props {
  result: RuleSuggestionResult
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  low: 'text-gray-400 bg-gray-700/30 border-gray-600',
}

function SeverityBadge({ severity }: { severity: string }) {
  const cls = SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.low
  return (
    <span className={`px-2 py-0.5 rounded text-xs border uppercase font-medium ${cls}`}>
      {severity}
    </span>
  )
}

function FpRateBar({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100)
  const color = pct <= 5 ? 'bg-green-500' : pct <= 15 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500 w-16 shrink-0">Est. FP rate</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-gray-400 w-8 text-right">{pct}%</span>
    </div>
  )
}

export function RuleSuggestionPanel({ result }: Props) {
  const [showKql, setShowKql] = useState(true)

  return (
    <div className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-gray-900/50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">Rule Suggestion</span>
          <SeverityBadge severity={result.severity} />
        </div>
        <span className="text-xs text-gray-500">{result.duration_ms}ms</span>
      </div>

      <div className="p-4 space-y-5">
        {/* Rule meta */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-1">{result.rule_name}</h3>
          <p className="text-xs text-gray-400 mb-3">{result.rule_description}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {result.technique_ids.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded bg-blue-600/20 border border-blue-500/30 text-blue-300 font-mono">
                {t}
              </span>
            ))}
            {result.mitre_tactics.map((tac) => (
              <span key={tac} className="px-2 py-0.5 rounded bg-gray-700/60 border border-gray-600 text-gray-400">
                {tac}
              </span>
            ))}
          </div>
        </div>

        {/* FP rate */}
        <FpRateBar rate={result.estimated_fp_rate} />

        {/* KQL */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">KQL Rule</h4>
            <button
              onClick={() => setShowKql(!showKql)}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              {showKql ? 'Hide' : 'Show'}
            </button>
          </div>
          {showKql && (
            <div className="rounded-lg bg-gray-950 border border-gray-800 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800 bg-gray-900">
                <span className="text-[10px] text-gray-500 font-mono">KQL</span>
                <button disabled className="text-[10px] text-gray-600 cursor-not-allowed">Copy</button>
              </div>
              <pre className="px-3 py-3 text-xs text-gray-200 font-mono overflow-x-auto leading-relaxed whitespace-pre">
                {result.kql}
              </pre>
            </div>
          )}
        </div>

        {/* Backtest */}
        <div>
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Backtest ({result.backtest.period})
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Alerts', value: result.backtest.alert_count, color: 'text-gray-200' },
              { label: 'Est. TP', value: result.backtest.tp_count, color: 'text-green-400' },
              { label: 'Est. FP', value: result.backtest.fp_count, color: 'text-red-400' },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-gray-800/50 border border-gray-700/50 px-3 py-2 text-center">
                <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FP guidance */}
        {result.false_positive_guidance && (
          <div>
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">FP Guidance</h4>
            <p className="text-xs text-gray-300 leading-relaxed rounded-lg bg-gray-800/40 border border-gray-700/40 px-3 py-2">
              {result.false_positive_guidance}
            </p>
          </div>
        )}

        {/* Tuning recommendations */}
        {result.tuning_recommendations.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Tuning Recommendations</h4>
            <ul className="space-y-1.5">
              {result.tuning_recommendations.map((rec, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-300">
                  <span className="text-blue-400 shrink-0">→</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Similar rules */}
        {result.similar_rules.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Similar Existing Rules</h4>
            <div className="space-y-2">
              {result.similar_rules.map((sr) => (
                <div key={sr.rule_id} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-gray-800/40 border border-gray-700/40">
                  <div>
                    <span className="text-gray-200 font-medium">{sr.name}</span>
                    <span className="text-gray-500 ml-2 font-mono">{sr.technique_ids.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-12 rounded-full bg-gray-700 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.round(sr.similarity_score * 100)}%` }}
                      />
                    </div>
                    <span className="text-gray-400 tabular-nums">{Math.round(sr.similarity_score * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deploy placeholder */}
        <div className="pt-2 border-t border-gray-800 flex gap-2">
          <button disabled className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-600 cursor-not-allowed">
            Deploy to Sentinel
          </button>
          <button disabled className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-600 cursor-not-allowed">
            Export Rule
          </button>
        </div>
      </div>
    </div>
  )
}
