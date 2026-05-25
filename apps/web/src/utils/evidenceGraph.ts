import type { Investigation } from '../types/investigation'
import type {
  EvidenceNode,
  EvidenceRelationship,
  InvestigationGap,
  EvidenceTimelineEntry,
  DerivedEvidence,
  EntityNodeType,
} from '../types/evidence'

// ── Entity classification ──────────────────────────────────────────────────

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const IP_RE = /^\d{1,3}(\.\d{1,3}){3}(\/\d+)?$/
const HOST_RE = /^(DESKTOP|SERVER|WORKSTATION|DC|SRV|LAP|PC)[-_].+/i
const COUNTRY_RE = /^(Russia|China|Iran|North Korea|Ukraine|Romania|Brazil|India|Nigeria|Germany|France|United States|US|UK|Canada)$/i
const SHORT_USER_RE = /^[a-z][a-z0-9._-]{1,30}$/

export function classifyEntityString(value: string): EntityNodeType {
  if (EMAIL_RE.test(value)) return 'user'
  if (IP_RE.test(value)) return 'ip'
  if (HOST_RE.test(value)) return 'host'
  if (COUNTRY_RE.test(value)) return 'country'
  // Heuristic: short lowercase alphanumeric strings that look like usernames
  if (SHORT_USER_RE.test(value) && !value.includes('.exe') && !value.includes('/')) return 'user'
  return 'entity'
}

// ── Node derivation ────────────────────────────────────────────────────────

function makeNodeId(value: string): string {
  return `node:${value.toLowerCase().replace(/[^a-z0-9@._-]/g, '_')}`
}

export function deriveNodes(inv: Investigation): EvidenceNode[] {
  const map = new Map<string, EvidenceNode>()

  const upsert = (
    value: string,
    artifactId?: string,
    artifactTitle?: string,
    noteId?: string,
    inFinding?: boolean,
  ) => {
    const id = makeNodeId(value)
    const existing = map.get(id)
    if (existing) {
      if (artifactId && !existing.sourceArtifactIds.includes(artifactId)) {
        existing.sourceArtifactIds.push(artifactId)
        if (artifactTitle) existing.sourceArtifactTitles.push(artifactTitle)
      }
      if (noteId && !existing.noteIds.includes(noteId)) existing.noteIds.push(noteId)
      if (inFinding) existing.inPinnedFinding = true
    } else {
      map.set(id, {
        id,
        type: classifyEntityString(value),
        value,
        sourceArtifactIds: artifactId ? [artifactId] : [],
        sourceArtifactTitles: artifactTitle ? [artifactTitle] : [],
        noteIds: noteId ? [noteId] : [],
        inPinnedFinding: !!inFinding,
      })
    }
  }

  // From investigation.entities[]
  for (const e of inv.entities) {
    upsert(e)
  }

  // From artifact titles — pull any entity strings that appear verbatim
  for (const art of inv.artifacts) {
    for (const e of inv.entities) {
      if (art.title.includes(e)) {
        upsert(e, art.id, art.title)
      }
    }
  }

  // From pinned findings — tag entities that appear in finding text
  for (const finding of inv.pinned_findings) {
    for (const e of inv.entities) {
      if (finding.includes(e)) {
        upsert(e, undefined, undefined, undefined, true)
      }
    }
    // Also extract IP-like tokens not already in entities
    const ipMatches = finding.match(/\d{1,3}(?:\.\d{1,3}){3}/g) ?? []
    for (const ip of ipMatches) {
      upsert(ip, undefined, undefined, undefined, true)
    }
    // Extract country names
    const countryMatch = finding.match(
      /\b(Russia|China|Iran|North Korea|Ukraine|Romania|Brazil|India|Nigeria|Germany|France|United States|US|UK|Canada)\b/i,
    )
    if (countryMatch) {
      upsert(countryMatch[1], undefined, undefined, undefined, true)
    }
  }

  // From notes — tag entities mentioned in note body
  for (const note of inv.notes) {
    for (const e of inv.entities) {
      if (note.content.includes(e)) {
        upsert(e, undefined, undefined, note.id)
      }
    }
  }

  return [...map.values()]
}

// ── Relationship derivation ────────────────────────────────────────────────

export function deriveRelationships(
  inv: Investigation,
  nodes: EvidenceNode[],
): EvidenceRelationship[] {
  const rels: EvidenceRelationship[] = []
  let seq = 0

  const nodeByValue = new Map<string, EvidenceNode>()
  for (const n of nodes) nodeByValue.set(n.value.toLowerCase(), n)

  const lookupNode = (val: string) => nodeByValue.get(val.toLowerCase())

  // Pattern 1: "X → Y via Z" lateral movement pattern
  const lateralRe = /Lateral movement:\s*([^\s→]+)\s*→\s*([^\s]+)\s*via\s+(\S+)/i
  // Pattern 2: "X signed in from Y (IP)" or "X signed in from Country (IP)"
  const signinRe = /(\S+)\s+signed in from\s+([^(]+?)(?:\s*\(([^)]+)\))?/i
  // Pattern 3: "X used from unexpected host" → entity relationship
  const usedFromRe = /(\S+)\s+used from\s+(\S+)/i

  for (const finding of inv.pinned_findings) {
    const lateralMatch = finding.match(lateralRe)
    if (lateralMatch) {
      const from = lookupNode(lateralMatch[1])
      const to = lookupNode(lateralMatch[2])
      if (from && to) {
        rels.push({
          id: `rel-${++seq}`,
          fromNodeId: from.id,
          toNodeId: to.id,
          verb: `lateral movement via ${lateralMatch[3]}`,
          provenance: finding,
          provenanceRef: 'pinned_finding',
        })
      }
    }

    const signinMatch = finding.match(signinRe)
    if (signinMatch) {
      const actor = lookupNode(signinMatch[1])
      const locationOrIp = signinMatch[3] ?? signinMatch[2].trim()
      const location = lookupNode(locationOrIp) ?? lookupNode(signinMatch[2].trim())
      if (actor && location) {
        rels.push({
          id: `rel-${++seq}`,
          fromNodeId: actor.id,
          toNodeId: location.id,
          verb: 'signed in from',
          provenance: finding,
          provenanceRef: 'pinned_finding',
        })
      }
    }

    const usedFromMatch = finding.match(usedFromRe)
    if (usedFromMatch) {
      const actor = lookupNode(usedFromMatch[1])
      const target = lookupNode(usedFromMatch[2])
      if (actor && target) {
        rels.push({
          id: `rel-${++seq}`,
          fromNodeId: actor.id,
          toNodeId: target.id,
          verb: 'used from',
          provenance: finding,
          provenanceRef: 'pinned_finding',
        })
      }
    }
  }

  // Relationship from artifact: query referencing an entity
  for (const art of inv.artifacts) {
    for (const node of nodes) {
      if (
        art.title.includes(node.value) &&
        (art.type === 'query' || art.type === 'query_result')
      ) {
        // Only add if no duplicate rel already
        const duplicate = rels.some(
          (r) =>
            r.fromNodeId === `node:artifact:${art.id}` &&
            r.toNodeId === node.id,
        )
        if (!duplicate) {
          rels.push({
            id: `rel-${++seq}`,
            fromNodeId: node.id,
            toNodeId: node.id, // self-ref: query scoped to entity
            verb: `queried in ${art.title}`,
            provenance: art.title,
            provenanceRef: `artifact:${art.id}`,
          })
        }
      }
    }
  }

  return rels
}

// ── Gap detection ─────────────────────────────────────────────────────────

export function detectGaps(inv: Investigation): InvestigationGap[] {
  const gaps: InvestigationGap[] = []
  const artifactTypes = new Set(inv.artifacts.map((a) => a.type))
  const allKql = inv.artifacts
    .map((a) => {
      const d = a.data as Record<string, unknown>
      return typeof d?.kql === 'string' ? d.kql.toLowerCase() : ''
    })
    .join('\n')
  const allTurnText = inv.turns.map((t) => t.user_text.toLowerCase()).join('\n')
  const hasIpEntity = inv.entities.some((e) => IP_RE.test(e))
  const hasFinding = inv.pinned_findings.length > 0

  if (!artifactTypes.has('timeline')) {
    gaps.push({
      id: 'gap-no-timeline',
      description: 'No attack timeline has been built for this investigation.',
      suggestedAction: 'Build a timeline — e.g. "Build a timeline for jsmith@corp.com"',
      severity: 'high',
    })
  }

  const hasProcessQuery =
    allKql.includes('deviceprocessevents') ||
    allTurnText.includes('process') ||
    allTurnText.includes('powershell') ||
    allTurnText.includes('command')
  if (!hasProcessQuery) {
    gaps.push({
      id: 'gap-no-process-query',
      description: 'No process execution query has been run for entities in this investigation.',
      suggestedAction: 'Query process activity — e.g. "Show PowerShell execution for DESKTOP-42"',
      severity: 'high',
    })
  }

  if (hasIpEntity) {
    const hasNetworkQuery =
      allKql.includes('devicenetworkevents') ||
      allTurnText.includes('network') ||
      allTurnText.includes('outbound') ||
      allTurnText.includes('connection')
    if (!hasNetworkQuery) {
      gaps.push({
        id: 'gap-no-network-query',
        description: 'IP entities are present but no network traffic query has been run.',
        suggestedAction: 'Query network events — e.g. "Show outbound connections from DESKTOP-42"',
        severity: 'medium',
      })
    }
  }

  if (!artifactTypes.has('blast_radius')) {
    gaps.push({
      id: 'gap-no-blast-radius',
      description: 'Blast radius has not been assessed for this investigation.',
      suggestedAction: 'Run blast radius — e.g. "What is the blast radius for jsmith?"',
      severity: 'medium',
    })
  }

  if (!artifactTypes.has('handoff') && !artifactTypes.has('documentation')) {
    gaps.push({
      id: 'gap-no-handoff',
      description: 'No handoff or documentation artifact has been generated.',
      suggestedAction: 'Generate handoff — e.g. "Generate a shift handoff for this investigation"',
      severity: 'low',
    })
  }

  if (hasFinding && inv.notes.length === 0) {
    gaps.push({
      id: 'gap-no-notes',
      description: 'Pinned findings exist but no analyst notes have been added.',
      suggestedAction: 'Add a note to record analyst context or confirm entity status.',
      severity: 'low',
    })
  }

  return gaps
}

// ── Timeline derivation ───────────────────────────────────────────────────

function entitiesInText(text: string, entities: string[]): string[] {
  return entities.filter((e) => text.includes(e))
}

export function deriveTimeline(inv: Investigation): EvidenceTimelineEntry[] {
  const entries: EvidenceTimelineEntry[] = []

  for (const turn of inv.turns) {
    // Find linked artifacts
    const linkedArt = inv.artifacts.find(
      (a) => turn.artifact_ids.includes(a.id),
    )
    entries.push({
      id: `tl-turn-${turn.id}`,
      timestamp: turn.created_at,
      type: 'turn',
      title: turn.user_text,
      detail: turn.result_summary,
      mode: turn.mode,
      artifactType: linkedArt?.type,
      relatedEntityValues: entitiesInText(turn.user_text, inv.entities),
      sourceArtifactId: linkedArt?.id,
    })
  }

  // Notes
  for (const note of inv.notes) {
    entries.push({
      id: `tl-note-${note.id}`,
      timestamp: note.created_at,
      type: 'note',
      title: `Note by ${note.author}`,
      detail: note.content,
      relatedEntityValues: entitiesInText(note.content, inv.entities),
    })
  }

  // Pinned findings don't have timestamps; attach them to the investigation created_at
  // as anchored evidence markers
  for (let i = 0; i < inv.pinned_findings.length; i++) {
    const f = inv.pinned_findings[i]
    entries.push({
      id: `tl-finding-${i}`,
      timestamp: inv.created_at,
      type: 'finding',
      title: f,
      relatedEntityValues: entitiesInText(f, inv.entities),
      isPinned: true,
    })
  }

  // Sort ascending by timestamp
  entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  return entries
}

// ── Top-level derivation ──────────────────────────────────────────────────

export function deriveEvidence(inv: Investigation): DerivedEvidence {
  const nodes = deriveNodes(inv)
  const relationships = deriveRelationships(inv, nodes)
  const gaps = detectGaps(inv)
  const timeline = deriveTimeline(inv)
  return { nodes, relationships, gaps, timeline }
}
