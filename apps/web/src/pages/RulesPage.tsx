import { clsx } from 'clsx'
import { useSessionStore } from '../stores/sessionStore'

const FIXTURE_RULES = [
  {
    id: 'RUL-001',
    name: 'GeoAnomalyLogin',
    description: 'Detects sign-ins from countries not previously seen for this account',
    severity: 'high',
    alerts30d: 847,
    fpRate: 0.73,
    status: 'active',
    noisy: true,
    techniques: ['T1078', 'T1566'],
  },
  {
    id: 'RUL-002',
    name: 'ImpossibleTravel',
    description: 'Sign-in from two geographically distant locations in a short time window',
    severity: 'high',
    alerts30d: 429,
    fpRate: 0.61,
    status: 'active',
    noisy: true,
    techniques: ['T1078'],
  },
  {
    id: 'RUL-003',
    name: 'PrivilegedGroupModification',
    description: 'Changes to privileged AD groups such as Domain Admins or Global Admins',
    severity: 'critical',
    alerts30d: 12,
    fpRate: 0.08,
    status: 'active',
    noisy: false,
    techniques: ['T1098'],
  },
  {
    id: 'RUL-004',
    name: 'EncodedPowerShellExecution',
    description: 'PowerShell process launched with -EncodedCommand flag',
    severity: 'high',
    alerts30d: 156,
    fpRate: 0.32,
    status: 'active',
    noisy: false,
    techniques: ['T1059.001'],
  },
  {
    id: 'RUL-005',
    name: 'SuspiciousSignIn',
    description: 'Sign-in with medium/high risk score from Azure Identity Protection',
    severity: 'medium',
    alerts30d: 234,
    fpRate: 0.45,
    status: 'active',
    noisy: false,
    techniques: ['T1078', 'T1110'],
  },
]

const SEV_COLOR: Record<string, string> = {
  critical: 'text-red-400',
  high:     'text-orange-400',
  medium:   'text-amber-400',
  low:      'text-gray-400',
}

export function RulesPage() {
  const { setPendingQuery } = useSessionStore()

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Detection Rules</h1>
          <p className="text-xs text-gray-500 mt-0.5">{FIXTURE_RULES.length} active rules · 2 noisy · Mock library</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPendingQuery('Create a detection rule from this pattern')}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium hover:bg-emerald-600/30 transition-colors"
          >
            + AI Rule Suggestion
          </button>
        </div>
      </div>

      {/* Noisy rule callout */}
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <span className="text-amber-400 text-sm shrink-0">⚠</span>
          <div>
            <div className="text-xs font-semibold text-amber-300 mb-1">2 noisy rules detected</div>
            <p className="text-xs text-amber-400/70">
              GeoAnomalyLogin and ImpossibleTravel have FP rates above 60%.
              Ask AI to help tune them.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setPendingQuery('Why does GeoAnomalyLogin fire so often?')}
                className="text-[10px] px-2 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-colors"
              >
                Tune GeoAnomalyLogin →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rules table */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800/80">
              {['Rule Name', 'Severity', 'Alerts / 30d', 'FP Rate', 'Status', ''].map((col) => (
                <th key={col} className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-2.5">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FIXTURE_RULES.map((rule) => (
              <tr key={rule.id} className="border-b border-gray-800/30 hover:bg-gray-800/25 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {rule.noisy && (
                      <span className="text-amber-400 text-xs" title="Noisy rule">⚠</span>
                    )}
                    <div>
                      <div className="text-xs font-medium text-gray-200">{rule.name}</div>
                      <div className="text-[10px] text-gray-600 mt-0.5 max-w-xs truncate">{rule.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${SEV_COLOR[rule.severity]}`}>
                    {rule.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 font-mono">{rule.alerts30d.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    'text-xs font-mono',
                    rule.fpRate > 0.5 ? 'text-red-400' : rule.fpRate > 0.3 ? 'text-amber-400' : 'text-emerald-400',
                  )}>
                    {(rule.fpRate * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] px-1.5 py-0.5 rounded border text-emerald-400 bg-emerald-500/10 border-emerald-500/25">
                    active
                  </span>
                </td>
                <td className="px-4 py-3">
                  {rule.noisy && (
                    <button
                      onClick={() => setPendingQuery(`Why does ${rule.name} fire so often?`)}
                      className="text-[10px] text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      Tune →
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 border-t border-gray-800/60">
          <span className="text-[10px] text-gray-600">Fixture rules · Mock library</span>
        </div>
      </div>
    </div>
  )
}
