export type ArtifactType =
  | 'query'
  | 'query_result'
  | 'alert_triage'
  | 'hunt'
  | 'timeline'
  | 'blast_radius'
  | 'comparative_analysis'
  | 'rule_suggestion'
  | 'documentation'
  | 'handoff'
  | 'runbook'
  | 'noise_coaching'

export type InvestigationStatus = 'active' | 'closed' | 'pending'
export type InvestigationSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface Artifact {
  id: string
  type: ArtifactType
  title: string
  created_at: string
  data: unknown
  pinned: boolean
}

export interface Turn {
  id: string
  user_text: string
  mode: 'query' | 'action' | 'refine'
  created_at: string
  result_summary: string
  artifact_ids: string[]
}

export interface Note {
  id: string
  content: string
  created_at: string
  author: string
}

export interface Investigation {
  id: string
  title: string
  status: InvestigationStatus
  severity: InvestigationSeverity
  owner: string
  created_at: string
  updated_at: string
  entities: string[]
  alerts: string[]
  turns: Turn[]
  artifacts: Artifact[]
  pinned_findings: string[]
  notes: Note[]
  generated_reports: string[]
}
