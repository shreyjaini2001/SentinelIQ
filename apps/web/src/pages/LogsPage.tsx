import { useState, useEffect } from 'react'
import { useSessionStore } from '../stores/sessionStore'
import { submitCommand } from '../utils/commandRunner'
import { useInvestigationStore } from '../stores/investigationStore'
import { useLogsStore } from '../stores/logsStore'
import { generateMockResults } from '../utils/mockResults'
import { getQueryTitle, summarizeQueryResult } from '../utils/querySummary'
import { QueryResultTable } from '../components/query/QueryResultTable'
import { EntityChips } from '../components/query/EntityChips'
import { PivotSuggestions } from '../components/query/PivotSuggestions'
import { PlatformSelector } from '../components/query/PlatformSelector'
import { PLATFORM_NAMES, PLATFORM_LANGUAGES, deriveQueryPlanFromKql, renderQuery } from '../utils/siemAdapters'
import type { ExtractedEntity } from '../utils/mockResults'

const TEMPLATES = [
  {
    label: 'Failed logins last 24h',
    kql: `SigninLogs
| where TimeGenerated >= ago(24h)
| where ResultType != 0
| project TimeGenerated, UserPrincipalName, IPAddress, Location, ResultType
| order by TimeGenerated desc`,
  },
  {
    label: 'Lateral movement events',
    kql: `IdentityLogonEvents
| where TimeGenerated >= ago(7d)
| where LogonType == "Network"
| project TimeGenerated, AccountName, DeviceName, RemoteDeviceName, LogonType
| order by TimeGenerated desc`,
  },
  {
    label: 'Encoded PowerShell',
    kql: `DeviceProcessEvents
| where TimeGenerated >= ago(24h)
| where ProcessCommandLine has "-EncodedCommand"
    or ProcessCommandLine has "-Enc"
| project TimeGenerated, DeviceName, AccountName, FileName, ProcessCommandLine
| order by TimeGenerated desc`,
  },
  {
    label: 'Suspicious outbound',
    kql: `DeviceNetworkEvents
| where TimeGenerated >= ago(24h)
| where RemoteIPType == "Public"
| where BytesSent > 500000
| project TimeGenerated, DeviceName, RemoteIP, RemotePort, BytesSent
| order by BytesSent desc`,
  },
  {
    label: 'New local admin creation',
    kql: `SecurityEvent
| where TimeGenerated >= ago(7d)
| where EventID in (4720, 4728)
| project TimeGenerated, Computer, EventID, TargetUserName, SubjectUserName
| order by TimeGenerated desc`,
  },
]

const AI_PROMPTS = [
  'Show me failed logins last 6 hours',
  'Lateral movement events this week',
  'Find outbound connections over 100MB',
  'PowerShell executions on DESKTOP-42',
]

export function LogsPage() {
  const { logsKql, setLogsKql } = useSessionStore()
  const {
    investigations, activeInvestigationId,
    addArtifact, addTurn, addNote, addPinnedFinding, togglePin,
    openInvestigation, removePinnedFindingFrom,
  } = useInvestigationStore()

  // Persistent state via logsStore
  const {
    kql, setKql,
    results, setResults,
    recentQueries, addRecentQuery,
    savedQueries, addSavedQuery, removeSavedQuery,
    showSummary, setShowSummary,
    pinned, pinnedFindingText, pinnedInvId, setPinned,
    caseTargetId, setCaseTargetId,
    selectedPlatform, setSelectedPlatform,
    clearResults,
  } = useLogsStore()

  const [saveFlash, setSaveFlash] = useState<string | null>(null)
  const [noteSaved, setNoteSaved] = useState(false)
  const [noteSavedInv, setNoteSavedInv] = useState<string | null>(null)

  // Effective case target: explicit selection or fall back to active investigation
  const effectiveCaseTargetId = caseTargetId ?? activeInvestigationId
  const targetInv = investigations.find((i) => i.id === effectiveCaseTargetId)

  // Consume KQL sent from QueryPreviewCard "Open in Logs"
  useEffect(() => {
    if (logsKql) {
      setKql(logsKql)
      clearResults()
      setLogsKql(null)
    }
  }, [logsKql, setLogsKql, setKql, clearResults])

  const handleRun = () => {
    if (!kql.trim()) return
    const mockResult = generateMockResults(kql)
    setResults(mockResult)
    setPinned(false)
    setShowSummary(false)
    setSaveFlash(null)
    setNoteSaved(false)
    addRecentQuery(kql.trim())
    // No auto-save — results are scratch until explicitly saved
  }

  const handleClear = () => {
    setKql('')
    clearResults()
    setSaveFlash(null)
  }

  const handleSaveQuery = () => {
    if (!kql.trim()) return
    addSavedQuery(kql.trim())
  }

  // Save current query + result artifact to the selected case
  const handleSaveToCase = () => {
    if (!results || !effectiveCaseTargetId) return

    const prevActiveId = activeInvestigationId
    const needsSwitch = effectiveCaseTargetId !== prevActiveId
    if (needsSwitch) openInvestigation(effectiveCaseTargetId)

    const title = getQueryTitle(kql)
    const plan = deriveQueryPlanFromKql(kql.trim())
    const rendered = renderQuery(plan, selectedPlatform)
    const qId = addArtifact({
      type: 'query',
      title: `Query — ${title}`,
      data: {
        kql: kql.trim(),
        sourceTable: results.sourceTable,
        sourcePlatform: selectedPlatform,
        queryLanguage: PLATFORM_LANGUAGES[selectedPlatform],
        renderedQuery: rendered.query,
      },
    })
    const rId = addArtifact({
      type: 'query_result',
      title: `Query Result — ${title}`,
      data: {
        ...results,
        sourcePlatform: selectedPlatform,
        queryLanguage: PLATFORM_LANGUAGES[selectedPlatform],
        renderedQuery: rendered.query,
      },
    })
    addTurn({
      user_text: `Ran KQL: ${title}`,
      mode: 'query',
      result_summary: `${results.rowCount} rows from ${results.sourceTable}`,
      artifact_ids: [qId, rId].filter(Boolean),
    })

    if (needsSwitch && prevActiveId) openInvestigation(prevActiveId)

    setSaveFlash(targetInv?.title ?? effectiveCaseTargetId)
    setTimeout(() => setSaveFlash(null), 3000)
  }

  const handlePinResult = () => {
    if (!results || !effectiveCaseTargetId) return

    if (pinned) {
      // Unpin: remove the finding from the investigation
      if (pinnedFindingText && pinnedInvId) {
        removePinnedFindingFrom(pinnedInvId, pinnedFindingText)
        // Also unpin the corresponding artifact
        const inv = investigations.find((i) => i.id === pinnedInvId)
        const resultArt = inv?.artifacts.slice().reverse().find((a) => a.type === 'query_result')
        if (resultArt?.pinned) togglePin(resultArt.id)
      }
      setPinned(false)
      return
    }

    // Pin: save finding to the case
    const summary = summarizeQueryResult(results)
    const prevActiveId = activeInvestigationId
    const needsSwitch = effectiveCaseTargetId !== prevActiveId
    if (needsSwitch) openInvestigation(effectiveCaseTargetId)

    addPinnedFinding(summary)
    const inv = investigations.find((i) => i.id === effectiveCaseTargetId)
    const resultArt = inv?.artifacts.slice().reverse().find((a) => a.type === 'query_result')
    if (resultArt) togglePin(resultArt.id)

    if (needsSwitch && prevActiveId) openInvestigation(prevActiveId)

    setPinned(true, summary, effectiveCaseTargetId)
  }

  const handleSaveNote = () => {
    if (!results || !effectiveCaseTargetId) return

    const summary = summarizeQueryResult(results)
    const noteContent = [
      summary,
      `Source: ${results.sourceTable} · ${results.rowCount} rows`,
      `Query: ${getQueryTitle(kql)}`,
      `Saved: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`,
    ].join('\n')

    const prevActiveId = activeInvestigationId
    const needsSwitch = effectiveCaseTargetId !== prevActiveId
    if (needsSwitch) openInvestigation(effectiveCaseTargetId)
    addNote(noteContent)
    if (needsSwitch && prevActiveId) openInvestigation(prevActiveId)

    setNoteSaved(true)
    setNoteSavedInv(targetInv?.title ?? effectiveCaseTargetId)
    setTimeout(() => { setNoteSaved(false); setNoteSavedInv(null) }, 3000)
  }

  const handleEntityClick = (entity: ExtractedEntity) => {
    void submitCommand(`Show me all activity for ${entity.value} in the last 24 hours`, { source: 'entity_chip' })
  }

  const handleLoadTemplate = (templateKql: string) => {
    setKql(templateKql)
    clearResults()
    setSaveFlash(null)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white">Logs</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Query console · {PLATFORM_NAMES[selectedPlatform]} · Mock connector
            {targetInv && (
              <span className="ml-2 text-blue-400">· Case: {targetInv.title}</span>
            )}
          </p>
        </div>
        <PlatformSelector value={selectedPlatform} onChange={setSelectedPlatform} />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-[176px_1fr] gap-4 items-start">

        {/* ── Left: templates + recent + saved + AI generate ───────────────── */}
        <div className="space-y-4">

          <section>
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Templates <span className="text-gray-700 normal-case font-normal">(Sentinel/KQL)</span>
            </div>
            <div className="space-y-1">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => handleLoadTemplate(t.kql)}
                  className="w-full text-left text-[11px] px-2.5 py-2 rounded-lg border border-gray-700/40 bg-gray-900/40 text-gray-400 hover:text-gray-100 hover:border-gray-600/60 hover:bg-gray-800/40 transition-colors leading-snug"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          {/* Recent queries — always visible */}
          <section>
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Recent {recentQueries.length > 0 && <span className="text-gray-700">({recentQueries.length})</span>}
            </div>
            {recentQueries.length === 0 ? (
              <p className="text-[10px] text-gray-700 italic">No recent queries</p>
            ) : (
              <div className="space-y-1">
                {recentQueries.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleLoadTemplate(q)}
                    title={q}
                    className="w-full text-left text-[11px] px-2.5 py-2 rounded-lg border border-gray-700/30 bg-gray-900/20 text-gray-500 hover:text-gray-200 hover:border-gray-600/40 transition-colors leading-snug truncate"
                  >
                    {getQueryTitle(q)}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Saved queries with × delete */}
          {savedQueries.length > 0 && (
            <section>
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Saved</div>
              <div className="space-y-1">
                {savedQueries.map((q, i) => (
                  <div key={i} className="flex items-center gap-1 group">
                    <button
                      onClick={() => handleLoadTemplate(q)}
                      title={q}
                      className="flex-1 min-w-0 text-left text-[11px] px-2.5 py-2 rounded-lg border border-gray-700/30 bg-gray-900/20 text-gray-500 hover:text-gray-200 hover:border-gray-600/40 transition-colors leading-snug truncate"
                    >
                      {getQueryTitle(q)}
                    </button>
                    <button
                      onClick={() => removeSavedQuery(q)}
                      className="shrink-0 w-5 h-5 flex items-center justify-center text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs rounded"
                      title="Remove saved query"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">AI Generate</div>
            <div className="space-y-1">
              {AI_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => void submitCommand(q, { source: 'overview_chip' })}
                  className="w-full text-left text-[11px] px-2.5 py-2 rounded-lg border border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500/15 transition-colors leading-snug"
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-700 mt-2 leading-relaxed">
              AI-generated KQL appears above. Use "Open in Logs" to load it here.
            </p>
          </section>

        </div>

        {/* ── Right: editor + results ────────────────────────────────────── */}
        <div className="space-y-4 min-w-0">

          {/* KQL editor */}
          <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 overflow-hidden">
            {/* Editor toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800/60 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                  Query editor
                </span>
                <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${
                  selectedPlatform === 'sentinel' ? 'text-blue-400 border-blue-500/25 bg-blue-500/5' :
                  selectedPlatform === 'splunk'   ? 'text-orange-400 border-orange-500/25 bg-orange-500/5' :
                                                    'text-green-400 border-green-500/25 bg-green-500/5'
                }`}>
                  {PLATFORM_LANGUAGES[selectedPlatform]}
                </span>
              </div>
              <span className="text-[10px] text-gray-700 font-mono">
                {kql.trim() ? `${kql.split('\n').length}L` : 'Empty'}
              </span>
            </div>

            {/* Textarea */}
            <textarea
              value={kql}
              onChange={(e) => { setKql(e.target.value); clearResults() }}
              placeholder={selectedPlatform === 'sentinel'
                ? 'Enter KQL here, or load a template from the left…'
                : `Enter ${PLATFORM_LANGUAGES[selectedPlatform]} here, or use the AI bar to generate a query then switch platform…`
              }
              rows={10}
              className="w-full bg-transparent text-gray-200 placeholder-gray-700 px-4 py-3 text-xs font-mono resize-none outline-none leading-relaxed"
              spellCheck={false}
            />

            {/* Editor footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-800/60 gap-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClear}
                  className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleSaveQuery}
                  disabled={!kql.trim()}
                  className="text-[10px] text-gray-600 hover:text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Save Query
                </button>
              </div>
              <button
                onClick={handleRun}
                disabled={!kql.trim()}
                className="px-4 py-1.5 rounded-lg bg-blue-600/80 text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
              >
                ▶ Run Query
              </button>
            </div>
          </div>

          {/* Results */}
          {results && (
            <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 overflow-hidden">
              {/* Results header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800/60 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Results</span>
                  {saveFlash ? (
                    <span className="text-[10px] text-emerald-400">· Saved to {saveFlash} ✓</span>
                  ) : (
                    <span className="text-[10px] text-gray-600">· Scratch — not saved</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSummary(!showSummary)}
                    className="text-[10px] px-2 py-1 rounded border border-gray-700/40 text-gray-500 hover:text-gray-200 hover:border-gray-600/60 transition-colors"
                  >
                    {showSummary ? 'Hide Summary' : 'Summarize'}
                  </button>
                  {effectiveCaseTargetId && (
                    <button
                      onClick={handlePinResult}
                      className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                        pinned
                          ? 'text-amber-300 bg-amber-500/10 border-amber-500/25 hover:bg-amber-500/5 hover:text-amber-400'
                          : 'text-gray-500 border-gray-700/40 hover:text-amber-300 hover:border-amber-500/30 hover:bg-amber-500/5'
                      }`}
                    >
                      {pinned ? '◈ Unpin' : 'Pin Result'}
                    </button>
                  )}
                </div>
              </div>

              {/* Case target + save-to-case row */}
              <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-800/40 bg-gray-900/30">
                <span className="text-[10px] text-gray-600 shrink-0">Case target:</span>
                <select
                  value={caseTargetId ?? activeInvestigationId ?? ''}
                  onChange={(e) => setCaseTargetId(e.target.value || null)}
                  className="flex-1 min-w-0 text-[11px] bg-gray-800/60 text-gray-300 border border-gray-700/40 rounded px-2 py-0.5 outline-none focus:border-gray-600 transition-colors"
                >
                  <option value="">— None (scratch only) —</option>
                  {investigations.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.title} ({inv.severity})
                    </option>
                  ))}
                </select>
                {effectiveCaseTargetId && (
                  <button
                    onClick={handleSaveToCase}
                    disabled={!!saveFlash}
                    className="shrink-0 text-[10px] px-2.5 py-1 rounded border border-blue-500/30 text-blue-400 bg-blue-500/5 hover:bg-blue-500/15 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saveFlash ? 'Saved ✓' : 'Save to Case'}
                  </button>
                )}
              </div>

              <div className="px-4 py-4 space-y-5">
                {/* AI summary */}
                {showSummary && (
                  <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 px-4 py-3">
                    <div className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest mb-1.5">Summary</div>
                    <p className="text-xs text-gray-300 leading-relaxed">{summarizeQueryResult(results)}</p>
                    {effectiveCaseTargetId && (
                      <div className="mt-2">
                        {noteSaved ? (
                          <p className="text-[10px] text-emerald-400">
                            Saved as note in {noteSavedInv} ✓
                          </p>
                        ) : (
                          <button
                            onClick={handleSaveNote}
                            className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Save as note → {targetInv?.title}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Result table */}
                <QueryResultTable result={results} />

                {/* Entity chips */}
                {results.extractedEntities.length > 0 && (
                  <EntityChips entities={results.extractedEntities} onEntityClick={handleEntityClick} />
                )}

                {/* Pivot suggestions */}
                <PivotSuggestions result={results} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
