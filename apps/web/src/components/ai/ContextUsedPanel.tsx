import { useState } from 'react'
import type { AiOrchestrationResult } from '../../types/aiOrchestration'

interface Props {
  orchestration: AiOrchestrationResult
}

export function ContextUsedPanel({ orchestration }: Props) {
  const [open, setOpen] = useState(false)
  const { contextBundle } = orchestration

  const kindCounts = contextBundle.items.reduce<Record<string, number>>((acc, item) => {
    acc[item.kind] = (acc[item.kind] ?? 0) + 1
    return acc
  }, {})

  const policyLabel =
    contextBundle.policy === 'redact_sensitive'   ? 'redact_sensitive'
    : contextBundle.policy === 'allow_full_context' ? 'allow_full_context'
    : 'local_only'

  return (
    <div className="rounded-lg border border-gray-700/40 bg-gray-800/20 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold uppercase tracking-widest text-[9px]">Context Used</span>
          {contextBundle.redactionCount > 0 && (
            <span className="text-[9px] px-1 py-0.5 rounded border text-amber-400 border-amber-500/30 bg-amber-500/5">
              {contextBundle.redactionCount} redacted
            </span>
          )}
          <span className="text-[9px] text-gray-600">{contextBundle.items.length} items</span>
        </div>
        <span className="text-gray-600">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-gray-700/30">
          {contextBundle.investigationTitle && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold w-16 shrink-0">Case</span>
              <span className="text-[10px] text-gray-300 font-mono truncate">{contextBundle.investigationTitle}</span>
            </div>
          )}
          {Object.entries(kindCounts).map(([kind, count]) => (
            <div key={kind} className="flex items-center gap-2">
              <span className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold w-16 shrink-0">{kind}s</span>
              <span className="text-[10px] text-gray-400 font-mono">{count}</span>
            </div>
          ))}
          {contextBundle.items.length === 0 && (
            <div className="text-[10px] text-gray-600">No context items — no active investigation</div>
          )}
          <div className="flex items-center gap-2 pt-0.5 border-t border-gray-700/20 mt-1">
            <span className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold w-16 shrink-0">Privacy</span>
            <span className="text-[10px] text-gray-500 font-mono">{policyLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold w-16 shrink-0">Model</span>
            <span className="text-[10px] text-gray-500 font-mono">{orchestration.modelName} · {orchestration.modelMode}</span>
          </div>
        </div>
      )}
    </div>
  )
}
