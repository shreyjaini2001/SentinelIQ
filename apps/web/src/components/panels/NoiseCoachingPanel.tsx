import type { NoiseCoachingResult, FPCluster, TuningRecommendation } from '../../types'

interface Props {
  result: NoiseCoachingResult
}

function FPRateBar({ label, rate, color, bg }: { label: string; rate: number; color: string; bg: string }) {
  const pct = Math.round(rate * 100)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400 font-medium">{label}</span>
        <span className={`font-bold font-mono ${color}`}>{pct}%</span>
      </div>
      <div className={`h-2.5 rounded-full overflow-hidden ${bg}`}>
        <div className={`h-full rounded-full ${color.replace('text-', 'bg-')} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function ClusterCard({ cluster }: { cluster: FPCluster }) {
  return (
    <div className="rounded-lg bg-gray-800/30 border border-gray-700/30 px-3.5 py-2.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-300">{cluster.description}</span>
        <span className="text-xs font-mono text-gray-500 shrink-0 ml-2">{cluster.alert_count} alerts</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(cluster.representative_fields).map(([k, v]) => (
          <span key={k} className="text-[10px] font-mono bg-gray-900/60 border border-gray-700/40 px-2 py-0.5 rounded text-gray-400">
            <span className="text-gray-600">{k}=</span><span className="text-cyan-400/80">{v}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function RecommendationRow({ rec, index }: { rec: TuningRecommendation; index: number }) {
  const pct = Math.round(rec.estimated_reduction_pct * 100)
  return (
    <div className="flex gap-3 rounded-lg bg-gray-800/30 border border-gray-700/20 px-3.5 py-2.5">
      <span className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <code className="text-xs font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded">{rec.field_name}</code>
          <span className="text-xs text-gray-600 font-mono">→</span>
          <code className="text-xs font-mono text-gray-300 bg-gray-800/60 border border-gray-700/40 px-1.5 py-0.5 rounded">{rec.suggested_condition}</code>
          <span className="ml-auto text-xs font-bold font-mono text-emerald-400 shrink-0">-{pct}%</span>
        </div>
        <div className="text-xs text-gray-500 leading-relaxed">{rec.rationale}</div>
      </div>
    </div>
  )
}

export function NoiseCoachingPanel({ result }: Props) {
  const reduction = Math.round(result.estimated_alert_reduction_pct * 100)
  const beforePct = Math.round(result.before_fp_rate * 100)
  const afterPct = Math.round(result.after_fp_rate * 100)

  return (
    <div data-testid="noise-coaching-panel" className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/50 bg-gray-900/60">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full bg-amber-500/70" />
          <span className="text-sm font-semibold text-white tracking-tight">Noise Reduction Coaching</span>
          <span className="px-2 py-0.5 rounded-md text-xs border text-amber-400 border-amber-500/40 bg-amber-500/10 font-mono font-medium">
            {result.rule_name}
          </span>
        </div>
        <span className="text-xs text-gray-500 font-mono">{result.duration_ms}ms</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-red-950/25 border border-red-500/20 px-3 py-2.5 text-center">
            <div className="text-2xl font-bold text-red-400 font-mono">{Math.round(result.current_fp_rate * 100)}%</div>
            <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Current FP Rate</div>
          </div>
          <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/20 px-3 py-2.5 text-center">
            <div className="text-2xl font-bold text-emerald-400 font-mono">-{reduction}%</div>
            <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Est. Reduction</div>
          </div>
          <div className="rounded-lg bg-gray-800/60 border border-gray-700/40 px-3 py-2.5 text-center">
            <div className="text-2xl font-bold text-gray-300 font-mono">{result.fp_clusters.length}</div>
            <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">FP Clusters</div>
          </div>
        </div>

        {/* Before / after comparison */}
        <div className="rounded-lg bg-gray-800/40 border border-gray-700/40 p-4 space-y-3">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-0.5 h-3 rounded-full bg-amber-500/60" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">FP Rate — Before vs. After Tuning</span>
          </div>
          <FPRateBar label="Before" rate={result.before_fp_rate} color="text-red-400" bg="bg-red-950/30" />
          <FPRateBar label="After" rate={result.after_fp_rate} color="text-emerald-400" bg="bg-emerald-950/30" />
          <div className="text-center">
            <span className="text-xs text-gray-500">
              {beforePct}% → {afterPct}% FP rate
              <span className="text-emerald-400 font-semibold ml-2">({beforePct - afterPct} pp improvement)</span>
            </span>
          </div>
        </div>

        {/* Top FP fields */}
        {result.top_fp_fields.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-0.5 h-3 rounded-full bg-cyan-500/60" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Top FP-Contributing Fields</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.top_fp_fields.map((f, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md text-xs font-mono border text-cyan-400 border-cyan-500/30 bg-cyan-500/10">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* FP Clusters */}
        {result.fp_clusters.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-0.5 h-3 rounded-full bg-orange-500/60" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">FP Clusters</span>
              <span className="ml-auto text-[10px] font-mono text-gray-600">{result.fp_clusters.length} clusters</span>
            </div>
            <div className="space-y-1.5">
              {result.fp_clusters.map((c) => (
                <ClusterCard key={c.cluster_id} cluster={c} />
              ))}
            </div>
          </div>
        )}

        {/* Tuning recommendations */}
        {result.tuning_recommendations.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-0.5 h-3 rounded-full bg-emerald-500/60" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Tuning Recommendations</span>
            </div>
            <div className="space-y-1.5">
              {result.tuning_recommendations.map((rec, i) => (
                <RecommendationRow key={rec.recommendation_id} rec={rec} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Impact preview */}
        <div className="rounded-lg bg-emerald-950/20 border border-emerald-700/25 p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-0.5 h-3 rounded-full bg-emerald-500/60" />
            <span className="text-[10px] font-semibold text-emerald-500/80 uppercase tracking-widest">Impact Preview</span>
          </div>
          <p className="text-sm text-gray-200 leading-relaxed">{result.impact_preview}</p>
        </div>

        {/* Rollback notes */}
        <div className="rounded-lg bg-gray-800/30 border border-gray-700/30 p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-0.5 h-3 rounded-full bg-gray-500/40" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Rollback Plan</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">{result.rollback_notes}</p>
        </div>
      </div>
    </div>
  )
}
