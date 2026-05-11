import { useState, useEffect } from 'react'
import { useSessionStore } from '../stores/sessionStore'
import { generateMockResults } from '../utils/mockResults'
import type { MockQueryResult } from '../utils/mockResults'

const AI_PROMPTS = [
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
  const { setPendingQuery, logsKql, setLogsKql } = useSessionStore()
  const [kql, setKql] = useState('')
  const [results, setResults] = useState<MockQueryResult | null>(null)

  // Consume KQL sent from QueryPreviewCard "Open in Logs"
  useEffect(() => {
    if (logsKql) {
      setKql(logsKql)
      setResults(null)   // clear old results when new KQL loads
      setLogsKql(null)   // consume the value so it doesn't re-trigger
    }
  }, [logsKql, setLogsKql])

  const handleRun = () => {
    if (kql.trim()) {
      setResults(generateMockResults(kql))
    }
  }

  const handleClear = () => {
    setKql('')
    setResults(null)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Logs</h1>
          <p className="text-xs text-gray-500 mt-0.5">KQL console · 24 tables available · Mock connector</p>
        </div>
      </div>

      {/* AI prompt chips — generate KQL via global AI bar */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3">
          Generate KQL with AI
        </div>
        <div className="flex flex-wrap gap-2">
          {AI_PROMPTS.map((q) => (
            <button
              key={q}
              onClick={() => setPendingQuery(q)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-blue-500/30 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-600 mt-2">
          AI-generated KQL will appear in the command bar above. Use "Open in Logs" from the result card to load it here.
        </p>
      </div>

      {/* KQL editor */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800/60">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">KQL Editor</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setKql(EXAMPLE_KQL); setResults(null) }}
              className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              Load example
            </button>
            <button
              onClick={handleClear}
              className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <textarea
          value={kql}
          onChange={(e) => { setKql(e.target.value); setResults(null) }}
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
            onClick={handleRun}
            disabled={!kql.trim()}
            className="px-3 py-1.5 rounded-lg bg-blue-600/80 text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
          >
            Run Query →
          </button>
        </div>
      </div>

      {/* Query results */}
      {results && (
        <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800/60">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Results</span>
            <span className="text-[10px] text-gray-600">Mock · {results.rows.length} rows</span>
          </div>
          <div className="overflow-x-auto px-4 py-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800/60">
                  {results.columns.map((col) => (
                    <th key={col} className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider pb-2 pr-4 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-gray-400">
                {results.rows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-800/25 hover:bg-gray-800/20 transition-colors">
                    {row.map((cell, j) => (
                      <td key={j} className="py-2 pr-4 font-mono whitespace-nowrap max-w-[260px] truncate">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-800/60">
            <span className="text-[10px] text-gray-600">
              Mock result · {results.rows.length} of {results.rows.length} rows · Fixture data
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
