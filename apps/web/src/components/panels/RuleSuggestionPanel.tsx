import { useState } from 'react'
import type { RuleSuggestionResult } from '../../types'

interface Props {
  result: RuleSuggestionResult
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  high:     'text-orange-400 bg-orange-500/10 border-orange-500/30',
  medium:   'text-amber-400 bg-amber-500/10 border-amber-500/30',
  low:      'text-gray-400 bg-gray-700/30 border-gray-600',
}

const SEVERITY_ACCENT: Record<string, string> = {
  critical: 'bg-red-500/70',
  high:     'bg-orange-500/70',
  medium:   'bg-amber-500/70',
  low:      'bg-gray-500/60',
}

function SeverityBadge({ severity }: { severity: string }) {
  const cls = SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.low
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs border uppercase font-semibold tracking-wide ${cls}`}>
      {severity}
    </span>
  )
}

function FpRateBar({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100)
  const color = pct <= 5 ? 'bg-emerald-500' : pct <= 15 ? 'bg-amber-500' : 'bg-red-500'
  const label = pct <= 5 ? 'Low' : pct <= 15 ? 'Moderate' : 'High'
  const labelColor = pct <= 5 ? 'text-emerald-400' : pct <= 15 ? 'text-amber-400' : 'text-red-400'
  return (
    <div className="rounded-lg bg-gray-800/40 border border-gray-700/40 px-3 py-2.5 space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">Estimated FP Rate</span>
        <span className={`font-semibold font-mono ${labelColor}`}>{pct}% — {label}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(pct * 2, 100)}%` }} />
      </div>
    </div>
  )
}

export function RuleSuggestionPanel({ result }: Props) {
  const [showKql, setShowKql] = useState(true)
  const accent = SEVERITY_ACCENT[result.severity] ?? SEVERITY_ACCENT.low

  return (
    <div data-testid="rule-suggestion-panel" className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/50 bg-gray-900/60">
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-5 rounded-full ${accent}`} />
          <span className="text-sm font-semibold text-white tracking-tight">Rule Suggestion</span>
          <SeverityBadge severity={result.severity} />
        </div>
        <span className="text-xs text-gray-500 font-mono">{result.duration_ms}ms</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Rule identity */}
        <div>
          <h3 className="text-sm font-bold text-white mb-1 leading-snug">{result.rule_name}</h3>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">{result.rule_description}</p>
          <div className="flex flex-wrap gap-1.5">
            {result.technique_ids.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-300 font-mono text-xs">
                {t}
              </span>
            ))}
            {result.mitre_tactics.map((tac) => (
              <span key={tac} className="px-2 py-0.5 rounded-md bg-gray-700/50 border border-gray-600/60 text-gray-400 text-xs">
                {tac}
              </span>
            ))}
          </div>
        </div>

        {/* FP rate */}
        <FpRateBar rate={result.estimated_fp_rate} />

        {/* Backtest */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-0.5 h-3 rounded-full bg-emerald-500/60" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Backtest — {result.backtest.period}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Alerts', value: result.backtest.alert_count, color: 'text-gray-200', bg: 'bg-gray-800/60 border-gray-700/50' },
              { label: 'Est. True Positive', value: result.backtest.tp_count, color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-500/20' },
              { label: 'Est. False Positive', value: result.backtest.fp_count, color: 'text-red-400', bg: 'bg-red-950/20 border-red-500/20' },
            ].map((item) => (
              <div key={item.label} className={`rounded-lg border px-3 py-2.5 text-center ${item.bg}`}>
                <div className={`text-2xl font-bold font-mono ${item.color}`}>{item.value}</div>
                <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* KQL */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-0.5 h-3 rounded-full bg-blue-500/60" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">KQL Rule</span>
            </div>
            <button
              onClick={() => setShowKql(!showKql)}
              className="text-xs text-gray-500 hover:text-blue-400 transition-colors"
            >
              {showKql ? 'Hide' : 'Show'}
            </button>
          </div>
          {showKql && (
            <div className="rounded-lg bg-gray-950 border border-gray-800/60 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800 bg-gray-900/80">
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">KQL</span>
                <button disabled className="text-[10px] text-gray-700 cursor-not-allowed">Copy</button>
              </div>
              <pre className="px-4 py-3 text-xs text-gray-200 font-mono overflow-x-auto leading-relaxed whitespace-pre">
                {result.kql}
              </pre>
            </div>
          )}
        </div>

        {/* FP guidance */}
        {result.false_positive_guidance && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-0.5 h-3 rounded-full bg-amber-500/60" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">FP Guidance</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed rounded-lg bg-amber-950/15 border border-amber-500/20 px-3 py-2.5">
              {result.false_positive_guidance}
            </p>
          </div>
        )}

        {/* Tuning recommendations */}
        {result.tuning_recommendations.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-0.5 h-3 rounded-full bg-cyan-500/60" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Tuning Recommendations</span>
            </div>
            <ul className="space-y-1.5">
              {result.tuning_recommendations.map((rec, i) => (
                <li key={i} className="flex gap-2.5 text-xs text-gray-300 rounded-lg bg-gray-800/30 border border-gray-700/30 px-3 py-2">
                  <span className="text-cyan-400 shrink-0 font-mono">→</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Similar rules */}
        {result.similar_rules.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-0.5 h-3 rounded-full bg-gray-500/40" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Similar Existing Rules</span>
            </div>
            <div className="space-y-1.5">
              {result.similar_rules.map((sr) => (
                <div key={sr.rule_id} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-gray-800/30 border border-gray-700/30">
                  <div>
                    <span className="text-gray-200 font-medium">{sr.name}</span>
                    <span className="text-gray-600 ml-2 font-mono">{sr.technique_ids.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="h-1.5 w-14 rounded-full bg-gray-700 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.round(sr.similarity_score * 100)}%` }}
                      />
                    </div>
                    <span className="text-gray-400 tabular-nums font-mono">{Math.round(sr.similarity_score * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-1 border-t border-gray-800/60 flex gap-2">
          <button disabled className="text-xs px-3 py-1.5 rounded-lg border border-gray-700/60 text-gray-600 cursor-not-allowed">
            Deploy to Sentinel
          </button>
          <button disabled className="text-xs px-3 py-1.5 rounded-lg border border-gray-700/60 text-gray-600 cursor-not-allowed">
            Export Rule
          </button>
        </div>
      </div>
    </div>
  )
}
