import { useSessionStore } from '../stores/sessionStore'

const FIXTURE_INVESTIGATIONS = [
  {
    id: 'INV-001',
    title: 'jsmith Account Compromise',
    severity: 'critical',
    status: 'active',
    owner: 'analyst_1',
    alerts: 4,
    created: '2026-05-10 08:23',
    updated: '2026-05-10 08:45',
  },
  {
    id: 'INV-002',
    title: 'LAPSUS$ TTP Hunt — May 2026',
    severity: 'high',
    status: 'active',
    owner: 'analyst_2',
    alerts: 7,
    created: '2026-05-09 14:30',
    updated: '2026-05-09 17:15',
  },
]

const SEV_COLOR: Record<string, string> = {
  critical: 'text-red-400',
  high:     'text-orange-400',
  medium:   'text-amber-400',
  low:      'text-gray-400',
}

const STATUS_STYLE: Record<string, string> = {
  active:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  closed:   'text-gray-500 bg-gray-500/10 border-gray-500/25',
  pending:  'text-amber-400 bg-amber-500/10 border-amber-500/25',
}

export function InvestigationsPage() {
  const { setPendingQuery } = useSessionStore()

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Investigations</h1>
          <p className="text-xs text-gray-500 mt-0.5">2 active · 0 pending handoff</p>
        </div>
        <button
          onClick={() => setPendingQuery('Triage my open alerts')}
          className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-medium hover:bg-blue-600/30 transition-colors"
        >
          + New Investigation
        </button>
      </div>

      {/* Active investigations */}
      <div className="space-y-3">
        {FIXTURE_INVESTIGATIONS.map((inv) => (
          <div
            key={inv.id}
            className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4 hover:border-gray-600/60 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-gray-600">{inv.id}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_STYLE[inv.status]}`}>
                    {inv.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white truncate">{inv.title}</h3>
                <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500">
                  <span className={`font-medium ${SEV_COLOR[inv.severity]}`}>{inv.severity}</span>
                  <span>{inv.alerts} alerts</span>
                  <span>Owner: {inv.owner}</span>
                  <span>Updated {inv.updated}</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setPendingQuery(`Build a timeline for jsmith@corp.com`)}
                  className="text-[10px] px-2 py-1 rounded bg-orange-500/10 border border-orange-500/25 text-orange-300 hover:bg-orange-500/20 transition-colors"
                >
                  Timeline
                </button>
                <button
                  onClick={() => setPendingQuery('Generate an executive summary for this investigation')}
                  className="text-[10px] px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                >
                  Report
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state hint */}
      <div className="rounded-xl border border-dashed border-gray-700/50 px-5 py-8 flex flex-col items-center gap-2 text-center">
        <span className="text-2xl text-gray-700">◈</span>
        <p className="text-sm text-gray-600">Start a new investigation from the Alerts page</p>
        <p className="text-xs text-gray-700">or ask: "Triage my critical alerts" to identify candidates</p>
      </div>
    </div>
  )
}
