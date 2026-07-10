import type { AiModelProvider } from '../types/aiOrchestration'

const MOCK_INTENT_OUTPUTS: Record<string, string> = {
  documentation:   'Mock documentation generated from investigation context. Sections synthesized from pinned artifacts and analyst notes.',
  handoff:         'Mock shift handoff briefing. Open items and SLA status derived from active investigation artifacts.',
  timeline:        'Mock timeline reconstructed from artifacts and query results across the active investigation.',
  blast_radius:    'Mock blast radius analysis for the identified seed entity based on investigation entities.',
  triage:          'Mock triage verdict applied to alert queue using investigation context.',
  hunt:            'Mock threat hunt result with evidence against known TTPs from investigation artifacts.',
  comparative:     'Mock behavioral analysis comparing entity activity against investigation baseline.',
  rule_suggestion: 'Mock detection rule generated from observed patterns in pinned investigation artifacts.',
  runbook:         'Mock runbook generated for the identified incident type from investigation findings.',
  noise_coaching:  'Mock noise reduction recommendations derived from alert pattern analysis.',
  query:           'Mock KQL query generated for the requested data scope and entity context.',
}

class MockModelProviderImpl implements AiModelProvider {
  readonly name = 'Mock Orchestrator'
  readonly mode = 'mock' as const

  generate(_prompt: string, intent: string): string {
    return MOCK_INTENT_OUTPUTS[intent] ?? `Mock response for intent: ${intent}`
  }
}

export const MockModelProvider: AiModelProvider = new MockModelProviderImpl()

// TODO: export class ClaudeProvider implements AiModelProvider — requires Anthropic API key
// TODO: export class LocalModelProvider implements AiModelProvider — requires local inference endpoint
