import { useState } from 'react'
import { clsx } from 'clsx'
import { useSessionStore } from '../stores/sessionStore'

const SEVERITY_CONFIG = {
  critical:     { color: 'text-red-400',    dot: 'bg-red-500' },
  high:         { color: 'text-orange-400', dot: 'bg-orange-500' },
  medium:       { color: 'text-amber-400',  dot: 'bg-amber-500' },
  low:          { color: 'text-gray-400',   dot: 'bg-gray-500' },
} as const

const STATUS_CONFIG = {
  open:          { label: 'Open',          style: 'text-blue-300 bg-blue-500/10 border-blue-500/25' },
  investigating: { label: 'Investigating', style: 'text-orange-300 bg-orange-500/10 border-orange-500/25' },
  acknowledged:  { label: 'Acknowledged', style: 'text-gray-400 bg-gray-500/10 border-gray-500/25' },
  closed:        { label: 'Closed',       style: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' },
} as const

type Severity = keyof typeof SEVERITY_CONFIG
type Status   = keyof typeof STATUS_CONFIG

interface Alert {
  id: string; time: string; name: string
  severity: Severity; entity: string; status: Status
}

const FIXTURE_ALERTS: Alert[] = [
  { id: 'ALT-001', time: '08:23', name: 'Impossible Travel Detected',        severity: 'critical', entity: 'jsmith@corp.com',     status: 'open' },
  { id: 'ALT-002', time: '08:15', name: 'Privileged Group Modification',     severity: 'high',     entity: 'admin-svc',           status: 'open' },
  { id: 'ALT-003', time: '07:58', name: 'GeoAnomaly: New Country Login',     severity: 'high',     entity: 'mwatson@corp.com',    status: 'open' },
  { id: 'ALT-004', time: '07:32', name: 'Large Outbound Data Transfer',      severity: 'high',     entity: 'DESKTOP-A7B',         status: 'investigating' },
  { id: 'ALT-005', time: '06:45', name: 'Lateral Movement via SMB',          severity: 'high',     entity: 'SERVER-DC01',         status: 'open' },
  { id: 'ALT-006', time: '06:12', name: 'Encoded PowerShell Execution',      severity: 'medium',   entity: 'DESKTOP-42',          status: 'open' },
  { id: 'ALT-007', time: '05:55', name: 'Multiple Failed MFA Attempts',      severity: 'medium',   entity: 'tbrown@corp.com',     status: 'open' },
  { id: 'ALT-008', time: '05:30', name: 'New Service Account Created',       severity: 'medium',   entity: 'svc-backup-new',      status: 'acknowledged' },
  { id: 'ALT-009', time: '04:15', name: 'OAuth App Consent Granted',         severity: 'medium',   entity: 'apps-team@corp.com',  status: 'open' },
  { id: 'ALT-010', time: '03:45', name: 'Suspicious Sign-In Activity',       severity: 'low',      entity: 'guest_user_1',        status: 'open' },
  { id: 'ALT-011', time: '03:22', name: 'Failed Password Reset Attempt',     severity: 'low',      entity: 'jdoe@corp.com',       status: 'acknowledged' },
  { id: 'ALT-012', time: '02:58', name: 'Non-Standard Port Communication',   severity: 'low',      entity: 'WORKSTATION-07',      status: 'open' },
]

export function AlertsPage() {
  const { setPendingQuery } = useSessionStore()
  const [filter, setFilter] = useState<Severity | null>(null)

  const alerts = filter ? FIXTURE_ALERTS.filter(a => a.severity === filter) : FIXTURE_ALERTS

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Alerts</h1>
          <p className="text-xs text-gray-500 mt-0.5">190 total · 3 critical · updated just now</p>
        </div>
        <button
          onClick={() => setPendingQuery('Triage my open alerts')}
          className="px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-medium hover:bg-purple-600/30 transition-colors"
        >
          AI Triage →
        </button>
      </div>

      {/* Severity filter pills */}
      <div className="flex items-center gap-2">
        {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => {
          const active = sev === 'all' ? !filter : filter === sev
          return (
            <button
              key={sev}
              onClick={() => setFilter(sev === 'all' ? null : sev)}
              className={clsx(
                'text-xs px-2.5 py-1 rounded-lg border transition-colors capitalize',
                active
                  ? 'bg-blue-600/20 border-blue-500/30 text-blue-300'
                  : 'border-gray-700/50 text-gray-500 hover:text-gray-300 hover:border-gray-600',
              )}
            >
              {sev === 'all' ? 'All' : sev}
            </button>
          )
        })}
        <span className="ml-auto text-[10px] text-gray-600">{alerts.length} alerts</span>
      </div>

      {/* Alert table */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800/80">
              {['Time', 'Alert Name', 'Severity', 'Entity', 'Status'].map((col) => (
                <th key={col} className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-2.5">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => {
              const sev = SEVERITY_CONFIG[alert.severity]
              const stat = STATUS_CONFIG[alert.status]
              return (
                <tr
                  key={alert.id}
                  className="border-b border-gray-800/30 hover:bg-gray-800/25 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-2.5 text-xs text-gray-500 font-mono whitespace-nowrap">{alert.time}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${sev.dot}`} />
                      <span className="text-xs text-gray-200">{alert.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${sev.color}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-400 font-mono">{alert.entity}</td>
                  <td className="px-4 py-2.5">
                    <span className={clsx('text-[10px] px-1.5 py-0.5 rounded border', stat.style)}>
                      {stat.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-4 py-2 border-t border-gray-800/60 flex items-center justify-between">
          <span className="text-[10px] text-gray-600">Showing {alerts.length} of 190 alerts · Fixture data</span>
          <button
            onClick={() => setPendingQuery('Triage my open alerts')}
            className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
          >
            AI triage all →
          </button>
        </div>
      </div>
    </div>
  )
}
