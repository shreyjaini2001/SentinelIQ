import type { AiOrchestrationResult } from '../../types/aiOrchestration'
import { ModelModeBadge } from './ModelModeBadge'
import { ContextUsedPanel } from './ContextUsedPanel'
import { ExecutionTrace } from './ExecutionTrace'
import { SaveAiOutputActions } from './SaveAiOutputActions'

interface Props {
  title: string
  summary: string
  lines: string[]
  recommended?: string[]
  orchestration: AiOrchestrationResult
  badge?: string
  badgeClass?: string
}

export function AiOutputPanel({
  title,
  summary,
  lines,
  recommended = [],
  orchestration,
  badge,
  badgeClass = 'text-purple-400 border-purple-500/40 bg-purple-500/10',
}: Props) {
  const content = [summary, ...lines, ...(recommended.length > 0 ? ['Recommended:', ...recommended.map((r, i) => `${i + 1}. ${r}`)] : [])].join('\n')

  return (
    <div data-testid="ai-output-panel" className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/50 bg-gray-900/60 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full bg-purple-500/70" />
          <span className="text-sm font-semibold text-white tracking-tight truncate max-w-xs">{title}</span>
          {badge && (
            <span className={`px-1.5 py-0.5 rounded border text-[10px] font-mono shrink-0 ${badgeClass}`}>
              {badge}
            </span>
          )}
        </div>
        <ModelModeBadge orchestration={orchestration} />
      </div>

      <div className="p-5 space-y-4">
        {/* Summary */}
        <div className="rounded-lg bg-gray-800/40 border border-gray-700/40 p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-0.5 h-3 rounded-full bg-purple-500/60" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Summary</span>
          </div>
          <p className="text-sm text-gray-200 leading-relaxed">{summary}</p>
        </div>

        {/* Evidence lines */}
        {lines.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-0.5 h-3 rounded-full bg-blue-500/60" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Evidence</span>
            </div>
            <div className="space-y-1.5">
              {lines.map((line, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs rounded-lg bg-gray-800/20 border border-gray-700/20 px-3 py-2">
                  <span className="text-blue-400/60 shrink-0 mt-0.5">▸</span>
                  <span className="text-gray-300 leading-relaxed">{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended actions */}
        {recommended.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-0.5 h-3 rounded-full bg-emerald-500/60" />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Recommended Next Steps</span>
            </div>
            <ol className="space-y-1.5">
              {recommended.map((action, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs rounded-lg bg-gray-800/20 border border-gray-700/20 px-3 py-2">
                  <span className="text-emerald-400 font-mono shrink-0 w-5 font-semibold">{i + 1}.</span>
                  <span className="text-gray-300 leading-relaxed">{action}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* AI Orchestration */}
        <div className="space-y-2 pt-1 border-t border-gray-800/60">
          <ContextUsedPanel orchestration={orchestration} />
          <ExecutionTrace orchestration={orchestration} />
          <SaveAiOutputActions orchestration={orchestration} content={content} />
        </div>
      </div>
    </div>
  )
}
