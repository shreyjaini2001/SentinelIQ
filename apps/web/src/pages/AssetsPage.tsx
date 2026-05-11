import { useState } from 'react'
import { clsx } from 'clsx'
import { useSessionStore } from '../stores/sessionStore'

type AssetType = 'user' | 'service_account' | 'host' | 'ip'

interface Asset {
  id: string; name: string; type: AssetType
  risk: 'critical' | 'high' | 'medium' | 'low'
  last_seen: string; alerts: number
}

const FIXTURE_ASSETS: Asset[] = [
  { id: 'USR-001', name: 'jsmith@corp.com',    type: 'user',            risk: 'critical', last_seen: '08:23', alerts: 4 },
  { id: 'USR-002', name: 'admin-svc',           type: 'service_account', risk: 'high',     last_seen: '08:15', alerts: 2 },
  { id: 'USR-003', name: 'mwatson@corp.com',   type: 'user',            risk: 'medium',   last_seen: '07:58', alerts: 1 },
  { id: 'USR-004', name: 'tbrown@corp.com',    type: 'user',            risk: 'medium',   last_seen: '05:55', alerts: 1 },
  { id: 'HST-001', name: 'SERVER-DC01',        type: 'host',            risk: 'high',     last_seen: '06:45', alerts: 2 },
  { id: 'HST-002', name: 'DESKTOP-42',         type: 'host',            risk: 'medium',   last_seen: '06:12', alerts: 1 },
  { id: 'HST-003', name: 'DESKTOP-A7B',        type: 'host',            risk: 'medium',   last_seen: '07:32', alerts: 1 },
  { id: 'HST-004', name: 'WORKSTATION-07',     type: 'host',            risk: 'low',      last_seen: '02:58', alerts: 1 },
  { id: 'IP-001',  name: '185.220.101.5',      type: 'ip',              risk: 'critical', last_seen: '08:23', alerts: 3 },
  { id: 'IP-002',  name: '194.165.16.3',       type: 'ip',              risk: 'high',     last_seen: '07:58', alerts: 1 },
]

const TYPE_LABEL: Record<AssetType, string> = {
  user:            'User',
  service_account: 'Service Acct',
  host:            'Host',
  ip:              'IP Address',
}

const TYPE_STYLE: Record<AssetType, string> = {
  user:            'text-blue-300 bg-blue-500/10 border-blue-500/25',
  service_account: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/25',
  host:            'text-purple-300 bg-purple-500/10 border-purple-500/25',
  ip:              'text-orange-300 bg-orange-500/10 border-orange-500/25',
}

const RISK_COLOR: Record<string, string> = {
  critical: 'text-red-400',
  high:     'text-orange-400',
  medium:   'text-amber-400',
  low:      'text-gray-400',
}

export function AssetsPage() {
  const { setPendingQuery } = useSessionStore()
  const [typeFilter, setTypeFilter] = useState<AssetType | null>(null)

  const assets = typeFilter ? FIXTURE_ASSETS.filter(a => a.type === typeFilter) : FIXTURE_ASSETS

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Assets &amp; Entities</h1>
          <p className="text-xs text-gray-500 mt-0.5">{FIXTURE_ASSETS.length} entities · Users, Hosts, IPs · Mock inventory</p>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-2">
        {(['all', 'user', 'service_account', 'host', 'ip'] as const).map((t) => {
          const active = t === 'all' ? !typeFilter : typeFilter === t
          const label = t === 'all' ? 'All' : TYPE_LABEL[t]
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(t === 'all' ? null : t)}
              className={clsx(
                'text-xs px-2.5 py-1 rounded-lg border transition-colors',
                active
                  ? 'bg-blue-600/20 border-blue-500/30 text-blue-300'
                  : 'border-gray-700/50 text-gray-500 hover:text-gray-300 hover:border-gray-600',
              )}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Asset table */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800/80">
              {['Entity', 'Type', 'Risk', 'Alerts', 'Last Seen', ''].map((col) => (
                <th key={col} className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 py-2.5">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-b border-gray-800/30 hover:bg-gray-800/25 transition-colors">
                <td className="px-4 py-2.5">
                  <div className="text-xs font-mono text-gray-200">{asset.name}</div>
                  <div className="text-[10px] text-gray-600">{asset.id}</div>
                </td>
                <td className="px-4 py-2.5">
                  <span className={clsx('text-[10px] px-1.5 py-0.5 rounded border', TYPE_STYLE[asset.type])}>
                    {TYPE_LABEL[asset.type]}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${RISK_COLOR[asset.risk]}`}>
                    {asset.risk}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-400 font-mono">{asset.alerts}</td>
                <td className="px-4 py-2.5 text-xs text-gray-500 font-mono">{asset.last_seen}</td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => setPendingQuery(`Map the blast radius for ${asset.name}`)}
                    className="text-[10px] text-orange-400 hover:text-orange-300 transition-colors whitespace-nowrap"
                  >
                    Blast radius →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 border-t border-gray-800/60">
          <span className="text-[10px] text-gray-600">Showing {assets.length} entities · Mock inventory</span>
        </div>
      </div>
    </div>
  )
}
