/**
 * Vendor-neutral normalized security event model (v1.3.0).
 *
 * This is the common shape that every connector (mock today, real Sentinel/Splunk/Elastic/EDR
 * later) normalizes its raw records into. Downstream — alerts, query results, evidence — reads
 * this neutral model, so the investigation layer never depends on a specific SIEM schema.
 *
 *   Connector source → raw record → NormalizedSecurityEvent → alerts / query rows / evidence
 */

export type SourcePlatform =
  | 'mock'
  | 'sentinel'
  | 'splunk'
  | 'elastic'
  | 'defender'
  | 'crowdstrike'
  | 'okta'
  | 'generic'

export type EventCategory =
  | 'authentication'
  | 'process'
  | 'network'
  | 'identity'
  | 'cloud'
  | 'alert'
  | 'file'
  | 'dns'
  | 'email'
  | 'rule'

export type EventSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational'

export interface NormalizedSecurityEvent {
  id: string
  timestamp: string
  /** Where the record came from (neutral platform tag). */
  sourcePlatform: SourcePlatform
  /** Human product name, e.g. "Azure AD", "Microsoft Defender". */
  sourceProduct: string
  /** Connector-level source type, e.g. "SIEM", "EDR", "IdP". */
  sourceType: string
  /** The originating table (Sentinel), index (Splunk/Elastic), or stream. */
  sourceTableOrIndex: string
  eventCategory: EventCategory
  eventName: string
  severity?: EventSeverity
  // Common normalized entity fields (all optional — populated when present).
  user?: string
  host?: string
  ip?: string
  process?: string
  commandLine?: string
  country?: string
  eventId?: string
  ruleName?: string
  tactic?: string
  technique?: string
  /** Original raw record, retained for provenance / drill-down. */
  raw?: Record<string, unknown>
  /** Any extra normalized key/values not covered by the common fields. */
  normalizedFields?: Record<string, string | number | null>
  linkedAlertIds?: string[]
  linkedInvestigationIds?: string[]
}
