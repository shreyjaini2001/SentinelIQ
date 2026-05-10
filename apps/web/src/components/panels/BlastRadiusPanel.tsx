import type { BlastRadiusResult, ReachableAsset } from '../../types'

interface Props {
  result: BlastRadiusResult
}

const RISK_COLORS: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  high:     'text-orange-400 bg-orange-500/10 border-orange-500/30',
  medium:   'text-amber-400 bg-amber-500/10 border-amber-500/30',
  low:      'text-gray-400 bg-gray-700/30 border-gray-600',
}

const RISK_BAR: Record<string, string> = {
  critical: 'border-l-red-500',
  high:     'border-l-orange-500',
  medium:   'border-l-amber-400',
  low:      'border-l-gray-600',
}

const TYPE_ICONS: Record<string, string> = {
  user:              '◈',
  host:              '□',
  group:             '◫',
  role:              '⬡',
  service_principal: '⊙',
}

function RiskBadge({ level }: { level: string }) {
  const cls = RISK_COLORS[level] ?? RISK_COLORS.low
  return (
    <span className={`px-1.5 py-0.5 rounded-md text-[10px] border ${cls} uppercase font-semibold tracking-wide`}>
      {level}
    </span>
  )
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#ef4444' : score >= 50 ? '#f97316' : score >= 25 ? '#f59e0b' : '#6b7280'
  const label = score >= 80 ? 'Critical' : score >= 50 ? 'High' : score >= 25 ? 'Medium' : 'Low'
  const labelColor = score >= 80 ? 'text-red-400' : score >= 50 ? 'text-orange-400' : score >= 25 ? 'text-amber-400' : 'text-gray-400'
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1f2937" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${score} ${100 - score}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-white leading-none font-mono">{score}</span>
          <span className="text-[10px] text-gray-600">/100</span>
        </div>
      </div>
      <span className={`text-[10px] font-semibold uppercase tracking-wider ${labelColor}`}>{label} Risk</span>
    </div>
  )
}

function AssetRow({ asset }: { asset: ReachableAsset }) {
  return (
    <div className={`flex items-start gap-3 py-2 px-3 rounded-lg bg-gray-800/30 border-l-2 border border-gray-700/30 hover:bg-gray-800/50 transition-colors ${RISK_BAR[asset.risk_level] ?? RISK_BAR.low}`}>
      <span className="text-gray-500 text-base shrink-0 mt-0.5 font-mono">{TYPE_ICONS[asset.asset_type] ?? '?'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-gray-200 truncate">{asset.name}</span>
          <RiskBadge level={asset.risk_level} />
        </div>
        <p className="text-xs text-gray-500 truncate font-mono">{asset.path}</p>
      </div>
    </div>
  )
}

export function BlastRadiusPanel({ result }: Props) {
  const byRisk = ['critical', 'high', 'medium', 'low']
  const sorted = [...result.reachable_assets].sort(
    (a, b) => byRisk.indexOf(a.risk_level) - byRisk.indexOf(b.risk_level),
  )
  const criticalCount = sorted.filter(a => a.risk_level === 'critical').length
  const highCount = sorted.filter(a => a.risk_level === 'high').length

  return (
    <div data-testid="blast-radius-panel" className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/50 bg-gray-900/60">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full bg-red-500/70" />
          <span className="text-sm font-semibold text-white tracking-tight">Blast Radius</span>
          <code className="text-xs text-gray-400 font-mono">{result.seed_entity}</code>
        </div>
        <span className="text-xs text-gray-500 font-mono">{result.duration_ms}ms</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Score + scope */}
        <div className="flex items-center gap-5 rounded-xl bg-gray-800/30 border border-gray-700/40 p-4">
          <ScoreRing score={result.risk_score} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-200 mb-2 leading-snug">{result.estimated_scope}</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-gray-900/60 border border-gray-700/40 px-2 py-1.5 text-center">
                <div className="text-lg font-bold text-gray-200 font-mono">{result.total_reachable_assets}</div>
                <div className="text-[10px] text-gray-600">assets</div>
              </div>
              <div className="rounded-lg bg-red-950/30 border border-red-500/20 px-2 py-1.5 text-center">
                <div className="text-lg font-bold text-red-400 font-mono">{criticalCount}</div>
                <div className="text-[10px] text-gray-600">critical</div>
              </div>
              <div className="rounded-lg bg-orange-950/20 border border-orange-500/20 px-2 py-1.5 text-center">
                <div className="text-lg font-bold text-orange-400 font-mono">{highCount}</div>
                <div className="text-[10px] text-gray-600">high</div>
              </div>
            </div>
          </div>
        </div>

        {/* Privileged paths */}
        {result.privileged_paths.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-0.5 h-3 rounded-full bg-red-500/60" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Privileged Access Paths</span>
              <span className="ml-auto text-[10px] font-mono text-red-400">{result.privileged_paths.length} path{result.privileged_paths.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-2">
              {result.privileged_paths.map((p, i) => (
                <div key={i} className="rounded-lg bg-red-950/20 border border-red-500/20 px-3 py-2.5">
                  <code className="text-xs text-red-300 block font-mono leading-relaxed">{p.path}</code>
                  <p className="text-xs text-gray-500 mt-1">{p.attack_vector}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reachable assets */}
        {sorted.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-0.5 h-3 rounded-full bg-orange-500/60" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Reachable Assets</span>
              <span className="ml-auto text-[10px] font-mono text-gray-500">{sorted.length} total</span>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {sorted.map((a) => (
                <AssetRow key={`${a.asset_type}-${a.asset_id}`} asset={a} />
              ))}
            </div>
          </div>
        )}

        {/* Containment steps */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-0.5 h-3 rounded-full bg-blue-500/60" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Containment Steps</span>
          </div>
          <ol className="space-y-2">
            {result.containment_steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-300">
                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs flex items-center justify-center font-semibold font-mono">
                  {i + 1}
                </span>
                <span className="leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="pt-1 border-t border-gray-800/60 flex gap-2">
          <button disabled className="text-xs px-3 py-1.5 rounded-lg border border-gray-700/60 text-gray-600 cursor-not-allowed">
            Export Report
          </button>
          <button disabled className="text-xs px-3 py-1.5 rounded-lg border border-gray-700/60 text-gray-600 cursor-not-allowed">
            Create Ticket
          </button>
        </div>
      </div>
    </div>
  )
}
