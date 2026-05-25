import { useState, useMemo } from 'react'
import { clsx } from 'clsx'
import type { Investigation } from '../../types/investigation'
import type { EvidenceNode, EvidenceRelationship, InvestigationGap } from '../../types/evidence'
import { deriveEvidence } from '../../utils/evidenceGraph'
import { submitCommand } from '../../utils/commandRunner'

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

function nodeLabel(node: EvidenceNode): string {
  return node.value.length > 28 ? node.value.slice(0, 27) + '…' : node.value
}

function quickActionsForNode(node: EvidenceNode): { label: string; prompt: string }[] {
  const v = node.value
  switch (node.type) {
    case 'user':
      return [
        { label: 'Recent activity', prompt: `What did ${v} do in the last 24 hours?` },
        { label: 'Failed logins', prompt: `Show failed logins for ${v}` },
        { label: 'Blast radius', prompt: `What is the blast radius for ${v}?` },
      ]
    case 'host':
      return [
        { label: 'Process activity', prompt: `Show process execution on ${v}` },
        { label: 'Network connections', prompt: `Show outbound connections from ${v}` },
        { label: 'Logon events', prompt: `Who logged into ${v} in the last 24 hours?` },
      ]
    case 'ip':
      return [
        { label: 'Network traffic', prompt: `Show network events for ${v}` },
        { label: 'Connections from', prompt: `Which hosts connected to ${v}?` },
      ]
    case 'country':
      return [
        { label: 'Sign-ins from', prompt: `Show sign-ins from ${v}` },
      ]
    default:
      return [
        { label: 'Query activity', prompt: `Show activity for ${v}` },
      ]
  }
}

function EntityDetailPanel({
  node,
  relationships,
  inv,
  onClose,
}: {
  node: EvidenceNode
  relationships: EvidenceRelationship[]
  inv: Investigation
  onClose: () => void
}) {
  const relatedRels = relationships.filter(
    (r) => r.fromNodeId === node.id || r.toNodeId === node.id,
  )
  const sourceArtifacts = inv.artifacts.filter((a) =>
    node.sourceArtifactIds.includes(a.id),
  )
  const sourceNotes = inv.notes.filter((n) => node.noteIds.includes(n.id))
  const actions = quickActionsForNode(node)

  return (
    <div className="border border-gray-700/60 rounded-xl bg-gray-900/80 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={clsx('text-[10px] px-1.5 py-0.5 rounded border shrink-0', NODE_COLOR[node.type])}>
            {node.type}
          </span>
          <span className="text-sm font-mono text-white truncate">{node.value}</span>
          {node.inPinnedFinding && (
            <span className="text-[9px] px-1.5 py-0.5 rounded border text-amber-400 bg-amber-500/10 border-amber-500/25 shrink-0">
              pinned
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-600 hover:text-gray-300 transition-colors text-lg leading-none shrink-0"
        >
          ×
        </button>
      </div>

      {/* Quick actions */}
      <div>
        <div className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest mb-1.5">
          Quick Actions
        </div>
        <div className="flex flex-wrap gap-1.5">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => submitCommand(a.prompt, { source: 'investigation_quick_action' })}
              className={clsx(
                'text-[10px] px-2 py-1 rounded border transition-colors',
                NODE_COLOR[node.type],
                'hover:opacity-80',
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
            {relatedRels.map((r) => (
              <div key={r.id} className="flex items-start gap-1.5 text-[10px] text-gray-400">
                <span className="text-gray-600 shrink-0 mt-0.5">→</span>
                <span className="italic text-gray-500 shrink-0">{r.verb}</span>
                <span className="text-gray-600 truncate" title={r.provenance}>
                  ({r.provenanceRef})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source artifacts */}
      {sourceArtifacts.length > 0 && (
        <div>
          <div className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest mb-1.5">
            Source Artifacts
          </div>
          <div className="space-y-1">
            {sourceArtifacts.map((a) => (
              <div key={a.id} className="text-[10px] text-gray-400 flex items-center gap-1.5">
                <span className="text-gray-600">⊟</span>
                <span className="truncate">{a.title}</span>
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

function RelationshipRow({ rel, nodes }: { rel: EvidenceRelationship; nodes: EvidenceNode[] }) {
  const from = nodes.find((n) => n.id === rel.fromNodeId)
  const to = nodes.find((n) => n.id === rel.toNodeId)
  if (!from || !to || from.id === to.id) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/40 border border-gray-800/50 text-[11px]">
      <span className={clsx('px-1.5 py-0.5 rounded border text-[9px]', NODE_COLOR[from.type])}>
        {nodeLabel(from)}
      </span>
      <span className="text-gray-600 italic shrink-0">{rel.verb}</span>
      <span className={clsx('px-1.5 py-0.5 rounded border text-[9px]', NODE_COLOR[to.type])}>
        {nodeLabel(to)}
      </span>
    </div>
  )
}

function GapRow({ gap }: { gap: InvestigationGap }) {
  const color = GAP_COLOR[gap.severity]

  return (
    <div className={clsx('flex items-start gap-2.5 px-3 py-2.5 rounded-lg border', color)}>
      <span className="text-xs shrink-0 mt-0.5">⚠</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-300 mb-1">{gap.description}</p>
        <button
          onClick={() => submitCommand(gap.suggestedAction, { source: 'investigation_quick_action' })}
          className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
        >
          {gap.suggestedAction} →
        </button>
      </div>
      <span className={clsx('text-[9px] px-1 py-0.5 rounded border shrink-0', color)}>
        {gap.severity}
      </span>
    </div>
  )
}

interface Props {
  inv: Investigation
}

export function EvidenceGraph({ inv }: Props) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const evidence = useMemo(() => deriveEvidence(inv), [inv])
  const { nodes, relationships, gaps } = evidence

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null

  // Group nodes by type for sidebar display
  const groupedNodes = useMemo(() => {
    const order: string[] = ['user', 'host', 'ip', 'country', 'process', 'entity']
    const groups: Record<string, EvidenceNode[]> = {}
    for (const type of order) groups[type] = []
    for (const n of nodes) {
      if (groups[n.type]) groups[n.type].push(n)
      else groups['entity'].push(n)
    }
    return order.filter((t) => groups[t].length > 0).map((t) => ({ type: t, nodes: groups[t] }))
  }, [nodes])

  const nonSelfRelationships = relationships.filter(
    (r) => r.fromNodeId !== r.toNodeId,
  )

  return (
    <div className="space-y-5">
      {/* Entity nodes + detail panel */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Entity sidebar */}
        <div className="space-y-3">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
            Entities ({nodes.length})
          </div>
          {groupedNodes.map(({ type, nodes: group }) => (
            <div key={type}>
              <div className="text-[9px] text-gray-700 uppercase tracking-widest mb-1.5 pl-1">
                {type} ({group.length})
              </div>
              <div className="space-y-1">
                {group.map((node) => (
                  <button
                    key={node.id}
                    onClick={() =>
                      setSelectedNodeId((prev) => (prev === node.id ? null : node.id))
                    }
                    className={clsx(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-colors',
                      selectedNodeId === node.id
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : 'border-gray-800/60 bg-gray-900/40 hover:border-gray-700/60 hover:bg-gray-900/60',
                    )}
                  >
                    <span className="text-base leading-none shrink-0" style={{ opacity: 0.7 }}>
                      {NODE_ICON[node.type]}
                    </span>
                    <span className="flex-1 text-xs text-gray-200 font-mono truncate">
                      {nodeLabel(node)}
                    </span>
                    {node.inPinnedFinding && (
                      <span className="text-[9px] text-amber-500 shrink-0">◈</span>
                    )}
                    {node.sourceArtifactIds.length > 0 && (
                      <span className="text-[9px] text-gray-600 shrink-0 font-mono">
                        {node.sourceArtifactIds.length}×
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Entity detail panel or relationships */}
        <div>
          {selectedNode ? (
            <EntityDetailPanel
              node={selectedNode}
              relationships={relationships}
              inv={inv}
              onClose={() => setSelectedNodeId(null)}
            />
          ) : (
            <div className="space-y-3">
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                Relationships ({nonSelfRelationships.length})
              </div>
              {nonSelfRelationships.length === 0 ? (
                <p className="text-xs text-gray-700 py-4 text-center">
                  No relationships derived yet. Pin findings to extract entity connections.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {nonSelfRelationships.map((r) => (
                    <RelationshipRow key={r.id} rel={r} nodes={nodes} />
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
            No gaps detected — investigation coverage looks complete.
          </div>
        ) : (
          <div className="space-y-1.5">
            {gaps.map((g) => (
              <GapRow key={g.id} gap={g} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
