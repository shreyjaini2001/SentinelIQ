import { useState } from 'react'
import { useSessionStore } from '../stores/sessionStore'

const EXAMPLE_QUERIES = [
  'Show me failed logins last 6 hours',
  'Lateral movement events this week',
  'Find outbound connections over 100MB',
  'PowerShell executions on DESKTOP-42',
]

const EXAMPLE_KQL = `SigninLogs
| where TimeGenerated >= ago(6h)
| where ResultType != 0
| where RiskLevelDuringSignIn in ("high", "medium")
| project TimeGenerated, UserPrincipalName, IPAddress, Location, ResultDescription
| order by TimeGenerated desc`

export function LogsPage() {
  const { setPendingQuery } = useSessionStore()
  const [kql, setKql] = useState('')
  const [showExample, setShowExample] = useState(false)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Logs</h1>
          <p className="text-xs text-gray-500 mt-0.5">KQL console · 24 tables available · Mock connector</p>
        </div>
      </div>

      {/* Quick AI prompts */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Generate KQL with AI</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => setPendingQuery(q)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-blue-500/30 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* KQL editor */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800/60">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">KQL Editor</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setKql(EXAMPLE_KQL); setShowExample(true) }}
              className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              Load example
            </button>
            <button
              onClick={() => setKql('')}
              className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
        <textarea
          value={kql}
          onChange={(e) => setKql(e.target.value)}
          placeholder="Enter KQL query here, or use AI to generate one above..."
          rows={8}
          className="w-full bg-transparent text-gray-200 placeholder-gray-700 px-4 py-3 text-xs font-mono resize-none outline-none leading-relaxed"
          spellCheck={false}
        />
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-800/60">
          <span className="text-[10px] text-gray-600">
            {kql.trim() ? `${kql.split('\n').length} lines` : 'Empty'}
          </span>
          <button
            disabled={!kql.trim()}
            className="px-3 py-1.5 rounded-lg bg-blue-600/80 text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
          >
            Run Query →
          </button>
        </div>
      </div>

      {showExample && (
        <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Query Results</span>
            <span className="text-[10px] text-gray-600">Mock · 12 rows</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800/60">
                  {['TimeGenerated', 'UserPrincipalName', 'IPAddress', 'Location', 'ResultDescription'].map((h) => (
                    <th key={h} className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider pb-2 pr-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-gray-400">
                {[
                  ['2026-05-10 08:23', 'jsmith@corp.com',   '185.220.101.5', 'RU / Moscow',    'Invalid credentials'],
                  ['2026-05-10 08:21', 'jsmith@corp.com',   '185.220.101.5', 'RU / Moscow',    'Invalid credentials'],
                  ['2026-05-10 08:19', 'jsmith@corp.com',   '185.220.101.5', 'RU / Moscow',    'Account locked out'],
                  ['2026-05-10 07:58', 'mwatson@corp.com',  '194.165.16.3',  'NG / Lagos',     'MFA required'],
                  ['2026-05-10 05:30', 'svc-backup-new',    '10.0.2.15',     'US / Virginia',  'Invalid credentials'],
                ].map((row, i) => (
                  <tr key={i} className="border-b border-gray-800/25 hover:bg-gray-800/20 transition-colors">
                    {row.map((cell, j) => (
                      <td key={j} className="py-2 pr-4 font-mono whitespace-nowrap">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-gray-600 mt-3">Mock result · 5 of 12 rows shown</p>
        </div>
      )}
    </div>
  )
}
