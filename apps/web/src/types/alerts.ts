export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low'

export type AlertStatus =
  | 'open'
  | 'investigating'
  | 'acknowledged'
  | 'closed'
  | 'suppressed'
  | 'false_positive'
  | 'escalated'

export type AlertEntityType = 'user' | 'host' | 'ip' | 'service_account' | 'application'

export type AlertTriageScopeType = 'visible_open' | 'all_open' | 'selected'

export type TriageDisposition = 'likely_tp' | 'uncertain' | 'likely_fp'

export interface MockAlert {
  id: string
  name: string
  severity: AlertSeverity
  status: AlertStatus
  entity: string
  entityType: AlertEntityType
  detectionRule: string
  sourceProduct: string
  sourceTable: string
  createdAt: string
  updatedAt: string
  riskScore: number
  confidence: number
  tactics: string[]
  techniques: string[]
  relatedEntities: string[]
  linkedInvestigationId?: string
  triageDisposition?: TriageDisposition
  triageExplanation?: string
}

export interface AlertStats {
  total: number
  open: number
  investigating: number
  acknowledged: number
  closed: number
  suppressed: number
  false_positive: number
  escalated: number
  critical: number
  high: number
  medium: number
  low: number
}

export interface AlertTriageScope {
  scope: AlertTriageScopeType
  scopeLabel: string
  totalInScope: number
  processedCount: number
  isMockMode: boolean
}

export interface EnrichedTriageVerdict {
  alert_id: string
  alertName: string
  severity: AlertSeverity
  entity: string
  currentStatus: AlertStatus
  tp_probability: number
  fp_probability: number
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  influencing_fields: string[]
  suggestedStatus: AlertStatus
  triageDisposition: TriageDisposition
}

export interface ClientTriageResult {
  handler: 'triage'
  scope: AlertTriageScope
  verdicts: EnrichedTriageVerdict[]
  total_alerts: number
  likely_tp: number
  likely_fp: number
  uncertain: number
  duration_ms: number
}
