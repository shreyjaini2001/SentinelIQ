import { QueryPreviewCard } from './QueryPreviewCard'
import { AlertTriagePanel } from '../panels/AlertTriagePanel'
import { TriageResultPanel } from '../alerts/TriageResultPanel'
import { HuntResultPanel } from '../panels/HuntResultPanel'
import { TimelinePanel } from '../panels/TimelinePanel'
import { BlastRadiusPanel } from '../panels/BlastRadiusPanel'
import { DocumentationPanel } from '../panels/DocumentationPanel'
import { ComparativeAnalysisPanel } from '../panels/ComparativeAnalysisPanel'
import { RuleSuggestionPanel } from '../panels/RuleSuggestionPanel'
import { HandoffBriefingPanel } from '../panels/HandoffBriefingPanel'
import { RunbookPanel } from '../panels/RunbookPanel'
import { NoiseCoachingPanel } from '../panels/NoiseCoachingPanel'
import { AiOutputPanel } from '../ai/AiOutputPanel'
import { ModelModeBadge } from '../ai/ModelModeBadge'
import { ContextUsedPanel } from '../ai/ContextUsedPanel'
import { ExecutionTrace } from '../ai/ExecutionTrace'
import { SaveAiOutputActions } from '../ai/SaveAiOutputActions'
import { buildOrchestrationForAction } from '../../utils/aiOrchestrator'
import { useSessionStore } from '../../stores/sessionStore'
import type { AiOrchestrationResult } from '../../types/aiOrchestration'
import type {
  TriageResult, HuntResult, TimelineResult,
  BlastRadiusResult, DocumentationResult, ComparativeResult,
  RuleSuggestionResult, HandoffBriefingResult, RunbookResult, NoiseCoachingResult,
} from '../../types'
import type { EvidenceSummaryResult, RelationshipInvestigationResult } from '../../utils/evidenceActionGenerator'
import type { ClientTriageResult } from '../../types/alerts'

// Handlers whose panel embeds its own ContextUsedPanel + ExecutionTrace + SaveAiOutputActions.
const PANEL_INTEGRATED_HANDLERS = new Set([
  'documentation', 'handoff',
  'evidence_summary', 'relationship_investigation',
])

/** Render the dedicated panel for an action handler, or null if unrecognized. */
function renderActionPanel(
  handler: string,
  data: unknown,
  orchestration: AiOrchestrationResult | null,
) {
  switch (handler) {
    case 'triage': {
      const d = data as Record<string, unknown>
      if ('scope' in d) return <TriageResultPanel result={data as ClientTriageResult} />
      return <AlertTriagePanel result={data as TriageResult} />
    }
    case 'hunt':           return <HuntResultPanel result={data as HuntResult} />
    case 'timeline':       return <TimelinePanel result={data as TimelineResult} />
    case 'blast_radius':   return <BlastRadiusPanel result={data as BlastRadiusResult} />
    case 'documentation':  return <DocumentationPanel result={data as DocumentationResult} orchestration={orchestration ?? undefined} />
    case 'comparative':    return <ComparativeAnalysisPanel result={data as ComparativeResult} />
    case 'rule_suggestion':return <RuleSuggestionPanel result={data as RuleSuggestionResult} />
    case 'handoff':        return <HandoffBriefingPanel result={data as HandoffBriefingResult} orchestration={orchestration ?? undefined} />
    case 'runbook':        return <RunbookPanel result={data as RunbookResult} />
    case 'noise_coaching': return <NoiseCoachingPanel result={data as NoiseCoachingResult} />
    case 'evidence_summary': {
      if (!orchestration) return null
      const r = data as EvidenceSummaryResult
      return (
        <AiOutputPanel
          title={r.title} summary={r.summary} lines={r.lines} recommended={r.recommended}
          orchestration={orchestration}
          badge={r.entityType !== 'unknown' ? r.entityType : undefined}
        />
      )
    }
    case 'relationship_investigation': {
      if (!orchestration) return null
      const r = data as RelationshipInvestigationResult
      return (
        <AiOutputPanel
          title={r.title} summary={r.summary} lines={r.lines} recommended={r.recommended}
          orchestration={orchestration}
          badge="relationship"
          badgeClass="text-cyan-400 border-cyan-500/40 bg-cyan-500/10"
        />
      )
    }
    default:
      return null
  }
}

/**
 * Shared renderer for the current command result — the rich action panels and the
 * query preview card, plus AI orchestration metadata. Used inside CommandResultOverlay.
 *
 * Returns null when there is no renderable result (unrecognized handler → the caller's
 * text fallback handles it).
 */
export function CommandResultBody() {
  const { actionData, currentResult, submitHistory, setResult, setChips, setLogsKql } = useSessionStore()

  const orchestration: AiOrchestrationResult | null = actionData
    ? buildOrchestrationForAction(actionData.handler, submitHistory[0] ?? '')
    : null

  if (actionData) {
    const panel = renderActionPanel(actionData.handler, actionData.data, orchestration)
    if (!panel) return null // unrecognized handler → SearchBar shows the text fallback

    const showParentMeta = orchestration && !PANEL_INTEGRATED_HANDLERS.has(actionData.handler)

    return (
      <div className="space-y-3">
        {orchestration && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-gray-500">{orchestration.intent}</span>
            <span className="text-gray-700 text-[11px]">·</span>
            <ModelModeBadge orchestration={orchestration} />
          </div>
        )}

        {panel}

        {showParentMeta && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-0.5 h-3 rounded-full bg-purple-500/50" />
              <span className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest">AI Orchestration</span>
            </div>
            <ContextUsedPanel orchestration={orchestration!} />
            <ExecutionTrace orchestration={orchestration!} />
            <SaveAiOutputActions orchestration={orchestration!} />
          </div>
        )}
      </div>
    )
  }

  if (currentResult) {
    return (
      <QueryPreviewCard
        key={currentResult.query_id}
        result={currentResult}
        onDismiss={() => { setResult(null); setChips([]) }}
        onOpenInLogs={(kql) => { setLogsKql(kql); setResult(null); setChips([]) }}
      />
    )
  }

  return null
}
