import { useState } from 'react'
import { clsx } from 'clsx'
import { useAlertStore } from '../../stores/alertStore'
import { useInvestigationStore } from '../../stores/investigationStore'
import { AlertStatusActions } from './AlertStatusActions'
import { ActiveCaseSelector } from '../common/ActiveCaseSelector'
import { SEV_CONFIG, STATUS_LABEL } from './alertStyles'
import type { ClientTriageResult, EnrichedTriageVerdict, AlertStatus } from '../../types/alerts'

const TOP_N = 25

interface ApplySummary {
  investigating: number
  false_positive: number
  closed: number
  suppressed: number
  linked: number
  caseTitle?: string
}

function DispositionBadge({ disp }: { disp: EnrichedTriageVerdict['triageDisposition'] }) {
  const cfg =
    disp === 'likely_tp' ? 'bg-red-500/15 text-red-400 border-red-500/30'
    : disp === 'likely_fp' ? 'bg-gray-700/60 text-gray-400 border-gray-600/40'
    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  const label = disp === 'likely_tp' ? 'LIKELY TP' : disp === 'likely_fp' ? 'LIKELY FP' : 'UNCERTAIN'
  return <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border shrink-0', cfg)}>{label}</span>
}

function scopeSummary(result: ClientTriageResult, shown: number): string {
  const n = result.total_alerts
  const plural = n === 1 ? '' : 's'
  const base =
    result.scope.scope === 'selected' ? `Triaged ${n} selected alert${plural}.`
    : result.scope.scope === 'visible_open' ? `Triaged ${n} visible open alert${plural} from the current page.`
    : `Triaged ${n} open alert${plural}.`
  return base + (n > shown ? ` Showing top ${shown} by risk.` : '')
}

function DecisionRow({
  verdict,
  decision,
  onDecide,
  onOpenAlert,
}: {
  verdict: EnrichedTriageVerdict
  decision: AlertStatus
  onDecide: (status: AlertStatus) => void
  onOpenAlert: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const sev = SEV_CONFIG[verdict.severity]
  const willChange = decision !== verdict.currentStatus

  return (
    <div className="px-4 py-3 border-l-2 border-gray-700/30 hover:bg-gray-800/20 transition-colors">
      <div className="flex items-start gap-2.5">
        <div className={clsx('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', sev.dot)} />
        <div className="flex-1 min-w-0">
          {/* Name + id */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-200 truncate">{verdict.alertName}</span>
            <code className="text-[10px] text-gray-600 font-mono shrink-0">{verdict.alert_id}</code>
            <button onClick={onOpenAlert} className="text-[10px] text-blue-400 hover:text-blue-300 shrink-0">Open Alert →</button>
          </div>

          {/* Entity + disposition */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={clsx('text-[10px] font-semibold uppercase', sev.color)}>{verdict.severity}</span>
            <span className="text-[10px] text-gray-500 font-mono truncate">{verdict.entity}</span>
            <DispositionBadge disp={verdict.triageDisposition} />
            <span className="text-[10px] text-gray-500">TP {verdict.tp_probability}% · {verdict.confidence}</span>
          </div>

          {/* Current → decision */}
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px]">
            <span className="text-gray-600">Status:</span>
            <span className="text-gray-400">{STATUS_LABEL[verdict.currentStatus]}</span>
            <span className="text-gray-600">→</span>
            <span className={clsx('font-medium', willChange ? 'text-blue-300' : 'text-gray-500')}>
              {STATUS_LABEL[decision]}
              {!willChange && (
                verdict.currentStatus === 'open'
                  ? ' (no change)'
                  : ` — already ${STATUS_LABEL[verdict.currentStatus]}, no change recommended`
              )}
            </span>
          </div>

          {/* Recommended action */}
          <div className="flex items-start gap-1.5 mt-1">
            <span className="text-[10px] text-gray-600 uppercase tracking-wider shrink-0 mt-px">Rec</span>
            <span className="text-[10px] text-gray-400">{verdict.recommendedAction}</span>
          </div>

          {/* Expanded: reason + evidence + next actions */}
          {expanded && (
            <div className="mt-2.5 space-y-2">
              <p className="text-xs text-gray-300 leading-relaxed">{verdict.reasoning}</p>
              {verdict.influencing_fields.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-gray-600 uppercase tracking-wider">Evidence used</span>
                  {verdict.influencing_fields.map((f) => (
                    <code key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono">{f}</code>
                  ))}
                </div>
              )}
              {verdict.recommendedNextActions.length > 0 && (
                <div>
                  <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Recommended next actions</div>
                  <ul className="space-y-0.5">
                    {verdict.recommendedNextActions.map((a, i) => (
                      <li key={i} className="text-[11px] text-gray-400 flex items-start gap-1.5">
                        <span className="text-purple-400/70 mt-px">→</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Decision buttons */}
          <div className="mt-2">
            <AlertStatusActions
              currentStatus={verdict.currentStatus}
              selected={decision}
              onSet={onDecide}
              showKeepOpen
            />
          </div>
        </div>

        <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-gray-600 hover:text-blue-400 shrink-0 mt-1">
          {expanded ? '▴' : '▾'}
        </button>
      </div>
    </div>
  )
}

interface Props {
  result: ClientTriageResult
  onClose: () => void
  onOpenAlert: (alertId: string) => void
}

export function AlertTriageWorkspace({ result, onClose, onOpenAlert }: Props) {
  const { applyStatusChange, linkAlertsToCase } = useAlertStore()
  const { investigations, activeInvestigationId } = useInvestigationStore()

  const [decisions, setDecisions] = useState<Record<string, AlertStatus>>(() => {
    const init: Record<string, AlertStatus> = {}
    for (const v of result.verdicts) init[v.alert_id] = v.suggestedStatus
    return init
  })
  const [showAll, setShowAll] = useState(false)
  const [linkCaseId, setLinkCaseId] = useState<string | null>(activeInvestigationId)
  const [doLinkTP, setDoLinkTP] = useState<boolean>(!!activeInvestigationId)
  const [applied, setApplied] = useState<ApplySummary | null>(null)

  const shown = Math.min(TOP_N, result.verdicts.length)
  const displayed = showAll ? result.verdicts : result.verdicts.slice(0, TOP_N)
  const linkCase = investigations.find((i) => i.id === linkCaseId)

  // Preview of pending changes (decision differs from current status)
  const pending: Record<AlertStatus, number> = { open: 0, investigating: 0, acknowledged: 0, closed: 0, suppressed: 0, false_positive: 0, escalated: 0 }
  for (const v of result.verdicts) {
    const d = decisions[v.alert_id]
    if (d && d !== v.currentStatus) pending[d]++
  }
  const pendingTotal = Object.values(pending).reduce((a, b) => a + b, 0)
  const tpToLink = result.verdicts.filter((v) => decisions[v.alert_id] === 'investigating').length
  const willLink = doLinkTP && !!linkCase && tpToLink > 0
  const canApply = pendingTotal > 0 || willLink

  function setDecision(id: string, status: AlertStatus) {
    setDecisions((prev) => ({ ...prev, [id]: status }))
  }

  function apply() {
    const groups: Partial<Record<AlertStatus, string[]>> = {}
    for (const v of result.verdicts) {
      const d = decisions[v.alert_id]
      if (d && d !== v.currentStatus) (groups[d] ??= []).push(v.alert_id)
    }
    for (const [status, ids] of Object.entries(groups)) {
      applyStatusChange(ids as string[], status as AlertStatus, 'triage decision')
    }
    let linked = 0
    if (doLinkTP && linkCase) {
      const tpIds = result.verdicts.filter((v) => decisions[v.alert_id] === 'investigating').map((v) => v.alert_id)
      if (tpIds.length) {
        linkAlertsToCase(tpIds, linkCase.id, linkCase.title)
        linked = tpIds.length
      }
    }
    setApplied({
      investigating: groups.investigating?.length ?? 0,
      false_positive: groups.false_positive?.length ?? 0,
      closed: groups.closed?.length ?? 0,
      suppressed: groups.suppressed?.length ?? 0,
      linked,
      caseTitle: linkCase?.title,
    })
  }

  return (
    <div data-testid="alert-triage-workspace" className="rounded-xl border border-purple-500/30 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700/50 bg-gray-900/60">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full bg-purple-500/70" />
          <span className="text-sm font-semibold text-white tracking-tight">Alert Triage Workspace</span>
          <span className="px-2 py-0.5 rounded-md text-[10px] border text-purple-400 border-purple-500/40 bg-purple-500/10 font-mono">
            {result.scope.scopeLabel}
          </span>
          <span className="text-[10px] text-gray-600 font-mono">Mock · External: Off</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors">← Back to alert list</button>
          <button onClick={onClose} title="Close triage" className="text-gray-500 hover:text-gray-200 text-sm leading-none px-1.5 py-0.5 rounded hover:bg-gray-800/60 transition-colors">✕</button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Scope + disclaimer */}
        <div>
          <p className="text-xs text-gray-300">{scopeSummary(result, shown)}</p>
          <p className="text-[10px] text-gray-600 mt-0.5 leading-relaxed">
            Triage classifies and routes alerts — it does not remediate. Marking an alert Investigating does not
            mean the account/system is clean; only Close / False Positive / Suppress resolve an alert. Nothing here
            auto-closes or auto-suppresses; every decision below is applied only when you click Apply.
          </p>
        </div>

        {/* Confirmation (after apply) */}
        {applied && (
          <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3">
            <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest mb-1.5">Applied Triage Decisions</div>
            <ul className="text-xs text-gray-300 space-y-0.5">
              <li>{applied.investigating} alert{applied.investigating === 1 ? '' : 's'} marked Investigating</li>
              <li>{applied.false_positive} alert{applied.false_positive === 1 ? '' : 's'} marked False Positive</li>
              <li>{applied.closed} alert{applied.closed === 1 ? '' : 's'} closed</li>
              <li>{applied.suppressed} alert{applied.suppressed === 1 ? '' : 's'} suppressed</li>
              {applied.linked > 0 && <li>{applied.linked} true-positive alert{applied.linked === 1 ? '' : 's'} linked to {applied.caseTitle}</li>}
            </ul>
            <p className="text-[10px] text-gray-500 mt-1.5">
              No alerts were removed from the system. Resolved alerts leave the Open view but remain under All and their status filter.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-red-500/8 border border-red-500/20 px-3 py-2 text-center">
            <div className="text-xl font-bold text-red-400 font-mono">{result.likely_tp}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Likely TP</div>
          </div>
          <div className="rounded-lg bg-amber-500/8 border border-amber-500/20 px-3 py-2 text-center">
            <div className="text-xl font-bold text-amber-400 font-mono">{result.uncertain}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Uncertain</div>
          </div>
          <div className="rounded-lg bg-gray-800/60 border border-gray-700/40 px-3 py-2 text-center">
            <div className="text-xl font-bold text-gray-400 font-mono">{result.likely_fp}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Likely FP</div>
          </div>
        </div>

        {/* Case linking */}
        <div className="rounded-lg border border-gray-700/40 bg-gray-800/20 px-3 py-2.5 flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-[11px] text-gray-300 cursor-pointer">
            <input type="checkbox" checked={doLinkTP} onChange={(e) => setDoLinkTP(e.target.checked)} className="rounded border-gray-600 bg-gray-800 text-blue-500" />
            Link true-positive alerts to case
          </label>
          <ActiveCaseSelector value={linkCaseId} onChange={setLinkCaseId} />
          {linkCase ? (
            <span className="text-[10px] text-gray-500">→ {tpToLink} TP alert{tpToLink === 1 ? '' : 's'} will link to {linkCase.title}</span>
          ) : (
            <span className="text-[10px] text-amber-500/80">No active case — create or select a case to link.</span>
          )}
        </div>

        {/* Verdict / decision list */}
        <div className="rounded-lg border border-gray-700/40 divide-y divide-gray-800/40 overflow-hidden">
          {displayed.map((v) => (
            <DecisionRow
              key={v.alert_id}
              verdict={v}
              decision={decisions[v.alert_id] ?? v.currentStatus}
              onDecide={(s) => setDecision(v.alert_id, s)}
              onOpenAlert={() => onOpenAlert(v.alert_id)}
            />
          ))}
        </div>
        {result.verdicts.length > TOP_N && (
          <button onClick={() => setShowAll(!showAll)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            {showAll ? `Show top ${TOP_N} only ↑` : `Show all ${result.verdicts.length} verdicts ↓`}
          </button>
        )}

        {/* Apply bar */}
        <div className="pt-2 border-t border-gray-700/50 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-[11px] text-gray-500 leading-relaxed">
            {applied ? (
              'Decisions applied. Adjust and apply again if needed.'
            ) : canApply ? (
              <>
                Will apply: <span className="text-orange-400">{pending.investigating} → Investigating</span>,{' '}
                <span className="text-gray-400">{pending.false_positive} → False Positive</span>,{' '}
                <span className="text-emerald-400">{pending.closed} → Closed</span>,{' '}
                <span className="text-purple-400">{pending.suppressed} → Suppressed</span>
                {willLink && <> · <span className="text-blue-400">{tpToLink} linked to {linkCase!.title}</span></>}
              </>
            ) : (
              <span className="text-gray-600">No pending triage changes. Adjust a decision above to enable Apply.</span>
            )}
          </div>
          <button
            onClick={apply}
            disabled={!canApply}
            className="px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-medium hover:bg-purple-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {applied ? 'Re-apply Triage Decisions' : 'Apply Triage Decisions'}
          </button>
        </div>
      </div>
    </div>
  )
}
