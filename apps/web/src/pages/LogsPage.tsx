import { useState, useEffect, useRef } from 'react'
import { useSessionStore } from '../stores/sessionStore'
import { useInvestigationStore } from '../stores/investigationStore'
import { generateMockResults } from '../utils/mockResults'
import { getQueryTitle, summarizeQueryResult } from '../utils/querySummary'
import { QueryResultTable } from '../components/query/QueryResultTable'
import { EntityChips } from '../components/query/EntityChips'
import { PivotSuggestions } from '../components/query/PivotSuggestions'
import type { MockQueryResult, ExtractedEntity } from '../utils/mockResults'

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
  const { setPendingQuery, logsKql, setLogsKql } = useSessionStore()
  const { investigations, activeInvestigationId, addArtifact, addTurn, addNote, addPinnedFinding, togglePin } =
    useInvestigationStore()

  const [kql, setKql]               = useState('')
  const [results, setResults]       = useState<MockQueryResult | null>(null)
  const [recentQueries, setRecentQueries] = useState<string[]>([])
  const [savedQueries, setSavedQueries]   = useState<string[]>([])
  const [pinned, setPinned]         = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [showRecent, setShowRecent] = useState(false)
  const [noteSaved, setNoteSaved]   = useState(false)
  const recentRef = useRef<HTMLDivElement>(null)

  const activeInv = investigations.find((i) => i.id === activeInvestigationId)

  // Consume KQL sent from QueryPreviewCard "Open in Logs"
  useEffect(() => {
    if (logsKql) {
      setKql(logsKql)
      setResults(null)
      setPinned(false)
      setShowSummary(false)
      setLogsKql(null)
    }
  }, [logsKql, setLogsKql])

  // Close recent dropdown on outside click
  useEffect(() => {
    if (!showRecent) return
    const handler = (e: MouseEvent) => {
      if (recentRef.current && !recentRef.current.contains(e.target as Node)) {
        setShowRecent(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showRecent])

  const handleRun = () => {
    if (!kql.trim()) return
    const mockResult = generateMockResults(kql)
    setResults(mockResult)
    setPinned(false)
    setShowSummary(false)
    setNoteSaved(false)

    // Track in recent queries (dedup, cap at 5)
    setRecentQueries((prev) => {
      const t = kql.trim()
      return [t, ...prev.filter((q) => q !== t)].slice(0, 5)
    })

    // Auto-save artifacts to active investigation
    if (activeInvestigationId) {
      const title = getQueryTitle(kql)
      const qId = addArtifact({
        type: 'query',
        title: `Query — ${title}`,
        data: { kql: kql.trim(), sourceTable: mockResult.sourceTable },
      })
      const rId = addArtifact({
        type: 'query_result',
        title: `Query Result — ${title}`,
        data: mockResult,
      })
      addTurn({
        user_text: `Ran KQL: ${title}`,
        mode: 'query',
        result_summary: `${mockResult.rowCount} rows from ${mockResult.sourceTable}`,
        artifact_ids: [qId, rId].filter(Boolean),
      })
    }
  }

  const handleClear = () => {
    setKql('')
    setResults(null)
    setPinned(false)
    setShowSummary(false)
  }

  const handleSaveQuery = () => {
    if (!kql.trim()) return
    setSavedQueries((prev) => {
      const t = kql.trim()
      return [t, ...prev.filter((q) => q !== t)].slice(0, 10)
    })
  }

  const handlePinResult = () => {
    if (!results || !activeInvestigationId) return
    const summary = summarizeQueryResult(results)
    addPinnedFinding(summary)
    // Pin the most recent query_result artifact
    const inv = investigations.find((i) => i.id === activeInvestigationId)
    const resultArt = inv?.artifacts.slice().reverse().find((a) => a.type === 'query_result')
    if (resultArt) togglePin(resultArt.id)
    setPinned(true)
  }

  const handleSaveNote = () => {
    if (!results || !activeInvestigationId) return
    addNote(summarizeQueryResult(results))
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2000)
  }

  const handleEntityClick = (entity: ExtractedEntity) => {
    setPendingQuery(`Show me all activity for ${entity.value} in the last 24 hours`)
  }

  const handleLoadTemplate = (templateKql: string) => {
    setKql(templateKql)
    setResults(null)
    setPinned(false)
    setShowSummary(false)
    setShowRecent(false)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Logs</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            KQL console · 24 tables available · Mock connector
            {activeInv && (
              <span className="ml-2 text-blue-400">
                · Case: {activeInv.title}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-[176px_1fr] gap-4 items-start">

        {/* ── Left: templates + saved + AI generate ─────────────────────── */}
        <div className="space-y-4">
          <section>
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Templates</div>
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

          {savedQueries.length > 0 && (
            <section>
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Saved</div>
              <div className="space-y-1">
                {savedQueries.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleLoadTemplate(q)}
                    title={q}
                    className="w-full text-left text-[11px] px-2.5 py-2 rounded-lg border border-gray-700/30 bg-gray-900/20 text-gray-600 hover:text-gray-300 hover:border-gray-600/40 transition-colors leading-snug truncate"
                  >
                    {getQueryTitle(q)}
                  </button>
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
                  onClick={() => setPendingQuery(q)}
                  className="w-full text-left text-[11px] px-2.5 py-2 rounded-lg border border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500/15 transition-colors leading-snug"
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-700 mt-2 leading-relaxed">
              AI-generated KQL appears above. Use "Open in Logs" from the result card to load it here.
            </p>
          </section>
        </div>

        {/* ── Right: editor + results ────────────────────────────────────── */}
        <div className="space-y-4 min-w-0">

          {/* KQL editor */}
          <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 overflow-hidden">
            {/* Editor toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800/60 gap-3">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">KQL Editor</span>

                {/* Recent queries dropdown */}
                {recentQueries.length > 0 && (
                  <div className="relative" ref={recentRef}>
                    <button
                      onClick={() => setShowRecent((s) => !s)}
                      className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      Recent ({recentQueries.length}) ▾
                    </button>
                    {showRecent && (
                      <div className="absolute left-0 top-full mt-1 z-20 bg-gray-900 border border-gray-700/60 rounded-xl overflow-hidden w-72 shadow-2xl">
                        {recentQueries.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => handleLoadTemplate(q)}
                            title={q}
                            className="w-full text-left text-[11px] px-3 py-2.5 text-gray-400 hover:bg-gray-800/60 hover:text-gray-200 transition-colors truncate border-b border-gray-800/40 last:border-0"
                          >
                            {getQueryTitle(q)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <span className="text-[10px] text-gray-700 font-mono">
                {kql.trim() ? `${kql.split('\n').length}L` : 'Empty'}
              </span>
            </div>

            {/* Textarea */}
            <textarea
              value={kql}
              onChange={(e) => { setKql(e.target.value); setResults(null); setPinned(false) }}
              placeholder="Enter KQL here, or load a template from the left..."
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
                  {activeInv && (
                    <span className="text-[10px] text-blue-400">· Saved to {activeInv.id}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSummary((s) => !s)}
                    className="text-[10px] px-2 py-1 rounded border border-gray-700/40 text-gray-500 hover:text-gray-200 hover:border-gray-600/60 transition-colors"
                  >
                    {showSummary ? 'Hide Summary' : 'Summarize'}
                  </button>
                  {activeInv && (
                    <button
                      onClick={handlePinResult}
                      disabled={pinned}
                      className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                        pinned
                          ? 'text-amber-300 bg-amber-500/10 border-amber-500/25 cursor-default'
                          : 'text-gray-500 border-gray-700/40 hover:text-amber-300 hover:border-amber-500/30 hover:bg-amber-500/5'
                      }`}
                    >
                      {pinned ? '◈ Pinned' : 'Pin Result'}
                    </button>
                  )}
                </div>
              </div>

              <div className="px-4 py-4 space-y-5">
                {/* AI summary */}
                {showSummary && (
                  <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 px-4 py-3">
                    <div className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest mb-1.5">Summary</div>
                    <p className="text-xs text-gray-300 leading-relaxed">{summarizeQueryResult(results)}</p>
                    {activeInv && (
                      <button
                        onClick={handleSaveNote}
                        disabled={noteSaved}
                        className="text-[10px] text-blue-400 hover:text-blue-300 mt-2 transition-colors disabled:opacity-50"
                      >
                        {noteSaved ? 'Saved ✓' : 'Save as note →'}
                      </button>
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
