import type { AlertAuditEvent, AlertStatus } from '../../types/alerts'

const STATUS_LABEL: Record<AlertStatus, string> = {
  open: 'Open',
  investigating: 'Investigating',
  acknowledged: 'Acknowledged',
  closed: 'Closed',
  suppressed: 'Suppressed',
  false_positive: 'False Positive',
  escalated: 'Escalated',
}

function fmt(ts: string): string {
  return ts.replace('T', ' ').slice(0, 16) + ' UTC'
}

/** Read-only lifecycle audit for an alert. Nothing is ever deleted — this is append-only. */
export function AlertAuditTrail({ events }: { events?: AlertAuditEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <p className="text-[11px] text-gray-600 italic">No lifecycle actions recorded yet.</p>
    )
  }
  return (
    <ol className="space-y-1.5">
      {events.slice().reverse().map((e, i) => {
        const isLink = e.previousStatus === e.newStatus
        return (
          <li key={i} className="flex items-start gap-2 text-[11px]">
            <span className="text-gray-600 font-mono shrink-0 mt-px">{fmt(e.timestamp)}</span>
            <span className="text-gray-300">
              {isLink ? (
                <span>{e.reason}</span>
              ) : (
                <span>
                  <span className="text-gray-500">{STATUS_LABEL[e.previousStatus]}</span>
                  <span className="text-gray-600"> → </span>
                  <span className="text-gray-200 font-medium">{STATUS_LABEL[e.newStatus]}</span>
                  <span className="text-gray-600"> · {e.reason}</span>
                </span>
              )}
              <span className="text-gray-600"> · {e.actor}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
