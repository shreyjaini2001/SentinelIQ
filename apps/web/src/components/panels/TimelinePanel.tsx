import { useState } from 'react'
import { clsx } from 'clsx'
import type { TimelineResult } from '../../types'

interface Props {
  result: TimelineResult
}

const TACTIC_COLORS: Record<string, string> = {
  'Reconnaissance':      'border-l-gray-500   bg-gray-500/5',
  'Initial Access':      'border-l-orange-500 bg-orange-500/5',
  'Execution':           'border-l-red-400    bg-red-400/5',
  'Persistence':         'border-l-amber-400  bg-amber-400/5',
  'Privilege Escalation':'border-l-yellow-400 bg-yellow-400/5',
  'Defense Evasion':     'border-l-purple-400 bg-purple-400/5',
  'Credential Access':   'border-l-pink-400   bg-pink-400/5',
  'Discovery':           'border-l-blue-300   bg-blue-300/5',
  'Lateral Movement':    'border-l-cyan-400   bg-cyan-400/5',
  'Collection':          'border-l-teal-400   bg-teal-400/5',
  'Exfiltration':        'border-l-emerald-400 bg-emerald-400/5',
  'Command and Control': 'border-l-indigo-400 bg-indigo-400/5',
  'Impact':              'border-l-red-600    bg-red-600/5',
}

const TACTIC_DOT: Record<string, string> = {
  'Initial Access':       'bg-orange-500',
  'Execution':            'bg-red-400',
  'Persistence':          'bg-amber-400',
  'Privilege Escalation': 'bg-yellow-400',
  'Defense Evasion':      'bg-purple-400',
  'Credential Access':    'bg-pink-400',
  'Discovery':            'bg-blue-300',
  'Lateral Movement':     'bg-cyan-400',
  'Exfiltration':         'bg-emerald-400',
  'Command and Control':  'bg-indigo-400',
  'Impact':               'bg-red-600',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function TimelinePanel({ result }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [view, setView] = useState<'stages' | 'events'>('stages')

  return (
    <div data-testid="timeline-panel" className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/50 bg-gray-900/60">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full bg-cyan-500/70" />
          <span className="text-sm font-semibold text-white tracking-tight">Attack Timeline</span>
          <code className="text-xs text-cyan-300 font-mono bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">{result.seed_entity}</code>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-mono">{result.total_events} events · {result.duration_ms}ms</span>
          <div className="flex rounded-lg overflow-hidden border border-gray-700/60">
            {(['stages', 'events'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={clsx(
                  'px-2.5 py-1 text-xs capitalize transition-colors',
                  view === v ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60',
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
          {result.stages.map((stage, idx) => (
            <div
              key={stage.tactic}
              className={clsx(
                'border-l-2 pl-3.5 py-2.5 rounded-r-lg',
                TACTIC_COLORS[stage.tactic] || 'border-l-gray-600 bg-gray-600/5',
              )}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <div className={clsx('w-2 h-2 rounded-full shrink-0', TACTIC_DOT[stage.tactic] || 'bg-gray-500')} />
                <span className="text-xs font-semibold text-gray-200">{stage.tactic}</span>
                <span className="text-xs text-gray-500 font-mono">{stage.event_count} event{stage.event_count !== 1 ? 's' : ''}</span>
                <span className="text-xs text-gray-600 ml-auto font-mono">{formatTime(stage.first_seen)}</span>
                <span className="text-[10px] text-gray-700 font-mono">step {idx + 1}</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed ml-4.5">{stage.plain_english_summary}</p>
            </div>
          ))}
        </div>
      )}

      {/* Events view */}
      {view === 'events' && (
        <div className="divide-y divide-gray-800/50 max-h-96 overflow-y-auto">
          {result.events.map((event) => (
            <div
              key={event.event_id}
              className={clsx(
                'px-5 py-2.5 border-l-2 cursor-pointer hover:bg-gray-800/25 transition-colors',
                TACTIC_COLORS[event.tactic] || 'border-l-gray-700',
              )}
              onClick={() => setExpanded(expanded === event.event_id ? null : event.event_id)}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono text-gray-500 shrink-0 tabular-nums">{formatTime(event.timestamp)}</span>
                <span className="text-[10px] text-gray-600 uppercase tracking-wider shrink-0">{event.source}</span>
                <span className="text-xs text-gray-300 truncate">{event.raw_description}</span>
                <span className="ml-auto text-[10px] text-gray-600 shrink-0 font-mono">{event.tactic}</span>
              </div>
              {expanded === event.event_id && (
                <div className="mt-2 p-2.5 rounded-lg bg-gray-900/80 border border-gray-700/60">
                  <p className="text-xs text-gray-300">{event.raw_description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                    <span>Tactic: {event.tactic}</span>
                    <span>·</span>
                    <span>Confidence: {Math.round(event.tactic_confidence * 100)}%</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sources */}
      <div className="px-5 py-2.5 border-t border-gray-800/60 flex items-center gap-2">
        <span className="text-[10px] text-gray-600 uppercase tracking-wider">Sources</span>
        {result.sources_queried.map((s) => (
          <code key={s} className="text-[10px] text-gray-500 font-mono bg-gray-800/40 px-1.5 py-0.5 rounded">{s}</code>
        ))}
      </div>
    </div>
  )
}
