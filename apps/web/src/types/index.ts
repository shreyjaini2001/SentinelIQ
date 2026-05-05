export type Mode = 'query' | 'action' | 'refine'

export interface DisambiguationChip {
  label: string
  mode: Mode
}

export interface ClassifyResult {
  mode: Mode
  intent_label: string
  confidence: number
  extracted_entities: string[]
  disambiguation_chips?: DisambiguationChip[]
}

export interface ClauseExplanation {
  clause: string
  plain_english: string
}

export interface QueryExplanation {
  summary: string
  clauses: ClauseExplanation[]
  assumptions: string[]
}

export interface EntityResult {
  type: string
  value: string
}

export interface TimeRange {
  start: string
  end: string
}

export interface QueryResult {
  query_id: string
  generated_query: string
  confidence: number
  explanation: QueryExplanation
  extracted_entities: EntityResult[]
  time_range: TimeRange | null
  session_updated: boolean
}

export interface SuggestionChip {
  id: string
  label: string
  type: 'query' | 'action'
  prompt_text: string
}

export interface AutocompleteCompletion {
  text: string
  source: 'history' | 'template' | 'team_pool'
  recency_score: number
}

export interface ActionProgressEvent {
  type: 'progress' | 'result' | 'error' | 'disambiguation'
  message?: string
  step?: number
  total_steps?: number
  output?: string
  handler?: string
  data?: unknown
  chips?: Array<{ handler: string; label: string }>
  code?: string
}

export interface TriageVerdict {
  alert_id: string
  fp_probability: number
  tp_probability: number
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  influencing_fields: string[]
}

export interface TriageResult {
  verdicts: TriageVerdict[]
  total_alerts: number
  likely_tp: number
  likely_fp: number
  uncertain: number
  duration_ms: number
}

export interface TechniqueResult {
  technique_id: string
  technique_name: string
  tactic: string
  evidence_level: 'confirmed' | 'suspected' | 'not_found'
  event_count: number
  kql_executed: string
}

export interface HuntResult {
  hunt_id: string
  threat_actor: string | null
  techniques_queried: number
  techniques_with_evidence: number
  technique_results: TechniqueResult[]
  narrative: string
  duration_ms: number
  time_window: string
}

export interface ActionData {
  handler: string
  data: unknown
}

export interface TimelineEvent {
  event_id: string
  timestamp: string
  source: string
  entity_type: string
  entity_value: string
  event_type: string
  raw_description: string
  tactic: string
  tactic_confidence: number
  normalized_timestamp: string
}

export interface StageAnnotation {
  tactic: string
  event_count: number
  first_seen: string
  last_seen: string
  plain_english_summary: string
}

export interface TimelineResult {
  timeline_id: string
  seed_entity: string
  window_start: string
  window_end: string
  total_events: number
  events: TimelineEvent[]
  stages: StageAnnotation[]
  sources_queried: string[]
  duration_ms: number
}

export interface BreadcrumbEntry {
  query_id: string
  original_text: string
  generated_query: string
  confidence: number
  timestamp: string
}

// ── Phase 2 types ─────────────────────────────────────────────────────────────

export interface ReachableAsset {
  asset_id: string
  asset_type: string
  name: string
  risk_level: 'critical' | 'high' | 'medium' | 'low'
  path: string
}

export interface BlastRadiusResult {
  blast_id: string
  seed_entity: string
  seed_entity_type: string
  total_reachable_assets: number
  reachable_assets: ReachableAsset[]
  privileged_paths: Array<{ from: string; to: string; path: string; attack_vector: string }>
  risk_score: number
  containment_steps: string[]
  estimated_scope: string
  duration_ms: number
}

export interface DocSection {
  heading: string
  body: string
}

export interface DocumentationResult {
  doc_id: string
  variant: 'technical' | 'executive' | 'regulatory'
  title: string
  sections: DocSection[]
  raw_markdown: string
  generated_at: string
  entity_scope: string
  duration_ms: number
}

export interface DeviationMetric {
  metric_name: string
  current_value: number
  baseline_value: number
  deviation_pct: number
  sigma: number
  anomaly: boolean
}

export interface ComparativeResult {
  comparative_id: string
  entity: string
  comparison_window: string
  metrics: DeviationMetric[]
  peer_percentile: number
  overall_deviation_score: number
  narrative: string
  duration_ms: number
}

export interface RuleBacktest {
  period: string
  alert_count: number
  tp_count: number
  fp_count: number
  estimated_fp_rate: number
}

export interface SimilarRule {
  rule_id: string
  name: string
  similarity_score: number
  technique_ids: string[]
}

export interface RuleSuggestionResult {
  suggestion_id: string
  rule_name: string
  rule_description: string
  kql: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  technique_ids: string[]
  mitre_tactics: string[]
  false_positive_guidance: string
  estimated_fp_rate: number
  backtest: RuleBacktest
  similar_rules: SimilarRule[]
  tuning_recommendations: string[]
  duration_ms: number
}
