import { useState } from 'react'
import { clsx } from 'clsx'
import { useInvestigationStore } from '../stores/investigationStore'
import { useSessionStore } from '../stores/sessionStore'
import type { Artifact } from '../types/investigation'

type Tab = 'overview' | 'alerts' | 'entities' | 'timeline' | 'blast-radius' | 'notes' | 'reports' | 'artifacts'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',     label: 'Overview' },
  { id: 'alerts',       label: 'Alerts' },
  { id: 'entities',     label: 'Entities' },
  { id: 'timeline',     label: 'Timeline' },
  { id: 'blast-radius', label: 'Blast Radius' },
  { id: 'notes',        label: 'Notes' },
  { id: 'reports',      label: 'Reports' },
  { id: 'artifacts',    label: 'Artifacts' },
]

const SEV_COLOR: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/25',
  high:     'text-orange-400 bg-orange-500/10 border-orange-500/25',
  medium:   'text-amber-400 bg-amber-500/10 border-amber-500/25',
  low:      'text-gray-400 bg-gray-500/10 border-gray-500/25',
}

const ARTIFACT_ICON: Record<string, string> = {
  query:                '⊟',
  query_result:         '⊟',
  alert_triage:         '◉',
  hunt:                 '⊕',
  timeline:             '▶',
  blast_radius:         '◎',
  comparative_analysis: '≈',
  rule_suggestion:      '⊛',
  documentation:        '◧',
  handoff:              '→',
  runbook:              '≡',
  noise_coaching:       '⊜',
}

function fmtTs(iso: string) {
  return iso.replace('T', ' ').slice(0, 16)
}

function OverviewTab({ invId }: { invId: string }) {
  const { investigations } = useInvestigationStore()
  const { setPendingQuery } = useSessionStore()
  const inv = investigations.find((i) => i.id === invId)!

  return (
    <div className="space-y-5">
      {/* Pinned findings */}
      <section>
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
          Pinned Findings ({inv.pinned_findings.length})
        </div>
        {inv.pinned_findings.length === 0 ? (
          <p className="text-xs text-gray-600">No pinned findings yet. Pin an artifact finding to track it here.</p>
        ) : (
          <div className="space-y-1.5">
            {inv.pinned_findings.map((f, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/15">
                <span className="text-amber-400 text-xs shrink-0 mt-0.5">◈</span>
                <p className="text-xs text-amber-200/80">{f}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Investigation turns */}
      <section>
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
          Activity ({inv.turns.length} turns)
        </div>
        {inv.turns.length === 0 ? (
          <p className="text-xs text-gray-600">No turns yet. Use the command bar to start investigating.</p>
        ) : (
          <div className="space-y-2">
            {[...inv.turns].reverse().map((turn) => (
              <div key={turn.id} className="rounded-lg border border-gray-700/40 bg-gray-900/40 px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className={clsx(
                    'text-[9px] px-1.5 py-0.5 rounded border font-mono uppercase tracking-wide',
                    turn.mode === 'query'  && 'text-blue-400 bg-blue-500/10 border-blue-500/25',
                    turn.mode === 'action' && 'text-purple-400 bg-purple-500/10 border-purple-500/25',
                    turn.mode === 'refine' && 'text-teal-400 bg-teal-500/10 border-teal-500/25',
                  )}>
                    {turn.mode}
                  </span>
                  <span className="text-[10px] text-gray-600 font-mono">{fmtTs(turn.created_at)}</span>
                </div>
                <p className="text-xs text-gray-300 mb-0.5">{turn.user_text}</p>
                <p className="text-[10px] text-gray-600">{turn.result_summary}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section>
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Quick Actions</div>
        <div className="flex flex-wrap gap-2">
          {[
            `Build a timeline for ${inv.entities[0] ?? 'the primary entity'}`,
            `What is the blast radius for ${inv.entities[0] ?? 'this entity'}?`,
            `Generate an executive summary for this investigation`,
            `Write my handoff summary`,
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => setPendingQuery(prompt)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-700/50 text-gray-400 hover:text-gray-200 hover:border-gray-600/60 hover:bg-gray-800/40 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function AlertsTab({ invId }: { invId: string }) {
  const { investigations } = useInvestigationStore()
  const inv = investigations.find((i) => i.id === invId)!

  const ALERT_MOCK: Record<string, { title: string; sev: string }> = {
    'ALT-001': { title: 'GeoAnomalyLogin — jsmith from RU/Moscow', sev: 'high' },
    'ALT-002': { title: 'ImpossibleTravel — jsmith within 12 minutes', sev: 'high' },
    'ALT-003': { title: 'EncodedPowerShellExecution — DESKTOP-42', sev: 'high' },
    'ALT-004': { title: 'LateralMovement — DESKTOP-42 → SERVER-DC01', sev: 'critical' },
    'ALT-005': { title: 'PrivilegedGroupModification — admin-svc', sev: 'critical' },
    'ALT-006': { title: 'SuspiciousSignIn — admin-svc from unexpected IP', sev: 'medium' },
    'ALT-007': { title: 'LateralMovement — SERVER-DC01 → WORKSTATION-07', sev: 'high' },
  }

  return (
    <div className="space-y-2">
      {inv.alerts.map((alertId) => {
        const a = ALERT_MOCK[alertId] ?? { title: alertId, sev: 'medium' }
        return (
          <div key={alertId} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-700/40 bg-gray-900/40">
            <span className={clsx('text-[10px] font-mono', SEV_COLOR[a.sev]?.split(' ')[0])}>
              {a.sev.toUpperCase()}
            </span>
            <span className="text-[10px] text-gray-600 font-mono shrink-0">{alertId}</span>
            <span className="text-xs text-gray-300 flex-1">{a.title}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded border text-emerald-400 bg-emerald-500/10 border-emerald-500/25">linked</span>
          </div>
        )
      })}
    </div>
  )
}

function EntitiesTab({ invId }: { invId: string }) {
  const { investigations } = useInvestigationStore()
  const inv = investigations.find((i) => i.id === invId)!
  const { setPendingQuery } = useSessionStore()

  const classify = (e: string) => {
    if (e.includes('@')) return 'user'
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(e)) return 'ip'
    if (e.toUpperCase().startsWith('SERVER') || e.toUpperCase().startsWith('DESKTOP') || e.toUpperCase().startsWith('WORKSTATION')) return 'host'
    return 'entity'
  }

  const ENTITY_COLOR: Record<string, string> = {
    user:   'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
    ip:     'text-red-400 bg-red-500/10 border-red-500/25',
    host:   'text-blue-400 bg-blue-500/10 border-blue-500/25',
    entity: 'text-gray-400 bg-gray-500/10 border-gray-500/25',
  }

  return (
    <div className="space-y-2">
      {inv.entities.map((entity) => {
        const type = classify(entity)
        return (
          <div key={entity} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-700/40 bg-gray-900/40">
            <span className={clsx('text-[10px] px-1.5 py-0.5 rounded border', ENTITY_COLOR[type])}>
              {type}
            </span>
            <span className="text-xs text-gray-200 font-mono flex-1">{entity}</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPendingQuery(`What did ${entity} do in the last 24 hours?`)}
                className="text-[10px] px-2 py-1 rounded bg-blue-500/10 border border-blue-500/25 text-blue-300 hover:bg-blue-500/20 transition-colors"
              >
                Query →
              </button>
              <button
                onClick={() => setPendingQuery(`What is the blast radius for ${entity}?`)}
                className="text-[10px] px-2 py-1 rounded bg-orange-500/10 border border-orange-500/25 text-orange-300 hover:bg-orange-500/20 transition-colors"
              >
                Blast radius →
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TimelineTab({ invId }: { invId: string }) {
  const { investigations } = useInvestigationStore()
  const { setPendingQuery } = useSessionStore()
  const inv = investigations.find((i) => i.id === invId)!
  const tlArtifact = inv.artifacts.find((a) => a.type === 'timeline')

  if (!tlArtifact) {
    return (
      <div className="rounded-xl border border-dashed border-gray-700/50 px-5 py-10 flex flex-col items-center gap-3 text-center">
        <span className="text-3xl text-gray-700">▶</span>
        <p className="text-sm text-gray-500">No timeline artifact yet</p>
        <button
          onClick={() => setPendingQuery(`Build a timeline for ${inv.entities[0] ?? 'the primary entity'}`)}
          className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 transition-colors"
        >
          Generate Timeline →
        </button>
      </div>
    )
  }

  const d = tlArtifact.data as Record<string, unknown>
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">
        <div className="text-xs font-medium text-gray-300 mb-1">{tlArtifact.title}</div>
        <div className="text-[10px] text-gray-500">Saved {fmtTs(tlArtifact.created_at)}</div>
        {d.total_events !== undefined && (
          <div className="mt-2 text-xs text-blue-300">{String(d.total_events)} events mapped</div>
        )}
      </div>
      <p className="text-xs text-gray-600">Full timeline visualization available after connecting to a real data source.</p>
    </div>
  )
}

function BlastRadiusTab({ invId }: { invId: string }) {
  const { investigations } = useInvestigationStore()
  const { setPendingQuery } = useSessionStore()
  const inv = investigations.find((i) => i.id === invId)!
  const brArtifact = inv.artifacts.find((a) => a.type === 'blast_radius')

  if (!brArtifact) {
    return (
      <div className="rounded-xl border border-dashed border-gray-700/50 px-5 py-10 flex flex-col items-center gap-3 text-center">
        <span className="text-3xl text-gray-700">◎</span>
        <p className="text-sm text-gray-500">No blast radius analysis yet</p>
        <button
          onClick={() => setPendingQuery(`What is the blast radius for ${inv.entities[0] ?? 'the primary entity'}?`)}
          className="text-xs px-3 py-1.5 rounded-lg bg-orange-600/20 border border-orange-500/30 text-orange-300 hover:bg-orange-600/30 transition-colors"
        >
          Run Blast Radius →
        </button>
      </div>
    )
  }

  const d = brArtifact.data as Record<string, unknown>
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">
        <div className="text-xs font-medium text-gray-300 mb-1">{brArtifact.title}</div>
        <div className="text-[10px] text-gray-500">Saved {fmtTs(brArtifact.created_at)}</div>
        {d.risk_score !== undefined && (
          <div className="mt-2 flex gap-4 text-xs">
            <span className="text-red-400">Risk score: {String(d.risk_score)}/10</span>
            {d.total_reachable_assets !== undefined && (
              <span className="text-orange-400">{String(d.total_reachable_assets)} assets reachable</span>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-600">Graph visualization available in the Blast Radius panel on the Overview page.</p>
    </div>
  )
}

function NotesTab({ invId }: { invId: string }) {
  const { investigations, addNote } = useInvestigationStore()
  const inv = investigations.find((i) => i.id === invId)!
  const [draft, setDraft] = useState('')

  const handleAdd = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    addNote(trimmed)
    setDraft('')
  }

  return (
    <div className="space-y-4">
      {/* Add note */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Add Note</div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type your note here..."
          rows={3}
          className="w-full bg-transparent text-xs text-gray-200 placeholder-gray-600 resize-none outline-none border border-gray-700/40 rounded px-2 py-1.5 focus:border-blue-500/40"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleAdd}
            disabled={!draft.trim()}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save Note
          </button>
        </div>
      </div>

      {/* Notes list */}
      {inv.notes.length === 0 ? (
        <p className="text-xs text-gray-600 text-center py-4">No notes yet.</p>
      ) : (
        <div className="space-y-2">
          {[...inv.notes].reverse().map((note) => (
            <div key={note.id} className="rounded-xl border border-gray-700/40 bg-gray-900/40 px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] text-gray-500">{note.author}</span>
                <span className="text-[10px] text-gray-700">·</span>
                <span className="text-[10px] text-gray-600 font-mono">{fmtTs(note.created_at)}</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReportsTab({ invId }: { invId: string }) {
  const { investigations } = useInvestigationStore()
  const { setPendingQuery } = useSessionStore()
  const inv = investigations.find((i) => i.id === invId)!
  const reportArtifacts = inv.artifacts.filter((a) => a.type === 'documentation' || a.type === 'handoff')

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3">Generate</div>
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

      {reportArtifacts.length === 0 ? (
        <p className="text-xs text-gray-600 text-center py-4">No reports generated yet.</p>
      ) : (
        <div className="space-y-2">
          {reportArtifacts.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-700/40 bg-gray-900/40 px-4 py-3 flex items-center gap-3">
              <span className="text-sm text-gray-600">{ARTIFACT_ICON[r.type]}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-200 truncate">{r.title}</div>
                <div className="text-[10px] text-gray-600">{fmtTs(r.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ArtifactsTab({ invId }: { invId: string }) {
  const { investigations, togglePin } = useInvestigationStore()
  const inv = investigations.find((i) => i.id === invId)!

  return (
    <div className="space-y-2">
      {inv.artifacts.length === 0 ? (
        <p className="text-xs text-gray-600 text-center py-8">No artifacts saved yet.</p>
      ) : (
        inv.artifacts.map((art: Artifact) => (
          <div key={art.id} className={clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-gray-900/40 transition-colors',
            art.pinned ? 'border-amber-500/30 bg-amber-500/5' : 'border-gray-700/40',
          )}>
            <span className="text-sm text-gray-500 shrink-0">{ARTIFACT_ICON[art.type] ?? '◈'}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-200 truncate">{art.title}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-gray-600 font-mono">{art.type}</span>
                <span className="text-[10px] text-gray-700">·</span>
                <span className="text-[10px] text-gray-600">{fmtTs(art.created_at)}</span>
              </div>
            </div>
            <button
              onClick={() => togglePin(art.id)}
              className={clsx(
                'text-[10px] px-2 py-1 rounded border transition-colors shrink-0',
                art.pinned
                  ? 'text-amber-300 bg-amber-500/10 border-amber-500/25 hover:bg-amber-500/20'
                  : 'text-gray-600 bg-gray-800/40 border-gray-700/40 hover:text-gray-400 hover:border-gray-600/60',
              )}
            >
              {art.pinned ? '◈ Pinned' : 'Pin'}
            </button>
          </div>
        ))
      )}
    </div>
  )
}

interface Props {
  onBack: () => void
}

export function InvestigationWorkspacePage({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const { investigations, activeInvestigationId } = useInvestigationStore()

  const inv = investigations.find((i) => i.id === activeInvestigationId)

  if (!inv) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-gray-500">No investigation selected.</p>
        <button onClick={onBack} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
          ← Back to Investigations
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors mb-1.5 flex items-center gap-1"
          >
            ← Investigations
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-gray-600">{inv.id}</span>
            <span className={clsx('text-[10px] px-1.5 py-0.5 rounded border', SEV_COLOR[inv.severity])}>
              {inv.severity}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded border text-emerald-400 bg-emerald-500/10 border-emerald-500/25">
              {inv.status}
            </span>
          </div>
          <h1 className="text-lg font-semibold text-white">{inv.title}</h1>
          <p className="text-[10px] text-gray-600 mt-0.5">
            {inv.turns.length} turns · {inv.artifacts.length} artifacts · {inv.notes.length} notes · Owner: {inv.owner}
          </p>
        </div>

        {/* Stat pills */}
        <div className="flex gap-2 shrink-0">
          {[
            { label: 'Alerts',    value: inv.alerts.length,            color: 'text-orange-400' },
            { label: 'Pinned',    value: inv.pinned_findings.length,   color: 'text-amber-400' },
            { label: 'Entities',  value: inv.entities.length,          color: 'text-cyan-400' },
          ].map((s) => (
            <div key={s.label} className="text-center px-3 py-2 rounded-lg border border-gray-700/40 bg-gray-900/40">
              <div className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-gray-600">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0.5 border-b border-gray-800/60 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'text-xs px-4 py-2 whitespace-nowrap border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-blue-500 text-blue-300 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-300',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'overview'     && <OverviewTab     invId={inv.id} />}
        {activeTab === 'alerts'       && <AlertsTab       invId={inv.id} />}
        {activeTab === 'entities'     && <EntitiesTab     invId={inv.id} />}
        {activeTab === 'timeline'     && <TimelineTab     invId={inv.id} />}
        {activeTab === 'blast-radius' && <BlastRadiusTab  invId={inv.id} />}
        {activeTab === 'notes'        && <NotesTab        invId={inv.id} />}
        {activeTab === 'reports'      && <ReportsTab      invId={inv.id} />}
        {activeTab === 'artifacts'    && <ArtifactsTab    invId={inv.id} />}
      </div>
    </div>
  )
}
