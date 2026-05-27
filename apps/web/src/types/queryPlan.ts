export type SiemPlatform = 'sentinel' | 'splunk' | 'elastic'
export type QueryLanguage = 'KQL' | 'SPL' | 'ESQL'

export type QueryPlanIntent =
  | 'failed_logins'
  | 'user_activity'
  | 'host_activity'
  | 'ip_activity'
  | 'process_activity'
  | 'suspicious_powershell'
  | 'outbound_connections'
  | 'user_host_relationships'
  | 'identity_inventory'
  | 'observed_users'
  | 'host_inventory'
  | 'ip_inventory'
  | 'process_inventory'
  | 'local_admin_creation'
  | 'generic'

export type QueryEntityType = 'user' | 'host' | 'ip' | 'process' | 'country' | 'event_id'

export interface QueryPlanEntity {
  type: QueryEntityType
  value: string
}

export interface QueryPlan {
  intent: QueryPlanIntent
  entities: QueryPlanEntity[]
  timeRange: { value: string; display: string }
  dataGoal: 'query_preview' | 'result_table' | 'timeline' | 'relationship_map'
  requiredFields: string[]
  preferredSources: string[]
  explanation: string
}

export interface RenderedQuery {
  platform: SiemPlatform
  language: QueryLanguage
  query: string
  sourceName: string
  explanation: string
}

export interface FieldMapping {
  neutral: string
  platformField: string
}

export interface SourceDefinition {
  neutralName: string
  platformSource: string
}

export interface SiemAdapter {
  id: SiemPlatform
  name: string
  queryLanguage: QueryLanguage
  renderQuery: (plan: QueryPlan) => RenderedQuery
  getFieldMappings: () => FieldMapping[]
  getSupportedSources: () => SourceDefinition[]
}
