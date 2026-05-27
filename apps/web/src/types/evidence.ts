export type EntityNodeType = 'user' | 'host' | 'ip' | 'process' | 'country' | 'entity'

export interface EvidenceNode {
  id: string
  type: EntityNodeType
  value: string
  sourceArtifactIds: string[]
  sourceArtifactTitles: string[]
  noteIds: string[]
  inPinnedFinding: boolean
}

export type ProvenanceType = 'pinned_finding' | 'query_result' | 'note' | 'artifact_title'

export interface EvidenceRelationship {
  id: string
  fromNodeId: string
  toNodeId: string
  verb: string
  /** Human-readable provenance description */
  provenance: string
  /** Machine-readable reference: 'pinned_finding' | `artifact:${id}` | `note:${id}` */
  provenanceRef: string
  provenanceType: ProvenanceType
  /** SIEM table the relationship was derived from */
  sourceTable?: string
  /** Artifact title that produced this relationship */
  artifactTitle?: string
  /** Artifact ID that produced this relationship */
  artifactId?: string
  /** Number of rows that support this relationship */
  rowCount?: number
  /** ISO timestamp when the supporting artifact was created */
  timestamp?: string
  /** SIEM platform that produced the supporting artifact (e.g. 'sentinel', 'splunk', 'elastic') */
  sourcePlatform?: string
  /** Query language used (e.g. 'KQL', 'SPL', 'ESQL') */
  queryLanguage?: string
  /** QueryPlan intent that produced this relationship (e.g. 'failed_logins') */
  queryPlanIntent?: string
}

export interface InvestigationGap {
  id: string
  description: string
  /** Human-readable label shown on the action button */
  suggestedAction: string
  /** Clean command to submit when the action button is clicked; if absent, gap is informational only */
  prompt?: string
  severity: 'high' | 'medium' | 'low'
}

export interface EvidenceTimelineEntry {
  id: string
  timestamp: string
  type: 'turn' | 'artifact' | 'note' | 'finding'
  title: string
  detail?: string
  mode?: 'query' | 'action' | 'refine'
  artifactType?: string
  relatedEntityValues: string[]
  sourceArtifactId?: string
  isPinned?: boolean
}

export interface DerivedEvidence {
  nodes: EvidenceNode[]
  relationships: EvidenceRelationship[]
  gaps: InvestigationGap[]
  timeline: EvidenceTimelineEntry[]
}
