import type { NormalizedSecurityEvent } from '../../types/events'

const CAT_COLOR: Record<string, string> = {
  authentication: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
  process:        'text-orange-400 bg-orange-500/10 border-orange-500/25',
  network:        'text-blue-400 bg-blue-500/10 border-blue-500/25',
  identity:       'text-purple-400 bg-purple-500/10 border-purple-500/25',
  cloud:          'text-teal-400 bg-teal-500/10 border-teal-500/25',
  alert:          'text-red-400 bg-red-500/10 border-red-500/25',
  email:          'text-amber-400 bg-amber-500/10 border-amber-500/25',
}

/**
 * Normalized event preview — shows how a connector's raw records land in the neutral model.
 * Explains the abstraction: raw source → normalized category + common entity fields.
 */
export function NormalizedEventPreview({
  events,
  connectorName,
  onClose,
}: {
  events: NormalizedSecurityEvent[]
  connectorName: string
  onClose: () => void
}) {
  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800/60">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Normalized Event Preview</span>
          <span className="text-[10px] text-gray-600">· {connectorName} · {events.length} events</span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-200 text-sm leading-none px-1.5 py-0.5 rounded hover:bg-gray-800/60 transition-colors">✕</button>
      </div>

      {events.length === 0 ? (
        <p className="text-xs text-gray-600 px-4 py-6 text-center">No events to preview.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800/80">
                {['Time', 'Source', 'Category', 'Event', 'User', 'Host', 'IP', 'Process', 'Severity'].map((h) => (
                  <th key={h} className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest px-3 py-2 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                  <td className="px-3 py-2 text-[11px] text-gray-500 font-mono whitespace-nowrap">{e.timestamp.replace('T', ' ').slice(0, 16)}</td>
                  <td className="px-3 py-2 text-[11px] text-gray-400 font-mono whitespace-nowrap">{e.sourceTableOrIndex}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${CAT_COLOR[e.eventCategory] ?? 'text-gray-400 border-gray-600/40'}`}>{e.eventCategory}</span>
                  </td>
                  <td className="px-3 py-2 text-[11px] text-gray-300 max-w-[220px] truncate">{e.eventName}</td>
                  <td className="px-3 py-2 text-[11px] text-gray-400 font-mono whitespace-nowrap">{e.user ?? '—'}</td>
                  <td className="px-3 py-2 text-[11px] text-gray-400 font-mono whitespace-nowrap">{e.host ?? '—'}</td>
                  <td className="px-3 py-2 text-[11px] text-gray-400 font-mono whitespace-nowrap">{e.ip ?? '—'}</td>
                  <td className="px-3 py-2 text-[11px] text-gray-400 font-mono whitespace-nowrap">{e.process ?? '—'}</td>
                  <td className="px-3 py-2 text-[11px] text-gray-500 whitespace-nowrap">{e.severity ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[10px] text-gray-600 px-4 py-2 border-t border-gray-800/60">
        Provenance: source connector → normalized event → alerts / query rows / evidence. Raw records stay as fixtures.
      </p>
    </div>
  )
}
