import type { RunbookResult, RunbookStep } from '../../types'

interface Props {
  result: RunbookResult
}

function StepCard({ step, isLast }: { step: RunbookStep; isLast: boolean }) {
  return (
    <div className="flex gap-3">
      {/* Connector column */}
      <div className="flex flex-col items-center shrink-0">
        <span className="w-7 h-7 rounded-full bg-blue-600/20 border-2 border-blue-500/40 flex items-center justify-center text-xs font-bold font-mono text-blue-400 shrink-0">
          {step.step_number}
        </span>
        {!isLast && <div className="flex-1 w-px bg-gray-700/40 mt-1.5 mb-1" />}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 rounded-lg bg-gray-800/30 border border-gray-700/30 px-3.5 py-2.5 ${isLast ? '' : 'mb-1'}`}>
        <div className="text-sm font-semibold text-gray-200 mb-1.5 leading-snug">{step.action}</div>
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
          <span className="font-mono bg-gray-800/60 border border-gray-700/40 px-1.5 py-0.5 rounded text-gray-400">{step.role_owner}</span>
          <span className="text-gray-600">·</span>
          <span className="font-mono text-gray-500">{step.estimated_minutes}m</span>
        </div>
        {step.tools_commands.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {step.tools_commands.map((t, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md text-xs font-mono bg-gray-900/60 border border-gray-700/50 text-cyan-400/80">
                {t}
              </span>
            ))}
          </div>
        )}
        {step.decision_branch && (
          <div className="flex items-start gap-1.5 text-xs text-amber-400/80 bg-amber-950/15 border border-amber-500/15 rounded px-2 py-1.5 mt-1">
            <span className="shrink-0 font-mono">⤷</span>
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
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/50 bg-gray-900/60">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full bg-purple-500/70" />
          <span className="text-sm font-semibold text-white tracking-tight">{result.title}</span>
          <span className="px-2 py-0.5 rounded-md text-xs border text-purple-400 border-purple-500/40 bg-purple-500/10 font-medium">
            {result.scenario}
          </span>
        </div>
        <span className="text-xs text-gray-500 font-mono">{result.duration_ms}ms</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-blue-500/8 border border-blue-500/20 px-3 py-2.5 text-center">
            <div className="text-2xl font-bold text-blue-400 font-mono">{result.steps.length}</div>
            <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Steps</div>
          </div>
          <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/20 px-3 py-2.5 text-center">
            <div className="text-2xl font-bold text-emerald-400 font-mono">{result.estimated_total_minutes}</div>
            <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Est. Minutes</div>
          </div>
          <div className="rounded-lg bg-gray-800/60 border border-gray-700/40 px-3 py-2.5 text-center">
            <div className="text-sm font-semibold text-gray-300 font-mono truncate mt-1">{result.alert_type}</div>
            <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Alert Type</div>
          </div>
        </div>

        {/* Narrative */}
        <div className="rounded-lg bg-gray-800/40 border border-gray-700/40 p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-0.5 h-3 rounded-full bg-purple-500/60" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Overview</span>
          </div>
          <p className="text-sm text-gray-200 leading-relaxed">{result.narrative}</p>
        </div>

        {/* Steps */}
        <div>
          <div className="flex items-center gap-1.5 mb-4">
            <div className="w-0.5 h-3 rounded-full bg-blue-500/60" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Response Steps</span>
          </div>
          <div className="space-y-0">
            {result.steps.map((step, idx) => (
              <StepCard
                key={step.step_number}
                step={step}
                isLast={idx === result.steps.length - 1}
              />
            ))}
          </div>
        </div>

        {/* ATT&CK techniques */}
        {result.related_techniques.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-0.5 h-3 rounded-full bg-orange-500/60" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">ATT&amp;CK Techniques</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.related_techniques.map((t, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md text-xs font-mono border text-orange-400 border-orange-500/30 bg-orange-500/10">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Similar incidents */}
        {result.similar_incidents.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-0.5 h-3 rounded-full bg-gray-500/40" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Similar Past Incidents</span>
            </div>
            <div className="space-y-1">
              {result.similar_incidents.map((inc, i) => (
                <div key={i} className="flex items-start gap-2 text-xs rounded-lg bg-gray-800/20 border border-gray-700/20 px-3 py-2">
                  <span className="text-gray-600 shrink-0 mt-0.5 font-mono">▸</span>
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
