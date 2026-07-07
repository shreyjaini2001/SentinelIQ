import { MOCK_NOW } from './mockClock'
import { useInvestigationStore } from '../stores/investigationStore'

export interface EvidenceSummaryResult {
  handler: 'evidence_summary'
  entity: string
  entityType: 'user' | 'host' | 'ip' | 'process' | 'unknown'
  title: string
  summary: string
  lines: string[]
  recommended: string[]
  timestamp: string
}

export interface RelationshipInvestigationResult {
  handler: 'relationship_investigation'
  fromEntity: string
  toEntity: string
  title: string
  summary: string
  lines: string[]
  recommended: string[]
  timestamp: string
}

export type EvidenceActionMatch =
  | { type: 'entity_summary'; entity: string }
  | { type: 'relationship'; fromEntity: string; toEntity: string }

export function detectEvidenceAction(text: string): EvidenceActionMatch | null {
  const t = text.trim()

  const relMatch = /^investigate relationship between (.+?) and (.+?)$/i.exec(t)
  if (relMatch) return { type: 'relationship', fromEntity: relMatch[1].trim(), toEntity: relMatch[2].trim() }

  const sumMatch = /^summarize evidence for (.+?)$/i.exec(t)
  if (sumMatch) return { type: 'entity_summary', entity: sumMatch[1].trim() }

  const actMatch = /^summarize activity for (.+?)$/i.exec(t)
  if (actMatch) return { type: 'entity_summary', entity: actMatch[1].trim() }

  const showMatch = /^show all activity for (?:user|host|ip)\s+(.+?)\s+in\b/i.exec(t)
  if (showMatch) return { type: 'entity_summary', entity: showMatch[1].trim() }

  return null
}

function classifyEntityType(value: string): EvidenceSummaryResult['entityType'] {
  if (value.includes('@')) return 'user'
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) return 'ip'
  if (/^(DESKTOP|SERVER|HOST|WS|DC|LAPTOP)-\w+$/i.test(value)) return 'host'
  if (/\.(exe|dll|ps1|bat|sh)$/i.test(value)) return 'process'
  return 'unknown'
}

function entityLines(entity: string, entityType: EvidenceSummaryResult['entityType']): string[] {
  if (entityType === 'user') {
    return [
      `SigninLogs: 14 successful logins, 3 failed attempts from unusual geolocation (RU)`,
      `SecurityEvent: Privilege escalation (EventID 4672) observed at 2026-05-10 07:22 UTC`,
      `DeviceLogonEvents: Interactive sessions on DESKTOP-001 and DESKTOP-042`,
      `SigninLogs: Impossible travel alert — consecutive logins from US (07:15) and RU (07:44)`,
    ]
  }
  if (entityType === 'host') {
    return [
      `DeviceProcessEvents: lsass.exe CreateRemoteThread observed — possible credential dump`,
      `DeviceNetworkEvents: 47 outbound connections to 23 unique IPs, 3 flagged as threat intel`,
      `SecurityEvent: Multiple EventID 4648 (explicit credential use) logged`,
      `DeviceLogonEvents: 3 unique users performed interactive sessions in the last 24h`,
    ]
  }
  if (entityType === 'ip') {
    return [
      `DeviceNetworkEvents: 12 hosts in environment contacted this IP`,
      `Threat intel: IP classified as C2 infrastructure (ThreatFox confidence: high)`,
      `First seen: 2026-05-08 03:17 UTC · Last seen: 2026-05-10 08:12 UTC`,
      `ASN: AS12345 DigitalOcean · Country: RU · Ports: 443, 4444`,
    ]
  }
  if (entityType === 'process') {
    return [
      `DeviceProcessEvents: Process observed on 3 endpoints in the last 48 hours`,
      `SecurityEvent: Process spawned by cmd.exe → powershell.exe parent chain`,
      `DeviceNetworkEvents: Outbound connection to flagged IP 185.220.101.45:4444`,
    ]
  }
  return [
    `Evidence found in ${entity} across investigation turns and artifacts`,
    `No entity-specific profile available — showing general indicators`,
  ]
}

function entityRecommended(entity: string, entityType: EvidenceSummaryResult['entityType']): string[] {
  if (entityType === 'user') {
    return [
      `Force password reset and revoke active sessions for ${entity}`,
      `Query: show all activity for ${entity} in the last 72 hours`,
      `Map blast radius: what systems did ${entity} access recently?`,
    ]
  }
  if (entityType === 'host') {
    return [
      `Isolate ${entity} from the network and initiate forensic imaging`,
      `Query: show credential dump events on ${entity}`,
      `Identify all users with interactive sessions on ${entity} in last 48h`,
    ]
  }
  if (entityType === 'ip') {
    return [
      `Block ${entity} at the perimeter firewall immediately`,
      `Identify all internal hosts that contacted ${entity}`,
      `Check threat intel feeds for additional context on this IP`,
    ]
  }
  return [
    `Investigate further with a targeted query for ${entity}`,
    `Check for related indicators in adjacent timeframe`,
  ]
}

export function generateEvidenceSummary(entity: string): EvidenceSummaryResult {
  const { investigations, activeInvestigationId } = useInvestigationStore.getState()
  const inv = investigations.find((i) => i.id === activeInvestigationId) ?? null
  const entityType = classifyEntityType(entity)

  const relatedTurnCount = inv
    ? inv.turns.filter((t) => t.user_text.toLowerCase().includes(entity.toLowerCase())).length
    : 0
  const relatedArtifactCount = inv
    ? inv.artifacts.filter((a) => a.title.toLowerCase().includes(entity.toLowerCase())).length
    : 0

  const lines: string[] = []
  if (inv && relatedTurnCount > 0)
    lines.push(`${relatedTurnCount} investigation quer${relatedTurnCount === 1 ? 'y' : 'ies'} referenced ${entity}`)
  if (inv && relatedArtifactCount > 0)
    lines.push(`${relatedArtifactCount} artifact${relatedArtifactCount === 1 ? '' : 's'} contain evidence about ${entity}`)
  lines.push(...entityLines(entity, entityType))

  const summary = inv
    ? `Evidence analysis for ${entity} across ${inv.turns.length} turn${inv.turns.length === 1 ? '' : 's'} and ${inv.artifacts.length} artifact${inv.artifacts.length === 1 ? '' : 's'} in "${inv.title}".`
    : `Evidence analysis for ${entity} — no active investigation. Showing fixture-based evidence.`

  return {
    handler: 'evidence_summary',
    entity,
    entityType,
    title: `Evidence Summary: ${entity}`,
    summary,
    lines,
    recommended: entityRecommended(entity, entityType),
    timestamp: MOCK_NOW,
  }
}

export function generateRelationshipInvestigation(
  fromEntity: string,
  toEntity: string,
): RelationshipInvestigationResult {
  const { investigations, activeInvestigationId } = useInvestigationStore.getState()
  const inv = investigations.find((i) => i.id === activeInvestigationId) ?? null

  const fromType = classifyEntityType(fromEntity)
  const toType = classifyEntityType(toEntity)

  const lines = [
    `Relationship established via DeviceLogonEvents and SigninLogs artifacts`,
    `${fromEntity} authenticated to ${toEntity} on 3 occasions in the last 72h`,
    `Most recent interaction: 2026-05-10 07:22 UTC (within investigation window)`,
    `Lateral movement indicators: EventID 4648 (explicit credentials) observed on this path`,
    `Network path: ${fromType === 'ip' || toType === 'ip' ? 'Direct IP-to-IP traffic detected' : 'Pass-the-hash pattern matches known LAPSUS$ technique T1550.002'}`,
  ]

  const recommended = [
    `Block lateral movement path between ${fromEntity} and ${toEntity}`,
    `Review all authentication events between these two entities`,
    `Check for additional entities in this hop chain`,
    `Correlate with threat intel for known attack patterns`,
  ]

  const summary = inv
    ? `Relationship between ${fromEntity} and ${toEntity} analyzed across ${inv.artifacts.length} artifact${inv.artifacts.length === 1 ? '' : 's'} in "${inv.title}".`
    : `Relationship between ${fromEntity} and ${toEntity} — showing fixture-based indicators.`

  return {
    handler: 'relationship_investigation',
    fromEntity,
    toEntity,
    title: `Relationship: ${fromEntity} → ${toEntity}`,
    summary,
    lines,
    recommended,
    timestamp: MOCK_NOW,
  }
}
