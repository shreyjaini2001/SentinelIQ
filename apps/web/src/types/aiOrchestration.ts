export type AiRedactionPolicy = 'local_only' | 'redact_sensitive' | 'allow_full_context'

export interface AiContextItem {
  kind: 'turn' | 'artifact' | 'note' | 'finding' | 'entity'
  id: string
  summary: string
  redacted: boolean
}

export interface AiContextBundle {
  investigationId: string | null
  investigationTitle: string | null
  items: AiContextItem[]
  policy: AiRedactionPolicy
  redactionCount: number
  taskType: string
}

export interface AiPrivacyFinding {
  type: 'email' | 'ip' | 'hostname' | 'hash' | 'command_line'
  value: string
  replacement: string
}

export interface AiTraceStep {
  step: number
  label: string
  detail: string
}

export interface AiExecutionTrace {
  steps: AiTraceStep[]
}

export interface AiOrchestrationResult {
  intent: string
  contextBundle: AiContextBundle
  privacyFindings: AiPrivacyFinding[]
  executionTrace: AiExecutionTrace
  modelName: string
  modelMode: 'mock' | 'local' | 'external'
  hasActiveInvestigation: boolean
}

export interface AiModelProvider {
  name: string
  mode: 'mock' | 'local' | 'external'
  generate(prompt: string, intent: string): string
}
