import { useState } from 'react'
import { clsx } from 'clsx'
import type { TimelineResult } from '../../types'

interface Props {
  result: TimelineResult
}

const TACTIC_COLORS: Record<string, string> = {
  'Reconnaissance': 'border-l-gray-500 bg-gray-500/5',
  'Initial Access': 'border-l-orange-500 bg-orange-500/5',
  'Execution': 'border-l-red-400 bg-red-400/5',
  'Persistence': 'border-l-amber-400 bg-amber-400/5',
  'Privilege Escalation': 'border-l-yellow-400 bg-yellow-400/5',
  'Defense Evasion': 'border-l-purple-400 bg-purple-400/5',
  'Credential Access': 'border-l-pink-400 bg-pink-400/5',
  'Discovery': 'border-l-blue-300 bg-blue-300/5',
  'Lateral Movement': 'border-l-cyan-400 bg-cyan-400/5',
  'Collection': 'border-l-teal-400 bg-teal-400/5',
  'Exfiltration': 'border-l-emerald-400 bg-emerald-400/5',
  'Command and Control': 'border-l-indigo-400 bg-indigo-400/5',
  'Impact': 'border-l-red-600 bg-red-600/5',
}

const TACTIC_DOT: Record<string, string> = {
  'Initial Access': 'bg-orange-500',
  'Execution': 'bg-red-400',
  'Persistence': 'bg-amber-400',
  'Privilege Escalation': 'bg-yellow-400',
  'Defense Evasion': 'bg-purple-400',
  'Credential Access': 'bg-pink-400',
  'Discovery': 'bg-blue-300',
  'Lateral Movement': 'bg-cyan-400',
  'Exfiltration': 'bg-emerald-400',
  'Command and Control': 'bg-indigo-400',
  'Impact': 'bg-red-600',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function TimelinePanel({ result }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [view, setView] = useState<'events' | 'stages'>('stages')

  return (
    <div data-testid="timeline-panel" className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-gray-900/50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">Timeline</span>
          <code className="text-xs text-blue-300">{result.seed_entity}</code>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{result.total_events} events · {result.duration_ms}ms</span>
          <div className="flex rounded-lg overflow-hidden border border-gray-700">
            {(['stages', 'events'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={clsx(
                  'px-2 py-1 text-xs capitalize transition-colors',
                  view === v ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stages view */}
      {view === 'stages' && (
        <div className="p-4 space-y-2">
          {result.stages.map((stage) => (
            <div
              key={stage.tactic}
              className={clsx(
                'border-l-2 pl-3 py-2 rounded-r',
                TACTIC_COLORS[stage.tactic] || 'border-l-gray-600 bg-gray-600/5'
              )}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <div className={clsx('w-2 h-2 rounded-full shrink-0', TACTIC_DOT[stage.tactic] || 'bg-gray-500')} />
                <span className="text-xs font-medium text-gray-200">{stage.tactic}</span>
                <span className="text-xs text-gray-500">{stage.event_count} event{stage.event_count !== 1 ? 's' : ''}</span>
                <span className="text-xs text-gray-600 ml-auto">{formatTime(stage.first_seen)}</span>
              </div>
              <p className="text-xs text-gray-400 ml-4">{stage.plain_english_summary}</p>
            </div>
          ))}
        </div>
      )}

      {/* Events view */}
      {view === 'events' && (
        <div className="divide-y divide-gray-800/60 max-h-80 overflow-y-auto">
          {result.events.map((event) => (
            <div
              key={event.event_id}
              className={clsx(
                'px-4 py-2 border-l-2 cursor-pointer hover:bg-gray-800/30 transition-colors',
                TACTIC_COLORS[event.tactic] || 'border-l-gray-700'
              )}
              onClick={() => setExpanded(expanded === event.event_id ? null : event.event_id)}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-500 shrink-0">{formatTime(event.timestamp)}</span>
                <span className="text-xs text-gray-500">{event.source}</span>
                <span className="text-xs text-gray-300 truncate">{event.raw_description}</span>
                <span className="ml-auto text-xs text-gray-600 shrink-0">{event.tactic}</span>
              </div>
              {expanded === event.event_id && (
                <div className="mt-2 p-2 rounded bg-gray-900 border border-gray-700">
                  <p className="text-xs text-gray-300">{event.raw_description}</p>
                  <p className="text-xs text-gray-500 mt-1">Tactic: {event.tactic} · Confidence: {Math.round(event.tactic_confidence * 100)}%</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sources */}
      <div className="px-4 py-2 border-t border-gray-800 flex items-center gap-2">
        <span className="text-xs text-gray-600">Sources:</span>
        {result.sources_queried.map((s) => (
          <code key={s} className="text-xs text-gray-500">{s}</code>
        ))}
      </div>
    </div>
  )
}
