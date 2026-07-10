import { useState } from 'react'
import type { AiOrchestrationResult } from '../../types/aiOrchestration'

interface Props {
  orchestration: AiOrchestrationResult
}

export function ExecutionTrace({ orchestration }: Props) {
  const [open, setOpen] = useState(false)
  const { steps } = orchestration.executionTrace

  return (
    <div className="rounded-lg border border-gray-700/40 bg-gray-800/20 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold uppercase tracking-widest text-[9px]">Execution Trace</span>
          <span className="text-[9px] text-gray-600">{steps.length} steps</span>
        </div>
        <span className="text-gray-600">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-700/30 space-y-2">
          {steps.map((step) => (
            <div key={step.step} className="flex items-start gap-2.5">
              <span className="text-[9px] font-mono text-purple-400 w-4 shrink-0 font-bold pt-0.5">{step.step}.</span>
              <div>
                <div className="text-[10px] text-gray-300 font-medium">{step.label}</div>
                <div className="text-[9px] text-gray-600 mt-0.5">{step.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
