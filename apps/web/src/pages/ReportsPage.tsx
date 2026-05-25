import { useState } from 'react'
import { useSessionStore } from '../stores/sessionStore'
import { useInvestigationStore } from '../stores/investigationStore'

const FIXTURE_REPORTS = [
  {
    id: 'RPT-001',
    title: 'Executive Summary — jsmith Account Compromise',
    variant: 'executive',
    generated: '2026-05-10 08:30',
    pages: 3,
    status: 'complete',
  },
  {
    id: 'RPT-002',
    title: 'Technical Report — LAPSUS$ Hunt Findings',
    variant: 'technical',
    generated: '2026-05-09 17:45',
    pages: 8,
    status: 'complete',
  },
  {
    id: 'RPT-003',
    title: 'Shift Handoff Briefing — May 10 Morning',
    variant: 'handoff',
    generated: '2026-05-10 06:00',
    pages: 2,
    status: 'complete',
  },
  {
    id: 'RPT-004',
    title: 'Regulatory Compliance Report — Q1 2026',
    variant: 'regulatory',
    generated: '2026-04-01 09:00',
    pages: 12,
    status: 'complete',
  },
]

const VARIANT_STYLE: Record<string, { color: string; label: string }> = {
  executive:  { color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',      label: 'Executive' },
  technical:  { color: 'text-blue-400 bg-blue-500/10 border-blue-500/25',      label: 'Technical' },
  handoff:    { color: 'text-amber-400 bg-amber-500/10 border-amber-500/25',   label: 'Handoff' },
  regulatory: { color: 'text-purple-400 bg-purple-500/10 border-purple-500/25', label: 'Regulatory' },
}

export function ReportsPage() {
  const { setPendingQuery } = useSessionStore()
  const { investigations, activeInvestigationId } = useInvestigationStore()
  // Independent report context: defaults to globally active case, but analyst can override here
  const [reportCaseId, setReportCaseId] = useState<string | null>(activeInvestigationId)
  const reportInv = investigations.find((i) => i.id === reportCaseId) ?? null

  const contextMeta = reportInv
    ? `${reportInv.turns.length} turns · ${reportInv.artifacts.length} artifacts · ${reportInv.pinned_findings.length} pinned findings · ${reportInv.notes.length} notes`
    : null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Reports</h1>
          <p className="text-xs text-gray-500 mt-0.5">{FIXTURE_REPORTS.length} reports · Executive, Technical, Regulatory</p>
        </div>
      </div>

      {/* Report context selector — independent of global active case */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/40 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Report Context</div>
          {reportInv && (
            <button
              onClick={() => setReportCaseId(null)}
              className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        {investigations.length > 0 ? (
          <select
            value={reportCaseId ?? ''}
            onChange={(e) => setReportCaseId(e.target.value || null)}
            className="w-full text-xs bg-gray-900 border border-gray-700/50 text-gray-300 rounded-lg px-2 py-1.5"
          >
            <option value="">No case selected (standalone report)</option>
            {investigations.map((inv) => (
              <option key={inv.id} value={inv.id}>{inv.title}</option>
            ))}
          </select>
        ) : (
          <p className="text-xs text-gray-600">No investigations yet.</p>
        )}
        {reportInv && contextMeta && (
          <p className="text-[10px] text-gray-600 mt-1.5">{contextMeta}</p>
        )}
      </div>

      {/* Generate prompts */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3">Generate with AI</div>
        {reportInv && (
          <p className="text-[10px] text-gray-600 mb-2">Using: {reportInv.title}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {[
            'Generate an executive summary for this investigation',
            'Write a technical report',
            'Write my handoff summary',
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => setPendingQuery(prompt)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Reports list */}
      <div className="space-y-2">
        {FIXTURE_REPORTS.map((report) => {
          const v = VARIANT_STYLE[report.variant]
          return (
            <div
              key={report.id}
              className="rounded-xl border border-gray-700/50 bg-gray-900/60 px-4 py-3 hover:border-gray-600/60 transition-colors cursor-pointer flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${v.color}`}>{v.label}</span>
                  <span className="text-[10px] font-mono text-gray-600">{report.id}</span>
                </div>
                <div className="text-sm text-gray-200 truncate">{report.title}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] text-gray-500">{report.generated}</div>
                <div className="text-[10px] text-gray-600">{report.pages} pages</div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded border text-emerald-400 bg-emerald-500/10 border-emerald-500/25 shrink-0">
                complete
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
