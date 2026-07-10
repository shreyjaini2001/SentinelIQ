import { useState } from 'react'
import { useAlertStore } from '../../stores/alertStore'
import { useInvestigationStore } from '../../stores/investigationStore'
import { ActiveCaseSelector } from '../common/ActiveCaseSelector'
import type { MockAlert } from '../../types/alerts'

interface Props {
  alert: MockAlert
  onFlash: (msg: string) => void
}

/**
 * Prominent case-routing actions for a single alert: link to the active case, link to an
 * existing case, create a new investigation from the alert, or keep it in scratch. Never
 * auto-links — every routing action is an explicit analyst choice.
 */
export function AlertCaseActions({ alert, onFlash }: Props) {
  const { linkAlertsToCase } = useAlertStore()
  const { investigations, activeInvestigationId, createInvestigation } = useInvestigationStore()
  const [pickCaseId, setPickCaseId] = useState<string | null>(activeInvestigationId)

  const activeCase = investigations.find((i) => i.id === activeInvestigationId)
  const linkedCase = investigations.find((i) => i.id === alert.linkedInvestigationId)
  const alreadyLinkedToActive = !!activeCase && alert.linkedInvestigationId === activeCase.id

  // Suggest the active case only when the alert's entity/evidence overlaps it.
  const overlaps = !!activeCase && (
    activeCase.entities.includes(alert.entity) ||
    alert.relatedEntities.some((e) => activeCase.entities.includes(e)) ||
    activeCase.alerts.includes(alert.id)
  )

  function link(caseId: string, title: string) {
    linkAlertsToCase([alert.id], caseId, title)
    onFlash(`Alert ${alert.id} linked to ${title}.`)
  }

  function createFromAlert() {
    const title = `${alert.name} — ${alert.entity}`
    const id = createInvestigation(title, alert.severity)
    linkAlertsToCase([alert.id], id, title)
    onFlash(`Created investigation "${title}" and linked ${alert.id}.`)
  }

  const pickCase = investigations.find((i) => i.id === pickCaseId)

  return (
    <div className="space-y-2">
      <div className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest">Case Routing</div>

      {/* Current link state */}
      {linkedCase ? (
        <p className="text-[11px] text-blue-400">◈ Currently linked to {linkedCase.title}</p>
      ) : activeCase ? (
        overlaps ? (
          <p className="text-[11px] text-emerald-400">Suggested: link to {activeCase.title} (entity overlap)</p>
        ) : (
          <p className="text-[11px] text-gray-500">Not linked — active case is {activeCase.title}</p>
        )
      ) : (
        <p className="text-[11px] text-amber-500/80">No active case — create or select a case to save/link.</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {activeCase && (
          <button
            onClick={() => link(activeCase.id, activeCase.title)}
            disabled={alreadyLinkedToActive}
            className="text-[10px] px-2 py-1 rounded border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {alreadyLinkedToActive ? `Linked to ${activeCase.title}` : `Link to active case`}
          </button>
        )}
        <button
          onClick={createFromAlert}
          className="text-[10px] px-2 py-1 rounded border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors"
        >
          + New investigation from alert
        </button>
      </div>

      {/* Link to an existing case */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-gray-600">Link to existing:</span>
        <ActiveCaseSelector value={pickCaseId} onChange={setPickCaseId} />
        <button
          onClick={() => pickCase && link(pickCase.id, pickCase.title)}
          disabled={!pickCase || alert.linkedInvestigationId === pickCase?.id}
          className="text-[10px] px-2 py-1 rounded border border-gray-600/40 text-gray-400 hover:bg-gray-700/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {pickCase ? 'Link' : 'Keep scratch'}
        </button>
      </div>
    </div>
  )
}
