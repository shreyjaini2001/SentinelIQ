import { useState } from 'react'
import { clsx } from 'clsx'
import type { HuntResult } from '../../types'

interface Props {
  result: HuntResult
}

const EVIDENCE_CONFIG = {
  confirmed: { label: 'Confirmed',   color: 'bg-red-500/20 text-red-400 border-red-500/40',       dot: 'bg-red-500'    },
  suspected: { label: 'Suspected',   color: 'bg-amber-500/20 text-amber-400 border-amber-500/40', dot: 'bg-amber-500'  },
  not_found: { label: 'No evidence', color: 'bg-gray-800/60 text-gray-500 border-gray-700/60',    dot: 'bg-gray-600'   },
}

export function HuntResultPanel({ result }: Props) {
  const [showKql, setShowKql] = useState<string | null>(null)
  const [narrativeOpen, setNarrativeOpen] = useState(true)

  const withEvidence = result.technique_results.filter(t => t.evidence_level !== 'not_found')
  const confirmed = result.technique_results.filter(t => t.evidence_level === 'confirmed')
  const suspected = result.technique_results.filter(t => t.evidence_level === 'suspected')

  return (
    <div data-testid="hunt-result-panel" className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/50 bg-gray-900/60">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full bg-orange-500/70" />
          <span className="text-sm font-semibold text-white tracking-tight">Threat Hunt</span>
          {result.threat_actor && (
            <span className="text-xs px-2 py-0.5 rounded-md border border-orange-500/40 text-orange-400 bg-orange-500/10 font-medium uppercase tracking-wide">
              {result.threat_actor}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="font-mono">{result.time_window}</span>
          <span className="text-gray-700">·</span>
          <span className="font-mono">{result.duration_ms}ms</span>
        </div>
      </div>

      {/* Summary stat row */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b border-gray-800/60">
        <div className="rounded-lg bg-gray-800/60 border border-gray-700/40 px-3 py-2.5 text-center">
          <div className="text-2xl font-bold text-gray-300 font-mono">{result.techniques_queried}</div>
          <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Techniques</div>
        </div>
        <div className="rounded-lg bg-red-500/8 border border-red-500/20 px-3 py-2.5 text-center">
          <div className="text-2xl font-bold text-red-400 font-mono">{confirmed.length}</div>
          <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Confirmed</div>
        </div>
        <div className="rounded-lg bg-amber-500/8 border border-amber-500/20 px-3 py-2.5 text-center">
          <div className="text-2xl font-bold text-amber-400 font-mono">{suspected.length}</div>
          <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Suspected</div>
        </div>
      </div>

      {/* ATT&CK coverage heatmap */}
      <div className="px-5 py-4 border-b border-gray-800/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-0.5 h-3 rounded-full bg-orange-500/60" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">ATT&CK Coverage</span>
          </div>
          <div className="flex items-center gap-3">
            {(['confirmed', 'suspected', 'not_found'] as const).map((level) => (
              <div key={level} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-sm ${EVIDENCE_CONFIG[level].dot}`} />
                <span className="text-[10px] text-gray-600">{EVIDENCE_CONFIG[level].label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {result.technique_results.map((t) => {
            const cfg = EVIDENCE_CONFIG[t.evidence_level]
            return (
              <button
                key={t.technique_id}
                onClick={() => setShowKql(showKql === t.technique_id ? null : t.technique_id)}
                className={clsx(
                  'px-2 py-1 rounded-md border text-xs font-mono transition-all hover:brightness-125',
                  cfg.color,
                  showKql === t.technique_id && 'ring-1 ring-white/20',
                )}
                title={`${t.technique_name} — ${cfg.label} (${t.event_count} events)`}
              >
                {t.technique_id}
              </button>
            )
          })}
        </div>

        {showKql && (() => {
          const t = result.technique_results.find(r => r.technique_id === showKql)
          return t ? (
            <div className="mt-3 rounded-lg bg-gray-950/80 border border-gray-700/60 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800 bg-gray-900/80">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-500">KQL</span>
                  <span className="text-[10px] text-gray-600">·</span>
                  <span className="text-[10px] text-gray-400">{t.technique_name}</span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">{t.event_count} events</span>
              </div>
              <pre className="px-3 py-2.5 text-xs font-mono text-blue-300 whitespace-pre-wrap leading-relaxed">{t.kql_executed}</pre>
            </div>
          ) : null
        })()}
      </div>

      {/* Evidence details */}
      {withEvidence.length > 0 && (
        <div className="px-5 py-4 border-b border-gray-800/60">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-0.5 h-3 rounded-full bg-red-500/60" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Evidence Found — {withEvidence.length} Technique{withEvidence.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-1.5">
            {withEvidence.map((t) => {
              const cfg = EVIDENCE_CONFIG[t.evidence_level]
              return (
                <div key={t.technique_id} className="flex items-center gap-2.5 rounded-lg bg-gray-800/30 border border-gray-700/30 px-3 py-2 text-xs">
                  <div className={clsx('w-2 h-2 rounded-full shrink-0', cfg.dot)} />
                  <code className="text-gray-400 font-mono">{t.technique_id}</code>
                  <span className="text-gray-300 font-medium">{t.technique_name}</span>
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-500">{t.tactic}</span>
                  <span className="ml-auto text-gray-500 font-mono tabular-nums">{t.event_count} events</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Narrative */}
      <div>
        <button
          onClick={() => setNarrativeOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-2.5 text-xs text-gray-400 hover:bg-gray-800/30 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-0.5 h-3 rounded-full bg-gray-500/40" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Hunt Narrative</span>
          </div>
          <span className="text-gray-600">{narrativeOpen ? '▴' : '▾'}</span>
        </button>
        {narrativeOpen && (
          <div className="px-5 pb-5">
            <p className="text-sm text-gray-300 leading-relaxed">{result.narrative}</p>
          </div>
        )}
      </div>
    </div>
  )
}
