import { useState } from 'react'
import { ConfidenceBadge } from './ConfidenceBadge'
import type { QueryResult } from '../../types'

const KQL_KEYWORDS = /\b(where|project|summarize|extend|join|union|let|by|asc|desc|limit|top|count|distinct|between|ago|datetime|true|false|null|and|or|not|in|has|contains|startswith|endswith|matches|regex)\b/gi
const KQL_TABLE = /^([A-Za-z][A-Za-z0-9_]+)(?=\s*\n|\s*\|)/gm
const KQL_STRING = /"[^"]*"|'[^']*'/g
const KQL_COMMENT = /\/\/.*/g
const KQL_PIPE = /\|/g

function highlightKql(kql: string): string {
  return kql
    .replace(KQL_COMMENT, (m) => `<span class="kql-comment">${m}</span>`)
    .replace(KQL_STRING, (m) => `<span class="kql-string">${m}</span>`)
    .replace(KQL_TABLE, (m) => `<span class="kql-table">${m}</span>`)
    .replace(KQL_KEYWORDS, (m) => `<span class="kql-keyword">${m}</span>`)
    .replace(KQL_PIPE, `<span class="kql-operator">|</span>`)
}

interface Props {
  result: QueryResult
  onRun?: () => void
  onEdit?: (query: string) => void
}

export function QueryPreviewCard({ result, onRun, onEdit }: Props) {
  const [explanationOpen, setExplanationOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.generated_query)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-gray-700/60 bg-gray-900/70 backdrop-blur overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono">KQL</span>
          <ConfidenceBadge
            confidence={result.confidence}
            assumptions={result.explanation.assumptions}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 rounded hover:bg-gray-700"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(result.generated_query)}
              className="text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 rounded hover:bg-gray-700"
            >
              Edit
            </button>
          )}
          {onRun && (
            <button
              onClick={onRun}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white transition-colors px-3 py-1 rounded font-medium"
            >
              Run
            </button>
          )}
        </div>
      </div>

      {/* KQL code */}
      <div className="px-4 py-3 overflow-x-auto">
        <pre
          className="text-sm font-mono text-gray-200 whitespace-pre leading-relaxed"
          dangerouslySetInnerHTML={{ __html: highlightKql(result.generated_query) }}
        />
      </div>

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
