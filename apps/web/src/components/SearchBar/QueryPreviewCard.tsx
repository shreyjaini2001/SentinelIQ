import { useState } from 'react'
import { ConfidenceBadge } from './ConfidenceBadge'
import type { QueryResult } from '../../types'
import { generateMockResults } from '../../utils/mockResults'
import type { MockQueryResult } from '../../utils/mockResults'
import { useInvestigationStore } from '../../stores/investigationStore'

// Reset global-flag regexes per call by recreating them
function highlightKql(kql: string): string {
  return kql
    .replace(/\/\/.*/g,                   (m) => `<span class="kql-comment">${m}</span>`)
    .replace(/"[^"]*"|'[^']*'/g,          (m) => `<span class="kql-string">${m}</span>`)
    .replace(/^([A-Za-z][A-Za-z0-9_]+)(?=\s*\n|\s*\|)/gm, (m) => `<span class="kql-table">${m}</span>`)
    .replace(/\b(where|project|summarize|extend|join|union|let|by|asc|desc|limit|top|count|distinct|between|ago|datetime|true|false|null|and|or|not|in|has|contains|startswith|endswith|matches|regex)\b/gi,
             (m) => `<span class="kql-keyword">${m}</span>`)
    .replace(/\|/g, `<span class="kql-operator">|</span>`)
}

interface Props {
  result: QueryResult
  onDismiss?: () => void
  onOpenInLogs?: (kql: string) => void
}

export function QueryPreviewCard({ result, onDismiss, onOpenInLogs }: Props) {
  const [explanationOpen, setExplanationOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedKql, setEditedKql] = useState(result.generated_query)
  const [runResults, setRunResults] = useState<MockQueryResult | null>(null)
  const { activeInvestigationId, addArtifact } = useInvestigationStore()

  const activeKql = isEditing ? editedKql : result.generated_query

  const handleSave = () => {
    addArtifact({
      type: 'query',
      title: `Query: ${result.explanation.summary.slice(0, 60)}`,
      data: { kql: activeKql, query_id: result.query_id },
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(activeKql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRun = () => {
    setIsEditing(false)
    setRunResults(generateMockResults(activeKql))
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedKql(result.generated_query)
  }

  const handleOpenInLogs = () => {
    onOpenInLogs?.(activeKql)
  }

  const btnBase = 'text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 rounded hover:bg-gray-700/60'

  return (
    <div data-testid="query-preview-card" className="rounded-xl border border-gray-700/60 bg-gray-900/70 backdrop-blur overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono">KQL</span>
          <ConfidenceBadge
            confidence={result.confidence}
            assumptions={result.explanation.assumptions}
          />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleCopy} className={btnBase}>
            {copied ? 'Copied!' : 'Copy'}
          </button>

          {isEditing ? (
            <button onClick={handleCancelEdit} className={btnBase}>Cancel</button>
          ) : (
            <button onClick={() => setIsEditing(true)} className={btnBase}>Edit</button>
          )}

          <button
            onClick={handleRun}
            className="text-xs bg-blue-600 hover:bg-blue-500 text-white transition-colors px-3 py-1 rounded font-medium"
          >
            {isEditing ? 'Run Edited' : 'Run'}
          </button>

          {activeInvestigationId && (
            <button onClick={handleSave} className={btnBase}>
              {saved ? 'Saved!' : 'Save to Case'}
            </button>
          )}

          {onOpenInLogs && (
            <button onClick={handleOpenInLogs} className={btnBase}>
              Open in Logs
            </button>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-xs text-gray-600 hover:text-gray-300 transition-colors px-1.5 py-1 rounded hover:bg-gray-700/60 ml-1"
              title="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* KQL display or inline editor */}
      {isEditing ? (
        <div className="px-4 py-3 bg-gray-950/30">
          <textarea
            value={editedKql}
            onChange={(e) => setEditedKql(e.target.value)}
            rows={Math.max(4, editedKql.split('\n').length + 1)}
            className="w-full bg-transparent text-gray-200 text-sm font-mono resize-none outline-none leading-relaxed border border-gray-700/40 rounded px-2 py-1.5 focus:border-blue-500/40"
            spellCheck={false}
            autoFocus
          />
          <p className="text-[10px] text-gray-600 mt-1.5">Edit inline · click Run Edited to execute · Cancel to restore original</p>
        </div>
      ) : (
        <div className="px-4 py-3 overflow-x-auto">
          <pre
            className="text-sm font-mono text-gray-200 whitespace-pre leading-relaxed"
            dangerouslySetInnerHTML={{ __html: highlightKql(result.generated_query) }}
          />
        </div>
      )}

      {/* Mock run results */}
      {runResults && (
        <div className="border-t border-gray-700/50 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Results</span>
            <span className="text-[10px] text-gray-600">Mock · {runResults.rows.length} rows</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/40">
                  {runResults.columns.map((col) => (
                    <th key={col} className="text-left text-[10px] font-semibold text-gray-500 pb-1.5 pr-4 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runResults.rows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-800/30 hover:bg-gray-800/20 transition-colors">
                    {row.map((cell, j) => (
                      <td key={j} className="py-1.5 pr-4 text-[11px] text-gray-400 font-mono max-w-[200px] truncate">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {onOpenInLogs && (
            <button
              onClick={handleOpenInLogs}
              className="mt-2.5 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
            >
              Open in Logs for further analysis →
            </button>
          )}
        </div>
      )}

      {/* Explanation toggle */}
      <div className="border-t border-gray-700/50">
        <button
          onClick={() => setExplanationOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-colors"
        >
          <span>Explanation</span>
          <span>{explanationOpen ? '▲' : '▼'}</span>
        </button>

        {explanationOpen && (
          <div className="px-4 pb-4 space-y-3">
            <p className="text-sm text-gray-300">{result.explanation.summary}</p>

            {result.explanation.clauses.length > 0 && (
              <div className="space-y-1.5">
                {result.explanation.clauses.map((c, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <code className="text-blue-400 font-mono shrink-0 max-w-[200px] truncate">{c.clause}</code>
                    <span className="text-gray-400">—</span>
                    <span className="text-gray-300">{c.plain_english}</span>
                  </div>
                ))}
              </div>
            )}

            {result.explanation.assumptions.length > 0 && (
              <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-400 font-medium mb-1">Assumptions:</p>
                <ul className="space-y-0.5">
                  {result.explanation.assumptions.map((a, i) => (
                    <li key={i} className="text-xs text-amber-300/80">• {a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
