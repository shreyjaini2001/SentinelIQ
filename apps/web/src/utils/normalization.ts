import type { MockAlert, AlertSeverity } from '../types/alerts'
import type { NormalizedSecurityEvent, EventSeverity } from '../types/events'

/**
 * Mapping utilities between the neutral NormalizedSecurityEvent and the existing domain
 * shapes (alerts, query rows, evidence entities). v1.3.0 introduces these as a preparation
 * layer — existing stores are untouched; these show the path a future ingestion pipeline
 * would use to feed alerts / query results / evidence from connector-normalized events.
 */

const ALERT_SEVERITY: Record<AlertSeverity, EventSeverity> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
}

function categoryForTable(table: string): NormalizedSecurityEvent['eventCategory'] {
  const t = table.toLowerCase()
  if (t.includes('signin') || t.includes('logon') || t.includes('auth')) return 'authentication'
  if (t.includes('process')) return 'process'
  if (t.includes('network')) return 'network'
  if (t.includes('identity')) return 'identity'
  if (t.includes('cloud') || t.includes('office') || t.includes('azure')) return 'cloud'
  if (t.includes('email')) return 'email'
  if (t.includes('dns')) return 'dns'
  if (t.includes('file')) return 'file'
  return 'alert'
}

/** A mock alert → the neutral event that "produced" it (alert-category event). */
export function alertToNormalizedEvent(alert: MockAlert): NormalizedSecurityEvent {
  const isUser = alert.entityType === 'user' || alert.entity.includes('@')
  const isHost = alert.entityType === 'host'
  const isIp = alert.entityType === 'ip'
  return {
    id: `EVT-${alert.id}`,
    timestamp: alert.createdAt,
    sourcePlatform: 'mock',
    sourceProduct: alert.sourceProduct,
    sourceType: 'SIEM',
    sourceTableOrIndex: alert.sourceTable,
    eventCategory: 'alert',
    eventName: alert.name,
    severity: ALERT_SEVERITY[alert.severity],
    user: isUser ? alert.entity : undefined,
    host: isHost ? alert.entity : undefined,
    ip: isIp ? alert.entity : undefined,
    ruleName: alert.detectionRule,
    tactic: alert.tactics[0],
    technique: alert.techniques[0],
    normalizedFields: { riskScore: alert.riskScore, confidence: alert.confidence, status: alert.status },
    linkedAlertIds: [alert.id],
    linkedInvestigationIds: alert.linkedInvestigationId ? [alert.linkedInvestigationId] : [],
  }
}

/** Neutral event → the partial alert shape a future ingestion pipeline would upsert. */
export function normalizedEventToAlert(evt: NormalizedSecurityEvent): Partial<MockAlert> {
  const sevMap: Record<EventSeverity, AlertSeverity> = {
    critical: 'critical', high: 'high', medium: 'medium', low: 'low', informational: 'low',
  }
  return {
    id: evt.linkedAlertIds?.[0] ?? evt.id,
    name: evt.eventName,
    severity: evt.severity ? sevMap[evt.severity] : 'medium',
    entity: evt.user ?? evt.host ?? evt.ip ?? 'unknown',
    detectionRule: evt.ruleName ?? evt.eventName,
    sourceProduct: evt.sourceProduct,
    sourceTable: evt.sourceTableOrIndex,
    createdAt: evt.timestamp,
    tactics: evt.tactic ? [evt.tactic] : [],
    techniques: evt.technique ? [evt.technique] : [],
  }
}

/** Neutral event → a flat display row (as the Logs/query result table renders). */
export function normalizedEventToQueryRow(evt: NormalizedSecurityEvent): Record<string, string> {
  return {
    TimeGenerated: evt.timestamp.replace('T', ' ').slice(0, 16),
    Source: evt.sourceTableOrIndex,
    Category: evt.eventCategory,
    User: evt.user ?? '—',
    Host: evt.host ?? '—',
    IP: evt.ip ?? '—',
    Process: evt.process ?? '—',
    Severity: evt.severity ?? '—',
  }
}

/** Neutral event → the strongest evidence entity it references (type + value). */
export function normalizedEventToEvidenceEntity(
  evt: NormalizedSecurityEvent,
): { type: 'user' | 'host' | 'ip' | 'process'; value: string } | null {
  if (evt.user) return { type: 'user', value: evt.user }
  if (evt.host) return { type: 'host', value: evt.host }
  if (evt.ip) return { type: 'ip', value: evt.ip }
  if (evt.process) return { type: 'process', value: evt.process }
  return null
}

export { categoryForTable }
