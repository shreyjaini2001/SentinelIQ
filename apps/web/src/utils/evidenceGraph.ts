import type { Investigation } from '../types/investigation'
import type {
  EvidenceNode,
  EvidenceRelationship,
  InvestigationGap,
  EvidenceTimelineEntry,
  DerivedEvidence,
  EntityNodeType,
  ProvenanceType,
} from '../types/evidence'

// ── Lightweight type for query_result artifact data ────────────────────────

interface QueryResultData {
  columns?: string[]
  rows?: string[][]
  rowCount?: number
  sourceTable?: string
  extractedEntities?: Array<{ type: string; value: string }>
  kql?: string
  sourcePlatform?: string
  queryLanguage?: string
  queryPlan?: { intent?: string }
}

// ── Entity classification ──────────────────────────────────────────────────

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const IP_RE = /^\d{1,3}(\.\d{1,3}){3}(\/\d+)?$/
const HOST_RE = /^(DESKTOP|SERVER|WORKSTATION|DC|SRV|LAP|PC)[-_].+/i
const COUNTRY_RE = /^(Russia|China|Iran|North Korea|Ukraine|Romania|Brazil|India|Nigeria|Germany|France|United States|US|UK|Canada)$/i
const LOCATION_RE = /^[A-Z]{2}\s*\/\s*[A-Za-z\s]+$/  // e.g. "RU / Moscow"
const PROCESS_RE = /\.(exe|dll|ps1|bat|vbs|sh|py)$/i
const SHORT_USER_RE = /^[a-z][a-z0-9._-]{1,30}$/

export function classifyEntityString(value: string): EntityNodeType {
  if (EMAIL_RE.test(value)) return 'user'
  if (IP_RE.test(value)) return 'ip'
  if (HOST_RE.test(value)) return 'host'
  if (COUNTRY_RE.test(value)) return 'country'
  if (LOCATION_RE.test(value)) return 'country'
  if (PROCESS_RE.test(value)) return 'process'
  if (SHORT_USER_RE.test(value) && !value.includes('/')) return 'user'
  return 'entity'
}

// ── Node derivation ────────────────────────────────────────────────────────

function makeNodeId(value: string): string {
  return `node:${value.toLowerCase().replace(/[^a-z0-9@._/-]/g, '_')}`
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
    if (!value.trim()) return
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

  // 1. From investigation.entities[]
  for (const e of inv.entities) upsert(e)

  // 2. From artifact titles — verbatim entity matches
  for (const art of inv.artifacts) {
    for (const e of inv.entities) {
      if (art.title.includes(e)) upsert(e, art.id, art.title)
    }
  }

  // 3. From query_result artifact extractedEntities (deepest source)
  for (const art of inv.artifacts) {
    if (art.type !== 'query_result') continue
    const d = art.data as QueryResultData
    if (!d?.extractedEntities) continue
    for (const entity of d.extractedEntities) {
      if (entity.value) upsert(entity.value, art.id, art.title)
    }
    // Also extract additional entities from rows not captured in extractedEntities
    if (d.columns && d.rows && d.sourceTable) {
      for (const extra of extractAdditionalEntitiesFromRows(d.sourceTable, d.columns, d.rows)) {
        upsert(extra, art.id, art.title)
      }
    }
  }

  // 4. From pinned findings — entities in finding text + IPs + countries
  for (const finding of inv.pinned_findings) {
    for (const e of inv.entities) {
      if (finding.includes(e)) upsert(e, undefined, undefined, undefined, true)
    }
    const ipMatches = finding.match(/\d{1,3}(?:\.\d{1,3}){3}/g) ?? []
    for (const ip of ipMatches) upsert(ip, undefined, undefined, undefined, true)

    const countryMatch = finding.match(
      /\b(Russia|China|Iran|North Korea|Ukraine|Romania|Brazil|India|Nigeria|Germany|France|United States|US|UK|Canada)\b/i,
    )
    if (countryMatch) upsert(countryMatch[1], undefined, undefined, undefined, true)
  }

  // 5. From notes
  for (const note of inv.notes) {
    for (const e of inv.entities) {
      if (note.content.includes(e)) upsert(e, undefined, undefined, note.id)
    }
  }

  return [...map.values()]
}

// Extract any entity strings from rows that aren't already captured in extractedEntities
function extractAdditionalEntitiesFromRows(
  sourceTable: string,
  columns: string[],
  rows: string[][],
): string[] {
  const col = (name: string) => columns.findIndex((c) => c.toLowerCase() === name.toLowerCase())
  const extras: string[] = []

  if (sourceTable === 'SigninLogs') {
    const locIdx = col('Location')
    if (locIdx >= 0) {
      for (const row of rows) {
        const loc = row[locIdx]
        if (loc && !loc.includes('US')) extras.push(loc)
      }
    }
  }

  if (sourceTable === 'DeviceProcessEvents') {
    const fileIdx = col('FileName')
    if (fileIdx >= 0) {
      for (const row of rows) {
        const f = row[fileIdx]
        if (f) extras.push(f)
      }
    }
  }

  if (sourceTable === 'SecurityEvent') {
    const eidIdx = col('EventID')
    if (eidIdx >= 0) {
      for (const row of rows) {
        const eid = row[eidIdx]
        if (eid) extras.push(eid)
      }
    }
  }

  return extras
}

// ── Relationship derivation ────────────────────────────────────────────────

interface RelProvenance {
  provenance: string
  provenanceRef: string
  provenanceType: ProvenanceType
  sourceTable?: string
  artifactTitle?: string
  artifactId?: string
  rowCount?: number
  timestamp?: string
  sourcePlatform?: string
  queryLanguage?: string
  queryPlanIntent?: string
}

export function deriveRelationships(
  inv: Investigation,
  nodes: EvidenceNode[],
): EvidenceRelationship[] {
  const rels: EvidenceRelationship[] = []
  let seq = 0
  const seen = new Set<string>()  // dedup key: fromId|verb|toId

  const nodeByValue = new Map<string, EvidenceNode>()
  for (const n of nodes) nodeByValue.set(n.value.toLowerCase(), n)
  const lookupNode = (val: string) => nodeByValue.get(val.trim().toLowerCase())

  const addRel = (
    fromNode: EvidenceNode | undefined,
    toNode: EvidenceNode | undefined,
    verb: string,
    prov: RelProvenance,
  ) => {
    if (!fromNode || !toNode || fromNode.id === toNode.id) return
    const key = `${fromNode.id}|${verb}|${toNode.id}`
    if (seen.has(key)) return
    seen.add(key)
    rels.push({ id: `rel-${++seq}`, fromNodeId: fromNode.id, toNodeId: toNode.id, verb, ...prov })
  }

  // ── From pinned findings ────────────────────────────────────────────────

  const findingProv = (finding: string): RelProvenance => ({
    provenance: finding,
    provenanceRef: 'pinned_finding',
    provenanceType: 'pinned_finding',
  })

  // "Lateral movement: X → Y via Z"
  const lateralRe = /Lateral movement:\s*([^\s→]+)\s*→\s*([^\s]+)\s*via\s+(\S+)/i
  // "X signed in from Y (IP)" or "X signed in from Country (IP)"
  const signinRe = /(\S+@\S+|\S+)\s+signed in from\s+([^(]+?)(?:\s*\(([^)]+)\))?/i
  // "X used from Y"
  const usedFromRe = /(\S+)\s+used from\s+(\S+)/i

  for (const finding of inv.pinned_findings) {
    const lateralMatch = finding.match(lateralRe)
    if (lateralMatch) {
      addRel(
        lookupNode(lateralMatch[1]),
        lookupNode(lateralMatch[2]),
        `lateral movement via ${lateralMatch[3]}`,
        findingProv(finding),
      )
    }

    const signinMatch = finding.match(signinRe)
    if (signinMatch) {
      const actor = lookupNode(signinMatch[1])
      const locOrIp = signinMatch[3] ?? signinMatch[2].trim()
      const dest = lookupNode(locOrIp) ?? lookupNode(signinMatch[2].trim())
      addRel(actor, dest, 'signed in from', findingProv(finding))
    }

    const usedFromMatch = finding.match(usedFromRe)
    if (usedFromMatch) {
      addRel(lookupNode(usedFromMatch[1]), lookupNode(usedFromMatch[2]), 'used from', findingProv(finding))
    }
  }

  // ── From notes ─────────────────────────────────────────────────────────
  for (const note of inv.notes) {
    const prov: RelProvenance = {
      provenance: note.content,
      provenanceRef: `note:${note.id}`,
      provenanceType: 'note',
      timestamp: note.created_at,
    }
    // "X confirmed as" / "X escalating"
    for (const e1 of nodes) {
      for (const e2 of nodes) {
        if (e1.id === e2.id) continue
        if (
          note.content.includes(e1.value) &&
          note.content.includes(e2.value) &&
          e1.type === 'user' &&
          (e2.type === 'host' || e2.type === 'ip')
        ) {
          addRel(e1, e2, 'mentioned alongside', prov)
        }
      }
    }
  }

  // ── From query_result artifacts ─────────────────────────────────────────

  for (const art of inv.artifacts) {
    if (art.type !== 'query_result') continue
    const d = art.data as QueryResultData
    if (!d?.columns || !d.rows || !d.sourceTable) continue

    const prov: RelProvenance = {
      provenance: art.title,
      provenanceRef: `artifact:${art.id}`,
      provenanceType: 'query_result',
      sourceTable: d.sourceTable,
      artifactTitle: art.title,
      artifactId: art.id,
      rowCount: d.rowCount ?? d.rows.length,
      timestamp: art.created_at,
      sourcePlatform: d.sourcePlatform,
      queryLanguage: d.queryLanguage,
      queryPlanIntent: d.queryPlan?.intent,
    }

    const col = (name: string) =>
      d.columns!.findIndex((c) => c.toLowerCase() === name.toLowerCase())

    if (d.sourceTable === 'SigninLogs') {
      const upnIdx = col('UserPrincipalName')
      const ipIdx  = col('IPAddress')
      const locIdx = col('Location')
      for (const row of d.rows) {
        const user    = upnIdx >= 0 ? lookupNode(row[upnIdx]) : undefined
        const ip      = ipIdx  >= 0 ? lookupNode(row[ipIdx])  : undefined
        const country = locIdx >= 0 ? lookupNode(row[locIdx]) : undefined
        addRel(user, ip, 'signed in from', prov)
        if (country) addRel(user, country, 'associated with location', prov)
      }
    }

    if (d.sourceTable === 'DeviceProcessEvents') {
      const devIdx  = col('DeviceName')
      const userIdx = col('AccountName')
      const fileIdx = col('FileName')
      for (const row of d.rows) {
        const host    = devIdx  >= 0 ? lookupNode(row[devIdx])  : undefined
        const user    = userIdx >= 0 ? lookupNode(row[userIdx]) : undefined
        const process = fileIdx >= 0 ? lookupNode(row[fileIdx]) : undefined
        addRel(host, process, 'executed process', prov)
        addRel(user, process, 'launched process', prov)
      }
    }

    if (d.sourceTable === 'DeviceNetworkEvents') {
      const devIdx  = col('DeviceName')
      const ripIdx  = col('RemoteIP')
      for (const row of d.rows) {
        const host = devIdx >= 0 ? lookupNode(row[devIdx]) : undefined
        const ip   = ripIdx >= 0 ? lookupNode(row[ripIdx]) : undefined
        addRel(host, ip, 'connected to', prov)
      }
    }

    if (d.sourceTable === 'SecurityEvent') {
      const compIdx = col('Computer')
      const userIdx = col('AccountName')
      const eidIdx  = col('EventID')
      for (const row of d.rows) {
        const host    = compIdx >= 0 ? lookupNode(row[compIdx]) : undefined
        const user    = userIdx >= 0 ? lookupNode(row[userIdx]) : undefined
        const eventId = eidIdx  >= 0 ? lookupNode(row[eidIdx])  : undefined
        addRel(user, host, 'logged onto', prov)
        if (eventId) addRel(host, eventId, 'generated event', prov)
      }
    }

    if (d.sourceTable === 'DeviceLogonEvents') {
      const accIdx = col('AccountName')
      const devIdx = col('DeviceName')
      const remIdx = col('RemoteDeviceName')
      const devIdx2 = col('DeviceName')
      for (const row of d.rows) {
        const user    = accIdx  >= 0 ? lookupNode(row[accIdx])  : undefined
        const source  = devIdx  >= 0 ? lookupNode(row[devIdx])  : undefined
        const target  = remIdx  >= 0 ? lookupNode(row[remIdx])  : undefined
        if (user && source) addRel(user, source, 'logged onto', prov)
        if (source && target) addRel(source, target, 'laterally moved to', prov)
        if (!target && user && devIdx2 >= 0) {
          const dev = lookupNode(row[devIdx2])
          if (dev) addRel(user, dev, 'logged into', prov)
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
  const hasIpEntity = inv.entities.some((e) => IP_RE.test(e))
  const hasFinding = inv.pinned_findings.length > 0
  const primaryEntity = inv.entities[0] ?? 'the primary entity'
  const hostEntity = inv.entities.find((e) => /^(DESKTOP|SERVER|WORKSTATION)/i.test(e)) ?? 'DESKTOP-42'

  // Strict check: query_result artifact must exist for the given table AND have rows
  const hasQrEvidence = (table: string) =>
    inv.artifacts.some(
      (a) =>
        a.type === 'query_result' &&
        ((a.data as QueryResultData)?.sourceTable ?? '').toLowerCase() === table.toLowerCase() &&
        ((a.data as QueryResultData)?.rows?.length ?? 0) > 0,
    )

  if (!artifactTypes.has('timeline')) {
    gaps.push({
      id: 'gap-no-timeline',
      description: 'No attack timeline has been built for this investigation.',
      suggestedAction: 'Build attack timeline',
      prompt: `Build a timeline for ${primaryEntity}`,
      severity: 'high',
    })
  }

  if (!hasQrEvidence('DeviceProcessEvents')) {
    gaps.push({
      id: 'gap-no-process-query',
      description: 'No process execution evidence has been collected for entities in this investigation.',
      suggestedAction: `Query process activity — e.g. "Show PowerShell execution for ${hostEntity}"`,
      prompt: `Show PowerShell execution for ${hostEntity}`,
      severity: 'high',
    })
  }

  if (hasIpEntity && !hasQrEvidence('DeviceNetworkEvents')) {
    gaps.push({
      id: 'gap-no-network-query',
      description: 'IP entities are present but no network traffic evidence has been collected.',
      suggestedAction: `Query network events — e.g. "Show outbound connections from ${hostEntity}"`,
      prompt: `Show outbound connections from ${hostEntity}`,
      severity: 'medium',
    })
  }

  if (!artifactTypes.has('blast_radius')) {
    gaps.push({
      id: 'gap-no-blast-radius',
      description: 'Blast radius has not been assessed for this investigation.',
      suggestedAction: `Run blast radius — e.g. "What is the blast radius for ${primaryEntity}?"`,
      prompt: `What is the blast radius for ${primaryEntity}?`,
      severity: 'medium',
    })
  }

  const hasHandoff =
    artifactTypes.has('handoff') ||
    artifactTypes.has('documentation')
  if (!hasHandoff) {
    gaps.push({
      id: 'gap-no-handoff',
      description: 'No handoff or documentation artifact has been generated.',
      suggestedAction: 'Generate a shift handoff',
      prompt: 'Generate a shift handoff for this investigation',
      severity: 'low',
    })
  }

  if (hasFinding && inv.notes.length === 0) {
    gaps.push({
      id: 'gap-no-notes',
      description: 'Pinned findings exist but no analyst notes have been added.',
      suggestedAction: 'Add analyst notes to record investigation context.',
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
    const linkedArt = inv.artifacts.find((a) => turn.artifact_ids.includes(a.id))
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
