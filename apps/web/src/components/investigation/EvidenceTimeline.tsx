import { useMemo } from 'react'
import { clsx } from 'clsx'
import type { Investigation } from '../../types/investigation'
import type { EvidenceTimelineEntry } from '../../types/evidence'
import { deriveTimeline } from '../../utils/evidenceGraph'
import { submitCommand } from '../../utils/commandRunner'

const MODE_PILL: Record<string, string> = {
  query:  'text-blue-400 bg-blue-500/10 border-blue-500/25',
  action: 'text-purple-400 bg-purple-500/10 border-purple-500/25',
  refine: 'text-teal-400 bg-teal-500/10 border-teal-500/25',
}

const ENTRY_ICON: Record<string, string> = {
  turn:    '→',
  artifact:'⊟',
  note:    '✎',
  finding: '◈',
}

const ENTRY_COLOR: Record<string, string> = {
  turn:    'border-gray-700/50',
  artifact:'border-blue-500/20',
  note:    'border-cyan-500/20',
  finding: 'border-amber-500/20',
}

function fmtTs(iso: string) {
  return iso.replace('T', ' ').slice(0, 16)
}

function EntryCard({ entry }: { entry: EvidenceTimelineEntry }) {
  const color = ENTRY_COLOR[entry.type] ?? 'border-gray-700/50'

  return (
    <div className={clsx('relative pl-8')}>
      {/* Timeline spine dot */}
      <div className="absolute left-0 top-2.5 flex flex-col items-center">
        <span className={clsx(
          'w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0',
          entry.type === 'finding' ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' :
          entry.type === 'note'    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' :
          entry.type === 'turn'    ? 'border-gray-600/60 bg-gray-900 text-gray-400' :
                                     'border-blue-500/40 bg-blue-500/10 text-blue-400',
        )}>
          {ENTRY_ICON[entry.type]}
        </span>
      </div>

      <div className={clsx('rounded-lg border px-3 py-2.5 bg-gray-900/40', color)}>
        {/* Timestamp + type row */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] text-gray-600 font-mono">{fmtTs(entry.timestamp)}</span>
          {entry.mode && (
            <span className={clsx('text-[9px] px-1.5 py-0.5 rounded border font-mono uppercase', MODE_PILL[entry.mode])}>
              {entry.mode}
            </span>
          )}
          {entry.artifactType && (
            <span className="text-[9px] px-1.5 py-0.5 rounded border text-blue-400 bg-blue-500/10 border-blue-500/25 font-mono">
              {entry.artifactType}
            </span>
          )}
          {entry.isPinned && (
            <span className="text-[9px] px-1.5 py-0.5 rounded border text-amber-400 bg-amber-500/10 border-amber-500/25">
              pinned
            </span>
          )}
        </div>

        {/* Title */}
        <p className="text-xs text-gray-200 leading-snug mb-1">{entry.title}</p>

        {/* Detail / result summary */}
        {entry.detail && (
          <p className="text-[10px] text-gray-500 leading-relaxed">{entry.detail}</p>
        )}

        {/* Related entities */}
        {entry.relatedEntityValues.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {entry.relatedEntityValues.map((val) => (
              <button
                key={val}
                onClick={() =>
                  submitCommand(`What did ${val} do in the last 24 hours?`, {
                    source: 'entity_chip',
                  })
                }
                className="text-[9px] px-1.5 py-0.5 rounded border text-gray-400 border-gray-700/40 bg-gray-800/30 hover:text-gray-200 hover:border-gray-600/60 transition-colors font-mono"
              >
                {val}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface Props {
  inv: Investigation
}

export function EvidenceTimeline({ inv }: Props) {
  const timeline = useMemo(() => deriveTimeline(inv), [inv])

  if (timeline.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-700/50 px-5 py-10 flex flex-col items-center gap-3 text-center">
        <span className="text-3xl text-gray-700">▶</span>
        <p className="text-sm text-gray-500">No investigation activity yet.</p>
        <p className="text-xs text-gray-600">Turns, notes, and pinned findings will appear here as a chronological timeline.</p>
        <button
          onClick={() =>
            submitCommand(
              `Build a timeline for ${inv.entities[0] ?? 'the primary entity'}`,
              { source: 'investigation_quick_action' },
            )
          }
          className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 transition-colors"
        >
          Generate Timeline →
        </button>
      </div>
    )
  }

  const counts = {
    turn:    timeline.filter((e) => e.type === 'turn').length,
    note:    timeline.filter((e) => e.type === 'note').length,
    finding: timeline.filter((e) => e.type === 'finding').length,
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-4 text-[10px]">
        <span className="text-gray-600">{timeline.length} events</span>
        {counts.turn > 0 && <span className="text-gray-500">→ {counts.turn} turns</span>}
        {counts.note > 0 && <span className="text-cyan-600">✎ {counts.note} notes</span>}
        {counts.finding > 0 && <span className="text-amber-600">◈ {counts.finding} findings</span>}
      </div>

      {/* Timeline spine */}
      <div className="relative space-y-3">
        {/* Vertical spine line */}
        <div className="absolute left-2.5 top-3 bottom-3 w-px bg-gray-800/80 pointer-events-none" />

        {timeline.map((entry) => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}
