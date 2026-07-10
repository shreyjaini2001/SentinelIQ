import { useState } from 'react'
import { clsx } from 'clsx'
import type { ClientTriageResult, EnrichedTriageVerdict, AlertStatus } from '../../types/alerts'
import { useAlertStore } from '../../stores/alertStore'
import { buildStatusChanges } from '../../utils/alertTriageEngine'

const SEV_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-amber-500',
  low:      'bg-gray-500',
}

const SEV_TEXT: Record<string, string> = {
  critical: 'text-red-400',
  high:     'text-orange-400',
  medium:   'text-amber-400',
  low:      'text-gray-400',
}


function DispositionBadge({ tp }: { tp: number }) {
  if (tp >= 70) return (
    <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 font-mono font-semibold shrink-0">
      LIKELY TP
    </span>
  )
  if (tp < 35) return (
    <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-700/60 text-gray-400 border border-gray-600/40 font-mono font-semibold shrink-0">
      LIKELY FP
    </span>
  )
  return (
    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono font-semibold shrink-0">
      UNCERTAIN
    </span>
  )
}

function ConfidencePip({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const cls = confidence === 'high' ? 'bg-emerald-400' : confidence === 'medium' ? 'bg-amber-400' : 'bg-gray-600'
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${cls} shrink-0`} />
}

function VerdictRow({
  verdict,
  onOverride,
}: {
  verdict: EnrichedTriageVerdict
  onOverride: (id: string, status: AlertStatus) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [applied, setApplied] = useState(false)

  const isTP = verdict.tp_probability >= 70
  const isFP = verdict.tp_probability < 35
  const borderColor = isTP ? 'border-l-red-500/60' : isFP ? 'border-l-gray-600/40' : 'border-l-amber-500/60'

  function handleOverride(status: AlertStatus) {
    onOverride(verdict.alert_id, status)
    setApplied(true)
  }

  return (
    <div
      className={clsx(
        'px-4 py-3 border-l-2 hover:bg-gray-800/20 transition-colors',
        borderColor,
        applied && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Severity dot */}
        <div className={clsx('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', SEV_DOT[verdict.severity])} />

        <div className="flex-1 min-w-0">
          {/* Alert name row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-200 truncate">{verdict.alertName}</span>
            <code className="text-[10px] text-gray-600 font-mono shrink-0">{verdict.alert_id}</code>
          </div>

          {/* Entity + disposition row */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={clsx('text-[10px] font-semibold uppercase tracking-wide shrink-0', SEV_TEXT[verdict.severity])}>
              {verdict.severity}
            </span>
            <span className="text-[10px] text-gray-500 font-mono truncate">{verdict.entity}</span>
            <DispositionBadge tp={verdict.tp_probability} />
          </div>

          {/* TP probability bar */}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-gray-600 font-mono w-5">TP</span>
            <div className="flex-1 h-1.5 rounded-full bg-gray-800/80 overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full opacity-70',
                  isTP ? 'bg-red-500' : isFP ? 'bg-gray-600' : 'bg-amber-500',
                )}
                style={{ width: `${verdict.tp_probability}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 font-mono tabular-nums w-8 text-right">
              {verdict.tp_probability}%
            </span>
            <ConfidencePip confidence={verdict.confidence} />
          </div>

          {/* Recommended action — always visible */}
          <div className="flex items-start gap-1.5 mt-1.5">
            <span className="text-[10px] text-gray-600 uppercase tracking-wider shrink-0 mt-px">Rec</span>
            <span className="text-[10px] text-gray-400 leading-snug">{verdict.recommendedAction}</span>
          </div>

          {/* Expanded reasoning */}
          {expanded && (
            <div className="mt-2.5 space-y-2">
              <p className="text-xs text-gray-300 leading-relaxed">{verdict.reasoning}</p>
              {verdict.influencing_fields.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-gray-600 uppercase tracking-wider">Key fields</span>
                  {verdict.influencing_fields.map((f) => (
                    <code
                      key={f}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono"
                    >
                      {f}
                    </code>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Per-alert action row */}
          {!applied && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <button
                onClick={() => handleOverride('investigating')}
                className="text-[10px] px-2 py-1 rounded border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-colors"
              >
                Mark Investigating
              </button>
              <button
                onClick={() => handleOverride('false_positive')}
                className="text-[10px] px-2 py-1 rounded border border-gray-600/40 text-gray-500 hover:bg-gray-700/40 transition-colors"
              >
                Mark FP
              </button>
              <button
                onClick={() => handleOverride('closed')}
                className="text-[10px] px-2 py-1 rounded border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 transition-colors"
              >
                Close
              </button>
            </div>
          )}
          {applied && (
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-[10px] text-emerald-400">✓ Status updated in alert store</span>
            </div>
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-gray-600 hover:text-blue-400 transition-colors shrink-0 mt-1"
        >
          {expanded ? '▴' : '▾'}
        </button>
      </div>
    </div>
  )
}

interface Props {
  result: ClientTriageResult
}

const TOP_N = 12

/** Human-readable scope sentence — always states what was processed and what is shown. */
function scopeSummary(result: ClientTriageResult, shown: number): string {
  const n = result.total_alerts
  const plural = n === 1 ? '' : 's'
  const base =
    result.scope.scope === 'selected'
      ? `Triaged ${n} selected alert${plural}.`
      : result.scope.scope === 'visible_open'
      ? `Triaged ${n} visible open alert${plural} from the current page.`
      : `Triaged ${n} open alert${plural}.`
  const tail = n > shown ? ` Showing top ${shown} by risk.` : ''
  return base + tail
}

export function TriageResultPanel({ result }: Props) {
  const { applyStatusChange } = useAlertStore()
  const [applied, setApplied] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const displayedVerdicts = showAll ? result.verdicts : result.verdicts.slice(0, TOP_N)
  const shownCount = Math.min(TOP_N, result.verdicts.length)

  function handleOverride(id: string, status: AlertStatus) {
    applyStatusChange([id], status)
  }

  function applyAll() {
    const changes = buildStatusChanges(result)
    if (changes.investigating.length > 0)
      applyStatusChange(changes.investigating, 'investigating')
    if (changes.false_positive.length > 0)
      applyStatusChange(changes.false_positive, 'false_positive')
    setApplied(true)
  }

  return (
    <div data-testid="triage-result-panel" className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/50 bg-gray-900/60">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full bg-red-500/70" />
          <span className="text-sm font-semibold text-white tracking-tight">Alert Triage</span>
          <span className="px-2 py-0.5 rounded-md text-xs border text-purple-400 border-purple-500/40 bg-purple-500/10 font-mono">
            {result.scope.scopeLabel}
          </span>
          <span className="text-xs text-gray-600 font-mono">Mock · External: Off</span>
        </div>
        <span className="text-xs text-gray-500 font-mono">
          {result.total_alerts} alerts · {result.duration_ms}ms
        </span>
      </div>

      {/* Scope summary — always states scope processed + count shown */}
      <div className="px-4 pt-3 pb-2 border-b border-gray-800/60">
        <p className="text-xs text-gray-300">{scopeSummary(result, shownCount)}</p>
        <p className="text-[10px] text-gray-600 mt-0.5">
          {result.scope.totalInScope} in scope · {result.scope.processedCount} processed · ranked by true-positive probability · Mock · External: Off
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b border-gray-800/60">
        <div className="rounded-lg bg-red-500/8 border border-red-500/20 px-3 py-2.5 text-center">
          <div className="text-2xl font-bold text-red-400 font-mono">{result.likely_tp}</div>
          <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Likely TP</div>
          <div className="text-[9px] text-gray-600 mt-0.5">escalate →</div>
        </div>
        <div className="rounded-lg bg-amber-500/8 border border-amber-500/20 px-3 py-2.5 text-center">
          <div className="text-2xl font-bold text-amber-400 font-mono">{result.uncertain}</div>
          <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Uncertain</div>
          <div className="text-[9px] text-gray-600 mt-0.5">review →</div>
        </div>
        <div className="rounded-lg bg-gray-800/60 border border-gray-700/40 px-3 py-2.5 text-center">
          <div className="text-2xl font-bold text-gray-400 font-mono">{result.likely_fp}</div>
          <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Likely FP</div>
          <div className="text-[9px] text-gray-600 mt-0.5">suppress →</div>
        </div>
      </div>

      {/* Verdict list */}
      <div className="divide-y divide-gray-800/40">
        {displayedVerdicts.map((verdict) => (
          <VerdictRow
            key={verdict.alert_id}
            verdict={verdict}
            onOverride={handleOverride}
          />
        ))}
      </div>

      {/* Load more */}
      {result.verdicts.length > TOP_N && !showAll && (
        <div className="px-4 py-2.5 border-t border-gray-800/60 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Show all {result.verdicts.length} verdicts ↓
          </button>
        </div>
      )}
      {result.verdicts.length > TOP_N && showAll && (
        <div className="px-4 py-2.5 border-t border-gray-800/60 text-center">
          <button
            onClick={() => setShowAll(false)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Show top {TOP_N} only ↑
          </button>
        </div>
      )}

      {/* Apply triage decisions footer */}
      <div className="px-4 py-3 border-t border-gray-700/50 bg-gray-900/40 flex items-center justify-between gap-3">
        <div className="text-[10px] text-gray-600 leading-relaxed">
          {applied
            ? '✓ Triage decisions applied to alert store'
            : `Apply will mark ${result.likely_tp} as Investigating and ${result.likely_fp} as False Positive`
          }
        </div>
        {!applied && (
          <button
            onClick={applyAll}
            className="px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-medium hover:bg-purple-600/30 transition-colors shrink-0"
          >
            Apply Triage Decisions
          </button>
        )}
      </div>
    </div>
  )
}
