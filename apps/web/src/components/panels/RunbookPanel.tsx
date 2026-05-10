import type { RunbookResult, RunbookStep } from '../../types'

interface Props {
  result: RunbookResult
}

function StepCard({ step }: { step: RunbookStep }) {
  return (
    <div className="flex gap-3 rounded-lg bg-gray-800/40 border border-gray-700/30 px-3 py-2.5">
      <div className="flex flex-col items-center gap-1 shrink-0">
        <span className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-xs font-mono text-blue-300 font-medium">
          {step.step_number}
        </span>
        <div className="flex-1 w-px bg-gray-700/50" />
      </div>
      <div className="min-w-0 flex-1 pb-1">
        <div className="text-sm font-medium text-gray-200">{step.action}</div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-500">{step.role_owner}</span>
          <span className="text-xs text-gray-600">·</span>
          <span className="text-xs text-gray-500 font-mono">{step.estimated_minutes}m</span>
        </div>
        {step.tools_commands.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {step.tools_commands.map((t, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded text-xs font-mono bg-gray-900/60 border border-gray-700/40 text-gray-400">
                {t}
              </span>
            ))}
          </div>
        )}
        {step.decision_branch && (
          <div className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-400/80">
            <span className="shrink-0">⤷</span>
            <span>{step.decision_branch}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function RunbookPanel({ result }: Props) {
  return (
    <div data-testid="runbook-panel" className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-gray-900/50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">{result.title}</span>
          <span className="px-2 py-0.5 rounded text-xs border text-purple-400 border-purple-500/30 bg-purple-500/10">
            {result.scenario}
          </span>
        </div>
        <span className="text-xs text-gray-500">{result.duration_ms}ms</span>
      </div>

      <div className="p-4 space-y-5">
        {/* Summary row */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-blue-400 font-mono font-medium">{result.steps.length}</span>
            <span className="text-gray-500">steps</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-mono font-medium">{result.estimated_total_minutes}</span>
            <span className="text-gray-500">min est.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-300 font-mono font-medium">{result.alert_type}</span>
          </div>
        </div>

        {/* Narrative */}
        <div className="rounded-lg bg-gray-800/50 border border-gray-700/40 p-3">
          <div className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Overview</div>
          <p className="text-sm text-gray-200 leading-relaxed">{result.narrative}</p>
        </div>

        {/* Steps */}
        <div>
          <div className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
            Response Steps
          </div>
          <div className="space-y-1.5">
            {result.steps.map((step) => (
              <StepCard key={step.step_number} step={step} />
            ))}
          </div>
        </div>

        {/* Related techniques */}
        {result.related_techniques.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">ATT&amp;CK Techniques</div>
            <div className="flex flex-wrap gap-1.5">
              {result.related_techniques.map((t, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-xs font-mono border text-orange-400 border-orange-500/30 bg-orange-500/10">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Similar incidents */}
        {result.similar_incidents.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Similar Past Incidents</div>
            <div className="space-y-1">
              {result.similar_incidents.map((inc, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="text-gray-600 shrink-0 mt-0.5">▸</span>
                  <span className="text-gray-400">{inc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
