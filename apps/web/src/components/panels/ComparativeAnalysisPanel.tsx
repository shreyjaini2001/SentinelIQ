import type { ComparativeResult, DeviationMetric } from '../../types'

interface Props {
  result: ComparativeResult
}

function DeviationBar({ metric }: { metric: DeviationMetric }) {
  const pct = Math.min(Math.abs(metric.deviation_pct), 500)
  const isPositive = metric.deviation_pct > 0
  const barWidth = Math.min(100, (pct / 500) * 100)
  const barColor = metric.anomaly
    ? isPositive ? 'bg-red-500' : 'bg-blue-400'
    : 'bg-gray-600'
  const textColor = metric.anomaly ? (isPositive ? 'text-red-400' : 'text-blue-400') : 'text-gray-500'

  return (
    <div className={`rounded-lg px-3 py-2 space-y-1.5 ${metric.anomaly ? 'bg-red-950/15 border border-red-500/15' : 'bg-gray-800/20 border border-gray-700/20'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {metric.anomaly && (
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          )}
          <span className="text-xs text-gray-300 truncate font-medium">{metric.metric_name}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-xs">
          <span className="text-gray-600 tabular-nums">base: {metric.baseline_value}</span>
          <span className="font-mono text-gray-200 tabular-nums font-medium">{metric.current_value}</span>
          <span className={`tabular-nums font-semibold font-mono ${textColor}`}>
            {metric.deviation_pct > 0 ? '+' : ''}{metric.deviation_pct.toFixed(1)}%
          </span>
          <span className="text-gray-600 tabular-nums font-mono">σ{metric.sigma}</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  )
}

export function ComparativeAnalysisPanel({ result }: Props) {
  const anomalies = result.metrics.filter((m) => m.anomaly)
  const scoreColor = result.overall_deviation_score >= 70 ? 'text-red-400'
    : result.overall_deviation_score >= 40 ? 'text-orange-400'
    : 'text-emerald-400'
  const percentileColor = result.peer_percentile >= 95 ? 'text-red-400' : result.peer_percentile >= 80 ? 'text-orange-400' : 'text-emerald-400'

  return (
    <div data-testid="comparative-panel" className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/50 bg-gray-900/60">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full bg-purple-500/70" />
          <span className="text-sm font-semibold text-white tracking-tight">Behavioral Analysis</span>
          <code className="text-xs text-purple-300 font-mono bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">{result.entity}</code>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-mono bg-gray-800/60 border border-gray-700/40 px-2 py-0.5 rounded-md">{result.comparison_window}</span>
          <span className="font-mono">{result.duration_ms}ms</span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Key stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 px-4 py-3.5 text-center">
            <div className={`text-3xl font-bold font-mono ${scoreColor}`}>{result.overall_deviation_score}</div>
            <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Deviation Score</div>
            <div className="text-[10px] text-gray-700 mt-0.5">/100</div>
          </div>
          <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 px-4 py-3.5 text-center">
            <div className={`text-3xl font-bold font-mono ${percentileColor}`}>{result.peer_percentile}<span className="text-base">th</span></div>
            <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Peer Percentile</div>
            <div className="text-[10px] text-gray-700 mt-0.5">more anomalous than {result.peer_percentile}% of peers</div>
          </div>
          <div className={`rounded-xl border px-4 py-3.5 text-center ${anomalies.length > 0 ? 'bg-red-950/20 border-red-500/20' : 'bg-emerald-950/20 border-emerald-500/20'}`}>
            <div className={`text-3xl font-bold font-mono ${anomalies.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {anomalies.length}
            </div>
            <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Anomalies</div>
            <div className="text-[10px] text-gray-700 mt-0.5">of {result.metrics.length} metrics</div>
          </div>
        </div>

        {/* Metrics */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-0.5 h-3 rounded-full bg-purple-500/60" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Metric Deviations</span>
            {anomalies.length > 0 && (
              <span className="ml-auto text-[10px] font-mono text-red-400">{anomalies.length} anomal{anomalies.length === 1 ? 'y' : 'ies'}</span>
            )}
          </div>
          <div className="space-y-2">
            {result.metrics.map((m) => (
              <DeviationBar key={m.metric_name} metric={m} />
            ))}
          </div>
        </div>

        {/* Narrative */}
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-0.5 h-3 rounded-full bg-gray-500/40" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Analyst Narrative</span>
          </div>
          <div className="rounded-lg bg-gray-800/30 border border-gray-700/40 px-4 py-3">
            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{result.narrative}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
