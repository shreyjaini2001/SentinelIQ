import type { BlastRadiusResult, ReachableAsset } from '../../types'

interface Props {
  result: BlastRadiusResult
}

const RISK_COLORS: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  low: 'text-gray-400 bg-gray-700/30 border-gray-600',
}

const TYPE_ICONS: Record<string, string> = {
  user: '👤',
  host: '🖥',
  group: '👥',
  role: '🔑',
  service_principal: '⚙',
}

function RiskBadge({ level }: { level: string }) {
  const cls = RISK_COLORS[level] ?? RISK_COLORS.low
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs border ${cls} uppercase font-medium`}>
      {level}
    </span>
  )
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#ef4444' : score >= 50 ? '#f97316' : score >= 25 ? '#f59e0b' : '#6b7280'
  return (
    <div className="relative w-20 h-20 shrink-0">
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
        <span className="text-lg font-bold text-white leading-none">{score}</span>
        <span className="text-[10px] text-gray-500">/ 100</span>
      </div>
    </div>
  )
}

function AssetRow({ asset }: { asset: ReachableAsset }) {
  return (
    <div className="flex items-start gap-3 py-2 px-3 rounded-lg bg-gray-800/40 hover:bg-gray-800/60 transition-colors">
      <span className="text-base shrink-0 mt-0.5">{TYPE_ICONS[asset.asset_type] ?? '?'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-gray-200 truncate">{asset.name}</span>
          <RiskBadge level={asset.risk_level} />
        </div>
        <p className="text-xs text-gray-500 truncate">{asset.path}</p>
      </div>
    </div>
  )
}

export function BlastRadiusPanel({ result }: Props) {
  const byRisk = ['critical', 'high', 'medium', 'low']
  const sorted = [...result.reachable_assets].sort(
    (a, b) => byRisk.indexOf(a.risk_level) - byRisk.indexOf(b.risk_level),
  )

  return (
    <div className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-gray-900/50">
        <div>
          <span className="text-sm font-medium text-white">Blast Radius</span>
          <span className="text-xs text-gray-500 ml-2">{result.seed_entity}</span>
        </div>
        <span className="text-xs text-gray-500">{result.duration_ms}ms</span>
      </div>

      <div className="p-4 space-y-5">
        {/* Score + scope */}
        <div className="flex items-center gap-5">
          <ScoreRing score={result.risk_score} />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-200 mb-1">{result.estimated_scope}</p>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span>{result.total_reachable_assets} assets reachable</span>
              <span>·</span>
              <span>{result.privileged_paths.length} privileged path{result.privileged_paths.length !== 1 ? 's' : ''}</span>
              <span>·</span>
              <span className="capitalize">{result.seed_entity_type}</span>
            </div>
          </div>
        </div>

        {/* Privileged paths */}
        {result.privileged_paths.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Privileged Access Paths</h4>
            <div className="space-y-2">
              {result.privileged_paths.map((p, i) => (
                <div key={i} className="rounded-lg bg-red-950/20 border border-red-500/20 px-3 py-2">
                  <code className="text-xs text-red-300 block">{p.path}</code>
                  <p className="text-xs text-gray-500 mt-0.5">{p.attack_vector}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reachable assets */}
        {sorted.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Reachable Assets ({sorted.length})
            </h4>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {sorted.map((a) => (
                <AssetRow key={`${a.asset_type}-${a.asset_id}`} asset={a} />
              ))}
            </div>
          </div>
        )}

        {/* Containment steps */}
        <div>
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Containment Steps</h4>
          <ol className="space-y-1.5">
            {result.containment_steps.map((step, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-300">
                <span className="shrink-0 w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Export placeholder */}
        <div className="pt-2 border-t border-gray-800 flex gap-2">
          <button disabled className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-600 cursor-not-allowed">
            Export Report
          </button>
          <button disabled className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-600 cursor-not-allowed">
            Create Ticket
          </button>
        </div>
      </div>
    </div>
  )
}
