import { useState, useMemo } from 'react'
import { ConfidenceBadge } from './ConfidenceBadge'
import type { QueryResult } from '../../types'
import { generateMockResults } from '../../utils/mockResults'
import type { MockQueryResult, ExtractedEntity } from '../../utils/mockResults'
import { parseKqlScope } from '../../utils/queryPlanner'
import { deriveQueryPlanFromKql, renderQuery, PLATFORM_NAMES, PLATFORM_LANGUAGES } from '../../utils/siemAdapters'
import { QueryResultTable } from '../query/QueryResultTable'
import { EntityChips } from '../query/EntityChips'
import { PlatformSelector } from '../query/PlatformSelector'
import { useInvestigationStore } from '../../stores/investigationStore'
import { useLogsStore } from '../../stores/logsStore'
import { submitCommand } from '../../utils/commandRunner'

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
  const [copied, setCopied]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [savedResult, setSavedResult]   = useState(false)
  const [isEditing, setIsEditing]       = useState(false)
  // committedKql always holds the internal KQL for mock result generation
  const [committedKql, setCommittedKql] = useState(result.generated_query)
  const [editedQuery, setEditedQuery]   = useState(result.generated_query)
  const [runResults, setRunResults]     = useState<MockQueryResult | null>(null)

  const { activeInvestigationId, addArtifact } = useInvestigationStore()
  const { selectedPlatform, setSelectedPlatform } = useLogsStore()

  // Derive neutral plan + rendered query for the selected platform
  const plan = useMemo(() => deriveQueryPlanFromKql(committedKql), [committedKql])
  const rendered = useMemo(() => renderQuery(plan, selectedPlatform), [plan, selectedPlatform])

  // What to display in the code block
  const displayedQuery = selectedPlatform === 'sentinel' ? committedKql : rendered.query

  // Sync edit textarea when platform changes (only when not actively editing)
  const handlePlatformChange = (p: typeof selectedPlatform) => {
    setSelectedPlatform(p)
    if (!isEditing) setEditedQuery(p === 'sentinel' ? committedKql : renderQuery(plan, p).query)
  }

  const scope = parseKqlScope(committedKql)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(isEditing ? editedQuery : displayedQuery)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRun = () => {
    // For Sentinel: if editing, run the edited KQL and commit it
    // For other platforms: always use committedKql (mock results are KQL-keyed)
    const kqlToRun = isEditing && selectedPlatform === 'sentinel' ? editedQuery : committedKql
    if (isEditing && selectedPlatform === 'sentinel') setCommittedKql(editedQuery)
    setIsEditing(false)
    setRunResults(generateMockResults(kqlToRun))
    setSavedResult(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedQuery(displayedQuery)
  }

  const handleStartEdit = () => {
    setEditedQuery(displayedQuery)
    setIsEditing(true)
  }

  const handleOpenInLogs = () => {
    // Always pass the Sentinel KQL to the Logs editor (mock results are KQL-keyed)
    onOpenInLogs?.(committedKql)
  }

  const handleSave = () => {
    addArtifact({
      type: 'query',
      title: `Query: ${result.explanation.summary.slice(0, 60)}`,
      data: {
        kql: committedKql,
        query_id: result.query_id,
        sourcePlatform: selectedPlatform,
        queryLanguage: PLATFORM_LANGUAGES[selectedPlatform],
        renderedQuery: displayedQuery,
      },
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSaveResult = () => {
    if (!runResults) return
    addArtifact({
      type: 'query_result',
      title: `Query Result: ${result.explanation.summary.slice(0, 50)}`,
      data: {
        ...runResults,
        kql: committedKql,
        sourcePlatform: selectedPlatform,
        queryLanguage: PLATFORM_LANGUAGES[selectedPlatform],
        renderedQuery: displayedQuery,
      },
    })
    setSavedResult(true)
    setTimeout(() => setSavedResult(false), 2000)
  }

  const handleEntityClick = (entity: ExtractedEntity) => {
    const label = entity.type === 'user' ? 'user'
      : entity.type === 'host' ? 'host'
      : entity.type === 'ip' ? 'IP'
      : entity.type
    void submitCommand(
      `Show all activity for ${label} ${entity.value} in the last 24 hours`,
      { source: 'entity_chip' },
    )
  }

  const btnBase = 'text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 rounded hover:bg-gray-700/60'

  const langBadgeClass = selectedPlatform === 'sentinel'
    ? 'text-blue-400 border-blue-500/30 bg-blue-500/5'
    : selectedPlatform === 'splunk'
    ? 'text-orange-400 border-orange-500/30 bg-orange-500/5'
    : 'text-green-400 border-green-500/30 bg-green-500/5'

  return (
    <div data-testid="query-preview-card" className="rounded-xl border border-gray-700/60 bg-gray-900/70 backdrop-blur overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/50 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${langBadgeClass}`}>
            {PLATFORM_LANGUAGES[selectedPlatform]}
          </span>
          <span className="text-[10px] text-gray-600">{PLATFORM_NAMES[selectedPlatform]}</span>
          <ConfidenceBadge
            confidence={result.confidence}
            assumptions={result.explanation.assumptions}
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <PlatformSelector value={selectedPlatform} onChange={handlePlatformChange} />

          <button onClick={handleCopy} className={btnBase}>
            {copied ? 'Copied!' : 'Copy'}
          </button>

          {isEditing ? (
            <button onClick={handleCancelEdit} className={btnBase}>Cancel</button>
          ) : (
            <button onClick={handleStartEdit} className={btnBase}>Edit</button>
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

      {/* Query display or inline editor */}
      {isEditing ? (
        <div className="px-4 py-3 bg-gray-950/30">
          <textarea
            value={editedQuery}
            onChange={(e) => setEditedQuery(e.target.value)}
            rows={Math.max(4, editedQuery.split('\n').length + 1)}
            className="w-full bg-transparent text-gray-200 text-sm font-mono resize-none outline-none leading-relaxed border border-gray-700/40 rounded px-2 py-1.5 focus:border-blue-500/40"
            spellCheck={false}
            autoFocus
          />
          <p className="text-[10px] text-gray-600 mt-1.5">
            Edit inline · click Run Edited to execute · Cancel to restore
            {selectedPlatform !== 'sentinel' && (
              <span className="text-gray-700"> · Mock results use Sentinel routing regardless of displayed language</span>
            )}
          </p>
        </div>
      ) : (
        <div className="px-4 py-3 overflow-x-auto">
          {selectedPlatform === 'sentinel' ? (
            <pre
              className="text-sm font-mono text-gray-200 whitespace-pre leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightKql(committedKql) }}
            />
          ) : (
            <pre className="text-sm font-mono text-gray-200 whitespace-pre leading-relaxed">
              {rendered.query}
            </pre>
          )}
        </div>
      )}

      {/* Scope / metadata strip */}
      {!isEditing && (
        <div className="px-4 py-1.5 border-b border-gray-700/40 bg-gray-950/30 flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest shrink-0">Interpreted as</span>
          <span className="text-[10px] text-gray-400">{scope.intent}</span>
          {scope.isScoped && scope.entityValue && (
            <>
              <span className="text-gray-700 text-[10px]">·</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
                scope.entityType === 'user' ? 'bg-blue-500/15 border-blue-500/25 text-blue-300' :
                scope.entityType === 'host' ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300' :
                'bg-amber-500/15 border-amber-500/25 text-amber-300'
              }`}>
                {scope.entityType}: {scope.entityValue}
              </span>
            </>
          )}
          {scope.scopeLabel && !scope.entityValue && (
            <>
              <span className="text-gray-700 text-[10px]">·</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono border bg-purple-500/15 border-purple-500/25 text-purple-300">
                {scope.scopeLabel}
              </span>
            </>
          )}
          <span className="text-gray-700 text-[10px]">·</span>
          <span className="text-[10px] text-gray-600 font-mono">{rendered.sourceName}</span>
          <span className="text-gray-700 text-[10px]">·</span>
          <span className="text-[10px] text-gray-600">{scope.timeAgo === 'N/A' ? 'no time filter' : `last ${scope.timeAgo}`}</span>
        </div>
      )}

      {/* Run results */}
      {runResults && (
        <div className="border-t border-gray-700/50 px-4 py-3 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Results</span>
              <span className="text-[10px] text-gray-700">· normalized mock data</span>
            </div>
            {activeInvestigationId && (
              <button
                onClick={handleSaveResult}
                className="text-[10px] text-gray-500 hover:text-blue-300 transition-colors"
              >
                {savedResult ? 'Saved ✓' : 'Save Result to Case'}
              </button>
            )}
          </div>

          <QueryResultTable result={runResults} maxRows={5} />

          {runResults.extractedEntities.length > 0 && (
            <EntityChips entities={runResults.extractedEntities} onEntityClick={handleEntityClick} />
          )}

          {onOpenInLogs && (
            <button
              onClick={handleOpenInLogs}
              className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
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
            <div className="mt-2 p-2 rounded bg-gray-800/60 border border-gray-700/40">
              <p className="text-[10px] text-gray-500">
                Mock mode — deterministic fixture data.
                {selectedPlatform !== 'sentinel' && (
                  <> Query rendered as {PLATFORM_LANGUAGES[selectedPlatform]} for {PLATFORM_NAMES[selectedPlatform]}. </>
                )}
                {scope.scopeLabel ? ` Scope: ${scope.scopeLabel}.` : scope.isScoped ? ' Scoped to the requested entity.' : ' Structurally representative.'}
                {' '}Results will vary in a live workspace.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

