import { useState } from 'react'
import { clsx } from 'clsx'
import type { HuntResult } from '../../types'

interface Props {
  result: HuntResult
}

const EVIDENCE_CONFIG = {
  confirmed: { label: 'Confirmed', color: 'bg-red-500/20 text-red-400 border-red-500/30', dot: 'bg-red-500' },
  suspected: { label: 'Suspected', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
  not_found: { label: 'No evidence', color: 'bg-gray-800 text-gray-500 border-gray-700', dot: 'bg-gray-600' },
}

export function HuntResultPanel({ result }: Props) {
  const [showKql, setShowKql] = useState<string | null>(null)
  const [narrativeOpen, setNarrativeOpen] = useState(true)

  const withEvidence = result.technique_results.filter(t => t.evidence_level !== 'not_found')

  return (
    <div data-testid="hunt-result-panel" className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-gray-900/50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">Threat Hunt</span>
          {result.threat_actor && (
            <span className="text-xs px-2 py-0.5 rounded border border-orange-500/30 text-orange-400 bg-orange-500/10">
              {result.threat_actor.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{result.techniques_queried} techniques</span>
          <span className="text-red-400">{result.techniques_with_evidence} with evidence</span>
          <span>{result.time_window} window</span>
          <span>{result.duration_ms}ms</span>
        </div>
      </div>

      {/* ATT&CK coverage heatmap */}
      <div className="px-4 py-3 border-b border-gray-800">
        <p className="text-xs text-gray-500 mb-2">ATT&CK Coverage</p>
        <div className="flex flex-wrap gap-1.5">
          {result.technique_results.map((t) => {
            const cfg = EVIDENCE_CONFIG[t.evidence_level]
            return (
              <button
                key={t.technique_id}
                onClick={() => setShowKql(showKql === t.technique_id ? null : t.technique_id)}
                className={clsx(
                  'px-2 py-1 rounded border text-xs font-mono transition-all',
                  cfg.color,
                  'hover:brightness-125'
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
            <div className="mt-2 p-2 rounded bg-gray-900 border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">{t.technique_name} — {t.event_count} events</p>
              <pre className="text-xs font-mono text-blue-300 whitespace-pre-wrap">{t.kql_executed}</pre>
            </div>
          ) : null
        })()}
      </div>

      {/* Technique list */}
      {withEvidence.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-800">
          <p className="text-xs text-gray-500 mb-2">Evidence found in {withEvidence.length} technique{withEvidence.length !== 1 ? 's' : ''}</p>
          <div className="space-y-1.5">
            {withEvidence.map((t) => {
              const cfg = EVIDENCE_CONFIG[t.evidence_level]
              return (
                <div key={t.technique_id} className="flex items-center gap-2 text-xs">
                  <div className={clsx('w-2 h-2 rounded-full shrink-0', cfg.dot)} />
                  <code className="text-gray-400">{t.technique_id}</code>
                  <span className="text-gray-300">{t.technique_name}</span>
                  <span className="text-gray-500">·</span>
                  <span className="text-gray-500">{t.tactic}</span>
                  <span className="ml-auto text-gray-500">{t.event_count} events</span>
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
          className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-400 hover:bg-gray-800/40 transition-colors"
        >
          <span>Hunt Narrative</span>
          <span>{narrativeOpen ? '▲' : '▼'}</span>
        </button>
        {narrativeOpen && (
          <div className="px-4 pb-4">
            <p className="text-sm text-gray-300 leading-relaxed">{result.narrative}</p>
          </div>
        )}
      </div>
    </div>
  )
}
