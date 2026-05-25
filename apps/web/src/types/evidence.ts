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

export interface EvidenceRelationship {
  id: string
  fromNodeId: string
  toNodeId: string
  verb: string
  provenance: string
  provenanceRef: string
  timestamp?: string
}

export interface InvestigationGap {
  id: string
  description: string
  suggestedAction: string
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
