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
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {metric.anomaly && (
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-400" />
          )}
          <span className="text-xs text-gray-300 truncate">{metric.metric_name}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-xs">
          <span className="text-gray-500 tabular-nums">baseline: {metric.baseline_value}</span>
          <span className="font-mono text-gray-200 tabular-nums">{metric.current_value}</span>
          <span className={`tabular-nums font-medium ${textColor}`}>
            {metric.deviation_pct > 0 ? '+' : ''}{metric.deviation_pct.toFixed(1)}%
          </span>
          <span className="text-gray-600 tabular-nums">σ {metric.sigma}</span>
        </div>
      </div>
      <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  )
}

function PercentileGauge({ percentile }: { percentile: number }) {
  const color = percentile >= 95 ? 'text-red-400' : percentile >= 80 ? 'text-orange-400' : 'text-green-400'
  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${color}`}>{percentile}th</div>
      <div className="text-xs text-gray-500 mt-0.5">peer percentile</div>
      <div className="text-[10px] text-gray-600 mt-0.5">more anomalous than {percentile}% of peers</div>
    </div>
  )
}

export function ComparativeAnalysisPanel({ result }: Props) {
  const anomalies = result.metrics.filter((m) => m.anomaly)
  const scoreColor = result.overall_deviation_score >= 70 ? 'text-red-400'
    : result.overall_deviation_score >= 40 ? 'text-orange-400'
    : 'text-green-400'

  return (
    <div data-testid="comparative-panel" className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-gray-900/50">
        <div>
          <span className="text-sm font-medium text-white">Behavioral Analysis</span>
          <span className="text-xs text-gray-500 ml-2">{result.entity}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>Window: {result.comparison_window}</span>
          <span>{result.duration_ms}ms</span>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Score row */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className={`text-3xl font-bold ${scoreColor}`}>{result.overall_deviation_score}</div>
            <div className="text-xs text-gray-500 mt-0.5">deviation score</div>
            <div className="text-[10px] text-gray-600">/100</div>
          </div>
          <div className="h-12 w-px bg-gray-800" />
          <PercentileGauge percentile={result.peer_percentile} />
          <div className="h-12 w-px bg-gray-800" />
          <div className="text-center">
            <div className={`text-3xl font-bold ${anomalies.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {anomalies.length}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">anomalies</div>
            <div className="text-[10px] text-gray-600">of {result.metrics.length} metrics</div>
          </div>
        </div>

        {/* Metrics */}
        <div>
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Metric Deviations</h4>
          <div className="space-y-3">
            {result.metrics.map((m) => (
              <DeviationBar key={m.metric_name} metric={m} />
            ))}
          </div>
        </div>

        {/* Narrative */}
        <div>
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Analyst Narrative</h4>
          <div className="rounded-lg bg-gray-800/40 border border-gray-700/40 px-3 py-3">
            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{result.narrative}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
