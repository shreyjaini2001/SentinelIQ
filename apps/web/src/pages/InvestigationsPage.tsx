import { useState } from 'react'
import { clsx } from 'clsx'
import { useInvestigationStore } from '../stores/investigationStore'
import type { InvestigationSeverity } from '../types/investigation'
import type { PageId } from '../components/AppShell/Sidebar'

const SEV_COLOR: Record<string, string> = {
  critical: 'text-red-400',
  high:     'text-orange-400',
  medium:   'text-amber-400',
  low:      'text-gray-400',
}

const STATUS_STYLE: Record<string, string> = {
  active:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  closed:  'text-gray-500 bg-gray-500/10 border-gray-500/25',
  pending: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
}

function fmtTs(iso: string) {
  return iso.replace('T', ' ').slice(0, 16)
}

interface Props {
  onNavigate: (page: PageId) => void
}

export function InvestigationsPage({ onNavigate }: Props) {
  const { investigations, openInvestigation, createInvestigation } = useInvestigationStore()
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSev, setNewSev] = useState<InvestigationSeverity>('high')

  const handleOpen = (id: string) => {
    openInvestigation(id)
    onNavigate('investigation-workspace')
  }

  const handleCreate = () => {
    const title = newTitle.trim()
    if (!title) return
    const id = createInvestigation(title, newSev)
    setShowCreate(false)
    setNewTitle('')
    openInvestigation(id)
    onNavigate('investigation-workspace')
  }

  const active = investigations.filter((i) => i.status === 'active')
  const closed = investigations.filter((i) => i.status !== 'active')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Investigations</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {active.length} active · {closed.length} closed
          </p>
        </div>
        <button
          onClick={() => setShowCreate((s) => !s)}
          className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-medium hover:bg-blue-600/30 transition-colors"
        >
          + New Investigation
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-4 space-y-3">
          <div className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest">New Investigation</div>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
            placeholder="Investigation title…"
            autoFocus
            className="w-full bg-transparent border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-blue-500/50"
          />
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {(['critical', 'high', 'medium', 'low'] as InvestigationSeverity[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setNewSev(s)}
                  className={clsx(
                    'text-[10px] px-2 py-1 rounded border transition-colors capitalize',
                    newSev === s
                      ? `${SEV_COLOR[s]} bg-gray-800/60 border-current`
                      : 'text-gray-600 border-gray-700/40 hover:text-gray-400',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <button
              onClick={() => setShowCreate(false)}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Create &amp; Open
            </button>
          </div>
        </div>
      )}

      {/* Active investigations */}
      {active.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Active</div>
          {active.map((inv) => (
            <button
              key={inv.id}
              onClick={() => handleOpen(inv.id)}
              className="w-full text-left rounded-xl border border-gray-700/50 bg-gray-900/60 p-4 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-gray-600">{inv.id}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_STYLE[inv.status]}`}>
                      {inv.status}
                    </span>
                    <span className={`text-[10px] font-semibold ${SEV_COLOR[inv.severity]}`}>
                      {inv.severity}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white truncate">{inv.title}</h3>
                  <div className="flex items-center gap-4 mt-1.5 text-[10px] text-gray-600">
                    <span>{inv.turns.length} turns</span>
                    <span>{inv.artifacts.length} artifacts</span>
                    <span>{inv.alerts.length} alerts</span>
                    <span>Owner: {inv.owner}</span>
                    <span>Updated {fmtTs(inv.updated_at)}</span>
                  </div>
                </div>
                <span className="text-[10px] text-blue-400 shrink-0 mt-1">Open →</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Closed investigations */}
      {closed.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Closed</div>
          {closed.map((inv) => (
            <button
              key={inv.id}
              onClick={() => handleOpen(inv.id)}
              className="w-full text-left rounded-xl border border-gray-700/30 bg-gray-900/30 p-4 hover:border-gray-600/50 transition-all opacity-70 hover:opacity-100"
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-gray-700">{inv.id}</span>
                <span className="text-xs text-gray-500 flex-1 truncate">{inv.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_STYLE[inv.status]}`}>
                  {inv.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {investigations.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-700/50 px-5 py-10 flex flex-col items-center gap-2 text-center">
          <span className="text-2xl text-gray-700">◈</span>
          <p className="text-sm text-gray-600">No investigations yet</p>
          <p className="text-xs text-gray-700">Create one above or start from an alert triage</p>
        </div>
      )}
    </div>
  )
}
