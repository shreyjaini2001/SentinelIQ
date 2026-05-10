import type { NoiseCoachingResult, FPCluster, TuningRecommendation } from '../../types'

interface Props {
  result: NoiseCoachingResult
}

function FPRateBar({ label, rate, color }: { label: string; rate: number; color: string }) {
  const pct = Math.round(rate * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-300 shrink-0 w-8 text-right">{pct}%</span>
    </div>
  )
}

function ClusterCard({ cluster }: { cluster: FPCluster }) {
  return (
    <div className="rounded-lg bg-gray-800/40 border border-gray-700/30 px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-300">{cluster.description}</span>
        <span className="text-xs font-mono text-gray-500">{cluster.alert_count} alerts</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(cluster.representative_fields).map(([k, v]) => (
          <span key={k} className="text-xs font-mono text-gray-500">
            <span className="text-gray-600">{k}=</span>
            <span className="text-cyan-400/70">{v}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function RecommendationRow({ rec, index }: { rec: TuningRecommendation; index: number }) {
  const pct = Math.round(rec.estimated_reduction_pct * 100)
  return (
    <div className="flex gap-3 rounded-lg bg-gray-800/30 border border-gray-700/20 px-3 py-2">
      <span className="text-emerald-400 font-mono text-xs shrink-0 w-4 pt-0.5">{index + 1}.</span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-cyan-300">{rec.field_name}</span>
          <span className="text-xs text-gray-600">→</span>
          <span className="text-xs font-mono text-gray-300">{rec.suggested_condition}</span>
          <span className="ml-auto text-xs font-mono text-emerald-400 shrink-0">-{pct}%</span>
        </div>
        <div className="text-xs text-gray-500">{rec.rationale}</div>
      </div>
    </div>
  )
}

export function NoiseCoachingPanel({ result }: Props) {
  const reduction = Math.round(result.estimated_alert_reduction_pct * 100)

  return (
    <div data-testid="noise-coaching-panel" className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-gray-900/50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">Noise Coaching</span>
          <span className="px-2 py-0.5 rounded text-xs border text-amber-400 border-amber-500/30 bg-amber-500/10 font-mono">
            {result.rule_name}
          </span>
        </div>
        <span className="text-xs text-gray-500">{result.duration_ms}ms</span>
      </div>

      <div className="p-4 space-y-5">
        {/* Summary row */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-red-400 font-mono font-medium">{Math.round(result.current_fp_rate * 100)}%</span>
            <span className="text-gray-500">current FP rate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-mono font-medium">-{reduction}%</span>
            <span className="text-gray-500">est. reduction</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-300 font-mono font-medium">{result.fp_clusters.length}</span>
            <span className="text-gray-500">FP clusters</span>
          </div>
        </div>

        {/* Before / after FP rate */}
        <div className="rounded-lg bg-gray-800/50 border border-gray-700/40 p-3 space-y-2">
          <div className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">FP Rate Comparison</div>
          <FPRateBar label="Before" rate={result.before_fp_rate} color="bg-red-500" />
          <FPRateBar label="After" rate={result.after_fp_rate} color="bg-emerald-500" />
        </div>

        {/* Top FP fields */}
        {result.top_fp_fields.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Top FP-Contributing Fields</div>
            <div className="flex flex-wrap gap-1.5">
              {result.top_fp_fields.map((f, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-xs font-mono border text-cyan-400 border-cyan-500/30 bg-cyan-500/10">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* FP Clusters */}
        {result.fp_clusters.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
              FP Clusters ({result.fp_clusters.length})
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
            <div className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Tuning Recommendations</div>
            <div className="space-y-1.5">
              {result.tuning_recommendations.map((rec, i) => (
                <RecommendationRow key={rec.recommendation_id} rec={rec} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Impact preview */}
        <div className="rounded-lg bg-emerald-950/20 border border-emerald-700/30 p-3">
          <div className="text-xs font-medium text-emerald-400 mb-1.5 uppercase tracking-wider">Impact Preview</div>
          <p className="text-sm text-gray-200 leading-relaxed">{result.impact_preview}</p>
        </div>

        {/* Rollback notes */}
        <div className="rounded-lg bg-gray-800/40 border border-gray-700/30 p-3">
          <div className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Rollback Notes</div>
          <p className="text-sm text-gray-400 leading-relaxed">{result.rollback_notes}</p>
        </div>
      </div>
    </div>
  )
}
