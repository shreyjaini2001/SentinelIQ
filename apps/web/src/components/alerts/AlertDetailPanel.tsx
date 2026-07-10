import { useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { useAlertStore } from '../../stores/alertStore'
import { AlertStatusActions } from './AlertStatusActions'
import { AlertAuditTrail } from './AlertAuditTrail'
import { AlertTriageRecommendation } from './AlertTriageRecommendation'
import { AlertCaseActions } from './AlertCaseActions'
import { SEV_CONFIG, STATUS_STYLE, STATUS_LABEL, RESOLVED_STATUSES } from './alertStyles'
import { triageAlerts } from '../../utils/alertTriageEngine'
import { getAlertNextActions } from '../../utils/alertNextActions'
import type { AlertStatus, EnrichedTriageVerdict } from '../../types/alerts'

interface Props {
  alertId: string
  /** Triage verdict for this alert if it was just batch-triaged; otherwise computed here. */
  verdict?: EnrichedTriageVerdict
  onClose: () => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest mb-0.5">{label}</div>
      <div className="text-xs text-gray-300">{children}</div>
    </div>
  )
}

function feedbackFor(status: AlertStatus, id: string): string {
  switch (status) {
    case 'investigating': return `Alert ${id} marked Investigating. This routes it for analysis; it does not remediate the host/account.`
    case 'closed':        return `Alert ${id} closed. It remains available under All and Closed.`
    case 'false_positive':return `Alert ${id} marked False Positive. Consider tuning the detection if repeated.`
    case 'suppressed':    return `Alert ${id} suppressed. It remains available under All and Suppressed.`
    case 'acknowledged':  return `Alert ${id} acknowledged.`
    case 'open':          return `Alert ${id} reopened and returned to the Open queue.`
    default:              return `Alert ${id} updated.`
  }
}

export function AlertDetailPanel({ alertId, verdict, onClose }: Props) {
  const alert = useAlertStore((s) => s.alerts).find((a) => a.id === alertId)
  const { applyStatusChange, undoLastAction } = useAlertStore()
  const [flash, setFlash] = useState<string | null>(null)

  // Compute a single-alert triage verdict on the fly when one wasn't handed in from batch,
  // so clicking any row gives full triage guidance without checkbox selection.
  const effectiveVerdict = useMemo(() => {
    if (verdict) return verdict
    if (!alert) return undefined
    return triageAlerts([alert], 'selected').verdicts[0]
  }, [verdict, alert])

  if (!alert) return null

  const sev = SEV_CONFIG[alert.severity]
  const nextActions = getAlertNextActions(alert)

  // Undo is available only if the latest status-change event can be reverted.
  const lastStatusEvent = [...(alert.auditTrail ?? [])].reverse().find((e) => e.previousStatus !== e.newStatus)

  function flashMsg(msg: string) {
    setFlash(msg)
    setTimeout(() => setFlash(null), 3500)
  }

  function setStatus(status: AlertStatus) {
    const reopening = status === 'open' && RESOLVED_STATUSES.includes(alert!.status)
    applyStatusChange([alertId], status, reopening ? 'manual reopen' : 'manual')
    flashMsg(feedbackFor(status, alert!.id))
  }

  function undo() {
    undoLastAction(alertId)
    flashMsg(`Reverted the last status change on ${alertId}.`)
  }

  return (
    <div data-testid="alert-detail-panel" className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700/50 bg-gray-900/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className={clsx('w-1.5 h-5 rounded-full shrink-0', sev.dot)} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white truncate">{alert.name}</span>
              <code className="text-[10px] text-gray-600 font-mono shrink-0">{alert.id}</code>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={clsx('text-[10px] font-semibold uppercase tracking-wide', sev.color)}>{alert.severity}</span>
              <span className={clsx('text-[10px] px-1.5 py-0.5 rounded border', STATUS_STYLE[alert.status])}>
                {STATUS_LABEL[alert.status]}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-200 text-sm leading-none px-1.5 py-0.5 rounded hover:bg-gray-800/60 transition-colors shrink-0"
          title="Close"
        >
          ✕
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Field grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Entity"><span className="font-mono">{alert.entity}</span> <span className="text-gray-600">({alert.entityType})</span></Field>
          <Field label="Detection Rule"><span className="font-mono text-[11px]">{alert.detectionRule}</span></Field>
          <Field label="Source Product">{alert.sourceProduct}</Field>
          <Field label="Source Table"><span className="font-mono text-[11px]">{alert.sourceTable}</span></Field>
          <Field label="Created">{alert.createdAt.replace('T', ' ').slice(0, 16)} UTC</Field>
          <Field label="Updated">{alert.updatedAt.replace('T', ' ').slice(0, 16)} UTC</Field>
          <Field label="Risk Score"><span className="font-mono">{alert.riskScore}/100</span></Field>
          <Field label="Confidence"><span className="font-mono">{alert.confidence}%</span></Field>
          <Field label="Tactics">{alert.tactics.join(', ') || '—'}</Field>
          <Field label="Techniques"><span className="font-mono text-[11px]">{alert.techniques.join(', ') || '—'}</span></Field>
        </div>

        {/* Related entities */}
        {alert.relatedEntities.length > 0 && (
          <div>
            <div className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest mb-1.5">Related Entities</div>
            <div className="flex flex-wrap gap-1.5">
              {alert.relatedEntities.map((e) => (
                <span key={e} className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-800/60 border border-gray-700/40 text-gray-400">{e}</span>
              ))}
            </div>
          </div>
        )}

        {/* AI triage recommendation (single-alert — no checkbox needed) */}
        {effectiveVerdict && <AlertTriageRecommendation verdict={effectiveVerdict} nextActions={nextActions} />}

        {/* Case routing */}
        <div className="pt-1 border-t border-gray-800/60">
          <AlertCaseActions alert={alert} onFlash={flashMsg} />
        </div>

        {/* Manual lifecycle actions (state-aware) */}
        <div className="pt-2 border-t border-gray-800/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest">Lifecycle Actions</span>
            {lastStatusEvent && (
              <button
                onClick={undo}
                className="text-[10px] px-2 py-0.5 rounded border border-gray-600/40 text-gray-400 hover:bg-gray-700/40 transition-colors"
                title={`Revert last change (${STATUS_LABEL[lastStatusEvent.newStatus]} → ${STATUS_LABEL[lastStatusEvent.previousStatus]})`}
              >
                ↺ Undo last action
              </button>
            )}
          </div>
          <AlertStatusActions currentStatus={alert.status} variant="immediate" onSet={setStatus} />
          {flash && <p className="text-[10px] text-emerald-400 leading-relaxed">{flash}</p>}
          <p className="text-[10px] text-gray-600 leading-relaxed">
            Triage classifies and routes — it does not remediate. Marking Investigating does not clear the
            account/system; only Close / False Positive / Suppress resolve an alert. Containment (isolate host,
            revoke app, disable account) is a separate, explicit action.
          </p>
        </div>

        {/* Audit trail */}
        <div className="pt-2 border-t border-gray-800/60">
          <div className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest mb-1.5">Lifecycle / Audit</div>
          <AlertAuditTrail events={alert.auditTrail} />
        </div>
      </div>
    </div>
  )
}
