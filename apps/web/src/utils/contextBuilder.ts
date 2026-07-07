import type { Investigation } from '../types/investigation'
import type { AiContextBundle, AiContextItem, AiRedactionPolicy } from '../types/aiOrchestration'

const HANDLER_CONTEXT_POLICY: Record<string, Array<AiContextItem['kind']>> = {
  documentation:              ['turn', 'artifact', 'note', 'finding'],
  handoff:                    ['turn', 'artifact', 'finding', 'note'],
  timeline:                   ['turn', 'artifact', 'entity'],
  blast_radius:               ['artifact', 'entity'],
  triage:                     ['turn', 'artifact'],
  hunt:                       ['turn', 'artifact'],
  comparative:                ['turn', 'artifact'],
  rule_suggestion:            ['artifact', 'finding'],
  runbook:                    ['artifact', 'finding'],
  noise_coaching:             ['artifact', 'finding'],
  query:                      ['turn', 'entity'],
  evidence_summary:           ['turn', 'artifact', 'finding', 'entity'],
  relationship_investigation: ['turn', 'artifact', 'entity'],
}

export function buildContextBundle(
  inv: Investigation | null,
  taskType: string,
  policy: AiRedactionPolicy,
): AiContextBundle {
  if (!inv) {
    return {
      investigationId: null,
      investigationTitle: null,
      items: [],
      policy,
      redactionCount: 0,
      taskType,
    }
  }

  const allowedKinds: Array<AiContextItem['kind']> =
    HANDLER_CONTEXT_POLICY[taskType] ?? ['turn', 'artifact', 'note', 'finding']
  const items: AiContextItem[] = []

  if (allowedKinds.includes('turn')) {
    for (const t of inv.turns) {
      items.push({ kind: 'turn', id: t.id, summary: t.user_text, redacted: false })
    }
  }

  if (allowedKinds.includes('artifact')) {
    for (const a of inv.artifacts.filter((x) => x.pinned)) {
      items.push({ kind: 'artifact', id: a.id, summary: a.title, redacted: false })
    }
  }

  if (allowedKinds.includes('note')) {
    for (const n of inv.notes) {
      items.push({ kind: 'note', id: n.id, summary: n.content, redacted: false })
    }
  }

  if (allowedKinds.includes('finding')) {
    inv.pinned_findings.forEach((f, i) => {
      items.push({ kind: 'finding', id: `finding-${i}`, summary: f, redacted: false })
    })
  }

  if (allowedKinds.includes('entity')) {
    inv.entities.forEach((e, i) => {
      items.push({ kind: 'entity', id: `entity-${i}`, summary: e, redacted: false })
    })
  }

  return {
    investigationId: inv.id,
    investigationTitle: inv.title,
    items,
    policy,
    redactionCount: 0,
    taskType,
  }
}
