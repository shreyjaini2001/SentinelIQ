import type { AiOrchestrationResult } from '../../types/aiOrchestration'

interface Props {
  orchestration?: AiOrchestrationResult | null
}

export function ModelModeBadge({ orchestration }: Props) {
  const modelName  = orchestration?.modelName ?? 'Mock Orchestrator'
  const policy     = orchestration?.contextBundle.policy ?? 'redact_sensitive'
  const externalOff = orchestration?.modelMode !== 'external'

  const policyLabel =
    policy === 'redact_sensitive'   ? 'Redacted'
    : policy === 'allow_full_context' ? 'Full Context'
    : 'Local Only'

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-[10px] px-1.5 py-0.5 rounded border text-purple-400 border-purple-500/30 bg-purple-500/5 font-mono">
        {modelName}
      </span>
      <span className="text-[10px] px-1.5 py-0.5 rounded border text-amber-400 border-amber-500/30 bg-amber-500/5 font-mono">
        {policyLabel}
      </span>
      {externalOff && (
        <span className="text-[10px] px-1.5 py-0.5 rounded border text-gray-500 border-gray-700/40 bg-gray-800/40 font-mono">
          External: Off
        </span>
      )}
    </div>
  )
}
