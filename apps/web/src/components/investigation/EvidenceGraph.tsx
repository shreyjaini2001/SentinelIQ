import { useState, useMemo, useEffect } from 'react'
import { clsx } from 'clsx'
import type { Investigation } from '../../types/investigation'
import type { EvidenceNode, EvidenceRelationship, InvestigationGap } from '../../types/evidence'
import { deriveEvidence } from '../../utils/evidenceGraph'
import { submitCommand } from '../../utils/commandRunner'
import { useInvestigationStore } from '../../stores/investigationStore'

const NODE_COLOR: Record<string, string> = {
  user:    'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  host:    'text-blue-400 bg-blue-500/10 border-blue-500/30',
  ip:      'text-red-400 bg-red-500/10 border-red-500/30',
  process: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  country: 'text-green-400 bg-green-500/10 border-green-500/30',
  entity:  'text-gray-400 bg-gray-500/10 border-gray-500/30',
}

const GAP_COLOR: Record<string, string> = {
  high:   'border-red-500/30 bg-red-500/5 text-red-400',
  medium: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
  low:    'border-gray-600/40 bg-gray-800/30 text-gray-500',
}

const NODE_ICON: Record<string, string> = {
  user:    '◉',
  host:    '⬜',
  ip:      '◈',
  process: '▷',
  country: '⊙',
  entity:  '◻',
}

const PROV_BADGE: Record<string, string> = {
  query_result:   'text-blue-400 bg-blue-500/10 border-blue-500/30',
  pinned_finding: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  note:           'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  artifact_title: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
}

const PROV_LABEL: Record<string, string> = {
  query_result:   'derived/query_result',
  pinned_finding: 'analyst/finding',
  note:           'analyst/note',
  artifact_title: 'derived/title',
}

function nodeLabel(node: EvidenceNode): string {
  return node.value.length > 26 ? node.value.slice(0, 25) + '…' : node.value
}

function fmtTs(iso: string) {
  return iso.replace('T', ' ').slice(0, 16)
}

// ── Open-in-Logs scoped query per entity type ──────────────────────────────

function openInLogsPrompt(node: EvidenceNode): string {
  const v = node.value
  switch (node.type) {
    case 'user':    return `Show sign-in activity for ${v} in the last 24 hours`
    case 'host':    return `Show process and network activity on ${v}`
    case 'ip':      return `Show network events for IP ${v}`
    case 'process': return `Show all executions of ${v} in the last 24 hours`
    case 'country': return `Show sign-ins from ${v}`
    default:        return `Show activity for ${v}`
  }
}

// ── Quick actions per entity type ──────────────────────────────────────────

function quickActionsForNode(node: EvidenceNode): { label: string; prompt: string }[] {
  const v = node.value
  switch (node.type) {
    case 'user':
      return [
        { label: 'Recent activity',    prompt: `What did ${v} do in the last 24 hours?` },
        { label: 'Failed logins',      prompt: `Show failed logins for ${v}` },
        { label: 'Blast radius',       prompt: `What is the blast radius for ${v}?` },
        { label: 'Summarize evidence', prompt: `Summarize evidence for ${v}` },
      ]
    case 'host':
      return [
        { label: 'Process activity',    prompt: `Show process execution on ${v}` },
        { label: 'Network connections', prompt: `Show outbound connections from ${v}` },
        { label: 'Logon events',        prompt: `Who logged into ${v} in the last 24 hours?` },
        { label: 'Hunt related TTPs',   prompt: `Hunt for suspicious activity on ${v}` },
      ]
    case 'ip':
      return [
        { label: 'Network traffic',  prompt: `Show network events for ${v}` },
        { label: 'Connections from', prompt: `Which hosts connected to ${v}?` },
      ]
    case 'country':
      return [
        { label: 'Sign-ins from', prompt: `Show sign-ins from ${v}` },
      ]
    case 'process':
      return [
        { label: 'Process history', prompt: `Show all executions of ${v} in the last 24 hours` },
        { label: 'Hunt TTPs',       prompt: `Hunt for TTPs related to ${v}` },
      ]
    default:
      return [
        { label: 'Query activity', prompt: `Show activity for ${v}` },
      ]
  }
}

// ── Relationship row (expandable) ─────────────────────────────────────────

function RelationshipRow({
  rel,
  nodes,
  isExpanded,
  onToggle,
  onNavigateToArtifact,
  invTitle,
}: {
  rel: EvidenceRelationship
  nodes: EvidenceNode[]
  isExpanded: boolean
  onToggle: () => void
  onNavigateToArtifact?: (artifactId: string) => void
  invTitle?: string
}) {
  const from = nodes.find((n) => n.id === rel.fromNodeId)
  const to   = nodes.find((n) => n.id === rel.toNodeId)
  const { addNote } = useInvestigationStore()
  const [relNoteOpen,  setRelNoteOpen]  = useState(false)
  const [relNoteDraft, setRelNoteDraft] = useState('')
  const [relNoteSaved, setRelNoteSaved] = useState(false)

  if (!from || !to || from.id === to.id) return null

  const relNoteContext = `${from.value} ${rel.verb} ${to.value}${rel.sourceTable ? ` (${rel.sourceTable})` : ''}`

  const handleSaveRelNote = () => {
    const text = relNoteDraft.trim()
    if (!text) return
    addNote(`Relationship note — ${relNoteContext}:\n${text}`)
    setRelNoteOpen(false)
    setRelNoteDraft('')
    setRelNoteSaved(true)
    setTimeout(() => setRelNoteSaved(false), 2500)
  }

  const sourceLabel =
    rel.provenanceType === 'query_result'
      ? `Query Result${rel.sourceTable ? ` — ${rel.sourceTable}` : ''}`
      : rel.provenanceType === 'pinned_finding'
      ? 'Pinned Finding'
      : rel.provenanceType === 'note'
      ? 'Analyst Note'
      : 'Artifact'

  return (
    <div className="rounded-lg overflow-hidden border border-gray-800/50">
      {/* Collapsed row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-900/40 hover:bg-gray-900/70 transition-colors text-[11px]"
      >
        <span className={clsx('px-1.5 py-0.5 rounded border text-[9px] shrink-0', NODE_COLOR[from.type])}>
          {nodeLabel(from)}
        </span>
        <span className="text-gray-600 italic shrink-0 truncate">{rel.verb}</span>
        <span className={clsx('px-1.5 py-0.5 rounded border text-[9px] shrink-0', NODE_COLOR[to.type])}>
          {nodeLabel(to)}
        </span>
        <span className="flex-1" />
        <span className={clsx('text-[9px] px-1 py-0.5 rounded border shrink-0', PROV_BADGE[rel.provenanceType])}>
          {rel.provenanceType === 'query_result' ? 'qr' : rel.provenanceType === 'pinned_finding' ? '◈' : '✎'}
        </span>
        <span className="text-[10px] text-gray-700 shrink-0">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded provenance panel */}
      {isExpanded && (
        <div className="bg-gray-950/60 border-t border-gray-800/40 px-3 py-2.5 space-y-1.5">
          {/* Entity summary row */}
          <div className="flex items-center gap-1.5 text-[10px] pb-1.5 border-b border-gray-800/30">
            <span className={clsx('px-1.5 py-0.5 rounded border text-[9px]', NODE_COLOR[from.type])}>
              {nodeLabel(from)}
            </span>
            <span className="text-gray-600 italic">{rel.verb}</span>
            <span className={clsx('px-1.5 py-0.5 rounded border text-[9px]', NODE_COLOR[to.type])}>
              {nodeLabel(to)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600 w-14 shrink-0">Source:</span>
              <span className="text-gray-400">{sourceLabel}</span>
            </div>
            {rel.sourceTable && (
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 w-14 shrink-0">Table:</span>
                <span className="text-blue-400 font-mono">{rel.sourceTable}</span>
              </div>
            )}
            {rel.artifactTitle && (
              <div className="flex items-center gap-1.5 col-span-2">
                <span className="text-gray-600 w-14 shrink-0">Artifact:</span>
                <span className="text-gray-400 truncate">{rel.artifactTitle}</span>
              </div>
            )}
            {rel.rowCount !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 w-14 shrink-0">Rows:</span>
                <span className="text-gray-400">{rel.rowCount} supporting rows</span>
              </div>
            )}
            {rel.timestamp && (
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 w-14 shrink-0">Added:</span>
                <span className="text-gray-500 font-mono">{fmtTs(rel.timestamp)}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 col-span-2">
              <span className="text-gray-600 w-14 shrink-0">Type:</span>
              <span className={clsx('text-[9px] px-1.5 py-0.5 rounded border', PROV_BADGE[rel.provenanceType])}>
                {PROV_LABEL[rel.provenanceType]}
              </span>
            </div>
          </div>

          {/* Finding text preview */}
          {rel.provenanceType === 'pinned_finding' && rel.provenance && (
            <p className="text-[10px] text-gray-600 italic border-t border-gray-800/40 pt-1.5 leading-relaxed">
              "{rel.provenance.slice(0, 120)}{rel.provenance.length > 120 ? '…' : ''}"
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-1.5 pt-1 border-t border-gray-800/30 flex-wrap">
            {rel.artifactId && onNavigateToArtifact && (
              <button
                onClick={() => onNavigateToArtifact(rel.artifactId!)}
                className="text-[9px] px-1.5 py-0.5 rounded border text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
              >
                Open artifact →
              </button>
            )}
            <button
              onClick={() =>
                submitCommand(
                  `Show ${rel.sourceTable ?? 'security'} events for ${from.value}`,
                  { source: 'investigation_quick_action' },
                )
              }
              className="text-[9px] px-1.5 py-0.5 rounded border text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
            >
              Open in Logs →
            </button>
            <button
              onClick={() =>
                submitCommand(
                  `Investigate relationship between ${from.value} and ${to.value}`,
                  { source: 'investigation_quick_action' },
                )
              }
              className="text-[9px] px-1.5 py-0.5 rounded border text-purple-400 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
            >
              Investigate →
            </button>
            <button
              onClick={() => { setRelNoteOpen((o) => !o); setRelNoteDraft('') }}
              className="text-[9px] px-1.5 py-0.5 rounded border text-cyan-400 border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
            >
              Add note
            </button>
          </div>

          {/* Relationship note composer */}
          {relNoteOpen && (
            <div className="pt-1.5 space-y-1.5 border-t border-gray-800/30">
              <div className="text-[9px] text-gray-600 font-mono">
                Relationship note — {relNoteContext}:
              </div>
              <textarea
                value={relNoteDraft}
                onChange={(e) => setRelNoteDraft(e.target.value)}
                placeholder="Add your observation here…"
                rows={2}
                autoFocus
                className="w-full bg-transparent text-[11px] text-gray-200 placeholder-gray-600 resize-none outline-none border border-gray-700/40 rounded px-2 py-1.5 focus:border-cyan-500/40"
              />
              <div className="flex gap-1.5 items-center">
                <button
                  onClick={handleSaveRelNote}
                  disabled={!relNoteDraft.trim()}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/30 disabled:opacity-40 transition-colors"
                >
                  Save note
                </button>
                <button
                  onClick={() => { setRelNoteOpen(false); setRelNoteDraft('') }}
                  className="text-[9px] px-1.5 py-0.5 rounded border border-gray-700/40 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {relNoteSaved && !relNoteOpen && (
            <div className="text-[9px] text-emerald-400 flex items-center gap-1 pt-0.5">
              <span>✓</span>
              <span>Note added{invTitle ? ` to ${invTitle}` : ''}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Gap row ────────────────────────────────────────────────────────────────

function GapRow({ gap }: { gap: InvestigationGap }) {
  const color = GAP_COLOR[gap.severity]
  const hasAction = gap.prompt !== undefined
  return (
    <div className={clsx('flex items-start gap-2.5 px-3 py-2.5 rounded-lg border', color)}>
      <span className="text-xs shrink-0 mt-0.5">⚠</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-300 mb-1">{gap.description}</p>
        {hasAction ? (
          <button
            onClick={() => submitCommand(gap.prompt!, { source: 'investigation_quick_action' })}
            className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
          >
            {gap.suggestedAction} →
          </button>
        ) : (
          <p className="text-[10px] text-gray-600 italic">{gap.suggestedAction}</p>
        )}
      </div>
      <span className={clsx('text-[9px] px-1 py-0.5 rounded border shrink-0', color)}>
        {gap.severity}
      </span>
    </div>
  )
}

// ── Entity detail panel ───────────────────────────────────────────────────

function EntityDetailPanel({
  node,
  allNodes,
  relationships,
  inv,
  onClose,
  isReviewed,
  onMarkReviewed,
  onNavigateToArtifact,
}: {
  node: EvidenceNode
  allNodes: EvidenceNode[]
  relationships: EvidenceRelationship[]
  inv: Investigation
  onClose: () => void
  isReviewed: boolean
  onMarkReviewed: () => void
  onNavigateToArtifact?: (artifactId: string) => void
}) {
  const { addNote, activeInvestigationId } = useInvestigationStore()
  const [copied, setCopied] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)

  const relatedRels = relationships.filter(
    (r) => r.fromNodeId === node.id || r.toNodeId === node.id,
  )
  const sourceArtifacts = inv.artifacts.filter((a) => node.sourceArtifactIds.includes(a.id))
  const sourceNotes     = inv.notes.filter((n) => node.noteIds.includes(n.id))
  const aiActions       = quickActionsForNode(node)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(node.value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable (HTTP context)
    }
  }

  const handleSaveNote = () => {
    const text = noteDraft.trim()
    if (!text || !activeInvestigationId) return
    addNote(`Entity note — ${node.type} ${node.value}:\n${text}`)
    setNoteOpen(false)
    setNoteDraft('')
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2500)
  }

  return (
    <div className="border border-gray-700/60 rounded-xl bg-gray-900/80 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className={clsx('text-[10px] px-1.5 py-0.5 rounded border shrink-0', NODE_COLOR[node.type])}>
            {node.type}
          </span>
          <span className="text-sm font-mono text-white truncate">{node.value}</span>
          {node.inPinnedFinding && (
            <span className="text-[9px] px-1.5 py-0.5 rounded border text-amber-400 bg-amber-500/10 border-amber-500/25 shrink-0">
              pinned
            </span>
          )}
          {isReviewed && (
            <span className="text-[9px] px-1.5 py-0.5 rounded border text-emerald-400 bg-emerald-500/10 border-emerald-500/25 shrink-0">
              reviewed
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors text-lg leading-none shrink-0">
          ×
        </button>
      </div>

      {/* Analyst actions */}
      <div>
        <div className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest mb-1.5">
          Analyst Actions
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={handleCopy}
            className="text-[10px] px-2 py-1 rounded border text-gray-400 border-gray-600/40 bg-gray-800/40 hover:text-gray-200 hover:border-gray-500/60 transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy value'}
          </button>
          <button
            onClick={() => submitCommand(openInLogsPrompt(node), { source: 'investigation_quick_action' })}
            className="text-[10px] px-2 py-1 rounded border text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
          >
            Open in Logs →
          </button>
          <button
            onClick={() => { setNoteOpen((o) => !o); setNoteDraft('') }}
            className="text-[10px] px-2 py-1 rounded border text-cyan-400 border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
          >
            Add note
          </button>
          <button
            onClick={onMarkReviewed}
            className={clsx(
              'text-[10px] px-2 py-1 rounded border transition-colors',
              isReviewed
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20'
                : 'text-gray-400 border-gray-600/40 bg-gray-800/40 hover:text-gray-200 hover:border-gray-500/60',
            )}
          >
            {isReviewed ? '✓ Reviewed' : 'Mark reviewed'}
          </button>
        </div>

        {/* Note inline form */}
        {noteOpen && (
          <div className="mt-2 space-y-1.5">
            <div className="text-[9px] text-gray-600 font-mono px-0.5">
              Entity note — {node.type} {node.value}:
            </div>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Add your observation here…"
              rows={3}
              autoFocus
              className="w-full bg-transparent text-[11px] text-gray-200 placeholder-gray-600 resize-none outline-none border border-gray-700/40 rounded px-2 py-1.5 focus:border-cyan-500/40"
            />
            <div className="flex gap-1.5 items-center">
              <button
                onClick={handleSaveNote}
                disabled={!noteDraft.trim()}
                className="text-[10px] px-2 py-1 rounded bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/30 disabled:opacity-40 transition-colors"
              >
                Save note
              </button>
              <button
                onClick={() => { setNoteOpen(false); setNoteDraft('') }}
                className="text-[10px] px-2 py-1 rounded border border-gray-700/40 text-gray-500 hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {/* Save confirmation */}
        {noteSaved && !noteOpen && (
          <div className="mt-1.5 text-[10px] text-emerald-400 flex items-center gap-1">
            <span>✓</span>
            <span>Note added to {inv.title}</span>
          </div>
        )}
      </div>

      {/* AI-assisted actions */}
      <div>
        <div className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest mb-1.5">
          AI Actions
        </div>
        <div className="flex flex-wrap gap-1.5">
          {aiActions.map((a) => (
            <button
              key={a.label}
              onClick={() => submitCommand(a.prompt, { source: 'investigation_quick_action' })}
              className={clsx(
                'text-[10px] px-2 py-1 rounded border transition-colors hover:opacity-80',
                NODE_COLOR[node.type],
              )}
            >
              {a.label} →
            </button>
          ))}
        </div>
      </div>

      {/* Relationships */}
      {relatedRels.length > 0 && (
        <div>
          <div className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest mb-1.5">
            Relationships ({relatedRels.length})
          </div>
          <div className="space-y-1">
            {relatedRels.map((r) => {
              const isFrom = r.fromNodeId === node.id
              const otherNodeId = isFrom ? r.toNodeId : r.fromNodeId
              const other = allNodes.find((n) => n.id === otherNodeId)
              return (
                <div key={r.id} className="flex items-center gap-1.5 text-[10px] py-0.5 flex-wrap">
                  {!isFrom && other && (
                    <span className={clsx('px-1 py-0.5 rounded border text-[9px] shrink-0', NODE_COLOR[other.type])}>
                      {nodeLabel(other)}
                    </span>
                  )}
                  <span className="text-gray-600 shrink-0">→</span>
                  <span className="italic text-gray-400 shrink-0">{r.verb}</span>
                  {isFrom && other && (
                    <>
                      <span className="text-gray-600 shrink-0">→</span>
                      <span className={clsx('px-1 py-0.5 rounded border text-[9px] shrink-0', NODE_COLOR[other.type])}>
                        {nodeLabel(other)}
                      </span>
                    </>
                  )}
                  {r.sourceTable && (
                    <span className="text-blue-400 font-mono text-[9px] shrink-0">({r.sourceTable})</span>
                  )}
                  {r.provenanceType === 'pinned_finding' && (
                    <span className="text-amber-500 text-[9px] shrink-0">◈</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Source artifacts */}
      {sourceArtifacts.length > 0 && (
        <div>
          <div className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest mb-1.5">
            Source Artifacts ({sourceArtifacts.length})
          </div>
          <div className="space-y-1">
            {sourceArtifacts.map((a) => (
              <div key={a.id} className="text-[10px] text-gray-400 flex items-center gap-1.5">
                <span className="text-gray-600 shrink-0">
                  {a.type === 'query_result' ? '⊟' : a.type === 'timeline' ? '▶' : '◈'}
                </span>
                <span className="truncate flex-1">{a.title}</span>
                {onNavigateToArtifact && (
                  <button
                    onClick={() => onNavigateToArtifact(a.id)}
                    className="text-[9px] text-blue-400 hover:text-blue-300 transition-colors shrink-0"
                  >
                    Open →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source notes */}
      {sourceNotes.length > 0 && (
        <div>
          <div className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest mb-1.5">
            Mentioned in Notes
          </div>
          <div className="space-y-1">
            {sourceNotes.map((n) => (
              <div key={n.id} className="text-[10px] text-gray-400 truncate" title={n.content}>
                <span className="text-gray-600">✎ </span>
                {n.content.slice(0, 80)}{n.content.length > 80 ? '…' : ''}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main EvidenceGraph component ──────────────────────────────────────────

interface Props {
  inv: Investigation
  onNavigateToArtifact?: (artifactId: string) => void
}

export function EvidenceGraph({ inv, onNavigateToArtifact }: Props) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [expandedRelId,  setExpandedRelId]  = useState<string | null>(null)
  const { toggleReviewedEntity } = useInvestigationStore()

  // Persist reviewed state in investigation store (survives tab navigation)
  const reviewedNodeIds = new Set(inv.reviewedEntityNodeIds ?? [])
  const toggleReviewed = (nodeId: string) => toggleReviewedEntity(inv.id, nodeId)

  const evidence = useMemo(() => deriveEvidence(inv), [inv])
  const { nodes, relationships, gaps } = evidence

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null

  // Close detail panel if selected node no longer exists
  useEffect(() => {
    if (selectedNodeId && !nodes.find((n) => n.id === selectedNodeId)) {
      setSelectedNodeId(null)
    }
  }, [nodes, selectedNodeId])

  // Group nodes by type for the sidebar
  const groupedNodes = useMemo(() => {
    const order: string[] = ['user', 'host', 'ip', 'process', 'country', 'entity']
    const groups: Record<string, EvidenceNode[]> = {}
    for (const type of order) groups[type] = []
    for (const n of nodes) {
      if (groups[n.type]) groups[n.type].push(n)
      else groups['entity'].push(n)
    }
    return order.filter((t) => groups[t].length > 0).map((t) => ({ type: t, nodes: groups[t] }))
  }, [nodes])

  const nonSelfRels = relationships.filter((r) => r.fromNodeId !== r.toNodeId)

  // Evidence sources summary
  const qrArtifacts      = inv.artifacts.filter((a) => a.type === 'query_result')
  const handoffArtifacts = inv.artifacts.filter((a) => a.type === 'handoff' || a.type === 'documentation')

  return (
    <div className="space-y-5">

      {/* Entities + detail panel */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Entity sidebar — labeled "Evidence Nodes" to distinguish from case entities */}
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
              Evidence Nodes ({nodes.length})
            </div>
            <div className="text-[9px] text-gray-700">
              case entities: {inv.entities.length}
            </div>
          </div>
          {groupedNodes.map(({ type, nodes: group }) => (
            <div key={type}>
              <div className="text-[9px] text-gray-700 uppercase tracking-widest mb-1.5 pl-1">
                {type} ({group.length})
              </div>
              <div className="space-y-1">
                {group.map((node) => {
                  const reviewed = reviewedNodeIds.has(node.id)
                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNodeId((prev) => (prev === node.id ? null : node.id))}
                      className={clsx(
                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-colors',
                        selectedNodeId === node.id
                          ? 'border-blue-500/50 bg-blue-500/10'
                          : reviewed
                          ? 'border-emerald-500/20 bg-emerald-500/5 opacity-60'
                          : 'border-gray-800/60 bg-gray-900/40 hover:border-gray-700/60 hover:bg-gray-900/60',
                      )}
                    >
                      <span className="text-base leading-none shrink-0 opacity-70">
                        {NODE_ICON[node.type]}
                      </span>
                      <span className={clsx(
                        'flex-1 text-xs font-mono truncate',
                        reviewed ? 'line-through text-gray-500' : 'text-gray-200',
                      )}>
                        {nodeLabel(node)}
                      </span>
                      {node.inPinnedFinding && (
                        <span className="text-[9px] text-amber-500 shrink-0">◈</span>
                      )}
                      {reviewed && (
                        <span className="text-[9px] text-emerald-500 shrink-0">✓</span>
                      )}
                      {node.sourceArtifactIds.length > 0 && !reviewed && (
                        <span className="text-[9px] text-gray-600 shrink-0 font-mono">
                          {node.sourceArtifactIds.length}×
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Entity detail panel or relationship list */}
        <div>
          {selectedNode ? (
            <EntityDetailPanel
              node={selectedNode}
              allNodes={nodes}
              relationships={relationships}
              inv={inv}
              onClose={() => setSelectedNodeId(null)}
              isReviewed={reviewedNodeIds.has(selectedNode.id)}
              onMarkReviewed={() => toggleReviewed(selectedNode.id)}
              onNavigateToArtifact={onNavigateToArtifact}
            />
          ) : (
            <div className="space-y-2">
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                Relationships ({nonSelfRels.length})
              </div>
              {nonSelfRels.length === 0 ? (
                <p className="text-xs text-gray-700 py-4 text-center">
                  No relationships derived yet. Save query results or pin findings to extract entity connections.
                </p>
              ) : (
                <div className="space-y-1">
                  {nonSelfRels.map((r) => (
                    <RelationshipRow
                      key={r.id}
                      rel={r}
                      nodes={nodes}
                      isExpanded={expandedRelId === r.id}
                      onToggle={() => setExpandedRelId((prev) => (prev === r.id ? null : r.id))}
                      onNavigateToArtifact={onNavigateToArtifact}
                      invTitle={inv.title}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Investigation gaps */}
      <div className="space-y-2">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
          Investigation Gaps ({gaps.length})
        </div>
        {gaps.length === 0 ? (
          <div className="px-3 py-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-400">
            No modeled gaps detected — current SentinelIQ checks look complete.
          </div>
        ) : (
          <div className="space-y-1.5">
            {gaps.map((g) => (
              <GapRow key={g.id} gap={g} />
            ))}
          </div>
        )}
      </div>

      {/* Evidence sources */}
      {(qrArtifacts.length > 0 || inv.pinned_findings.length > 0 || inv.notes.length > 0 || handoffArtifacts.length > 0) && (
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
            Evidence Sources
          </div>
          <div className="flex flex-wrap gap-2">
            {qrArtifacts.length > 0 && (
              <span className="text-[10px] px-2 py-1 rounded border border-blue-500/20 bg-blue-500/5 text-blue-400">
                {qrArtifacts.length} query result{qrArtifacts.length > 1 ? 's' : ''}
              </span>
            )}
            {inv.pinned_findings.length > 0 && (
              <span className="text-[10px] px-2 py-1 rounded border border-amber-500/20 bg-amber-500/5 text-amber-400">
                {inv.pinned_findings.length} pinned finding{inv.pinned_findings.length > 1 ? 's' : ''}
              </span>
            )}
            {inv.notes.length > 0 && (
              <span className="text-[10px] px-2 py-1 rounded border border-cyan-500/20 bg-cyan-500/5 text-cyan-400">
                {inv.notes.length} note{inv.notes.length > 1 ? 's' : ''}
              </span>
            )}
            {handoffArtifacts.length > 0 && (
              <span className="text-[10px] px-2 py-1 rounded border border-gray-500/20 bg-gray-500/5 text-gray-400">
                {handoffArtifacts.length} report{handoffArtifacts.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
