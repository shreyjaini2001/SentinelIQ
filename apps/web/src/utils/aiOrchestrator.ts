import type { AiOrchestrationResult, AiTraceStep } from '../types/aiOrchestration'
import { buildContextBundle } from './contextBuilder'
import { applyRedactionToBundle } from './privacyRedaction'
import { MockModelProvider } from './mockModelProvider'
import { useInvestigationStore } from '../stores/investigationStore'

const HANDLER_INTENT: Record<string, string> = {
  documentation:              'documentation',
  handoff:                    'handoff',
  timeline:                   'timeline',
  blast_radius:               'blast_radius',
  triage:                     'triage',
  hunt:                       'hunt',
  comparative:                'comparative',
  rule_suggestion:            'rule_suggestion',
  runbook:                    'runbook',
  noise_coaching:             'noise_coaching',
  query:                      'query',
  evidence_summary:           'evidence_summary',
  relationship_investigation: 'relationship_investigation',
}

const HANDLER_LABEL: Record<string, string> = {
  documentation:              'Documentation Generation',
  handoff:                    'Shift Handoff Briefing',
  timeline:                   'Timeline Reconstruction',
  blast_radius:               'Blast Radius Analysis',
  triage:                     'Alert Triage',
  hunt:                       'Threat Hunt',
  comparative:                'Behavioral Analysis',
  rule_suggestion:            'Detection Rule Suggestion',
  runbook:                    'Runbook Generation',
  noise_coaching:             'Noise Coaching',
  query:                      'Query Generation',
  evidence_summary:           'Evidence Summary',
  relationship_investigation: 'Relationship Investigation',
}

export function buildOrchestrationForAction(
  handler: string,
  prompt: string,
): AiOrchestrationResult {
  const { investigations, activeInvestigationId } = useInvestigationStore.getState()
  const activeInv = investigations.find((i) => i.id === activeInvestigationId) ?? null
  const intent = HANDLER_INTENT[handler] ?? handler
  const intentLabel = HANDLER_LABEL[handler] ?? handler

  const steps: AiTraceStep[] = []

  // 1. Classify intent
  steps.push({
    step: 1,
    label: 'Classify intent',
    detail: `Handler: "${handler}" → intent: "${intent}"`,
  })

  // 2. Select investigation
  steps.push({
    step: 2,
    label: 'Select investigation',
    detail: activeInv
      ? `Active: ${activeInv.id} — "${activeInv.title}"`
      : 'No active investigation — standalone context',
  })

  // 3. Load context
  const rawBundle = buildContextBundle(activeInv, handler, 'redact_sensitive')
  const kindSet = [...new Set(rawBundle.items.map((i) => i.kind))]
  steps.push({
    step: 3,
    label: 'Load context',
    detail: rawBundle.items.length > 0
      ? `${rawBundle.items.length} items (${kindSet.join(', ')})`
      : 'No context items loaded',
  })

  // 4. Apply redaction
  const { bundle, findings } = applyRedactionToBundle(rawBundle)
  steps.push({
    step: 4,
    label: 'Apply redaction',
    detail: findings.length > 0
      ? `${findings.length} sensitive values redacted (policy: redact_sensitive)`
      : 'No sensitive values detected',
  })

  // 5. Generate mock response
  MockModelProvider.generate(prompt, intent)
  steps.push({
    step: 5,
    label: 'Generate mock response',
    detail: `${MockModelProvider.name} · mode: ${MockModelProvider.mode}`,
  })

  // 6. Await explicit save
  steps.push({
    step: 6,
    label: 'Await explicit save',
    detail: 'Waiting for analyst to save, pin, or dismiss result',
  })

  return {
    intent: intentLabel,
    contextBundle: bundle,
    privacyFindings: findings,
    executionTrace: { steps },
    modelName: MockModelProvider.name,
    modelMode: MockModelProvider.mode,
    hasActiveInvestigation: activeInv !== null,
  }
}
