import { useState } from 'react'
import type { QueryPlan, RenderedQuery, ValidationResult } from '../../types/queryPlan'
import { PLATFORM_NAMES } from '../../utils/siemAdapters'

interface Props {
  plan: QueryPlan
  rendered: RenderedQuery
  validation: ValidationResult
}

export function QueryPlanInspector({ plan, rendered, validation }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-t border-gray-700/50">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>Plan</span>
          {!validation.passed && (
            <span className="text-[9px] px-1.5 py-0.5 rounded border text-amber-400 border-amber-500/30 bg-amber-500/10">
              ⚠ {validation.warnings.length} warning{validation.warnings.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2.5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600 w-14 shrink-0">Intent:</span>
              <span className="text-gray-300 font-mono">{plan.intent}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600 w-14 shrink-0">Platform:</span>
              <span className="text-gray-300">{PLATFORM_NAMES[rendered.platform]}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600 w-14 shrink-0">Language:</span>
              <span className={`font-mono ${
                rendered.language === 'KQL'  ? 'text-blue-400' :
                rendered.language === 'SPL'  ? 'text-orange-400' :
                                               'text-green-400'
              }`}>{rendered.language}</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-gray-600 w-14 shrink-0">Source:</span>
              <span className="text-gray-300 font-mono truncate">{rendered.sourceName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600 w-14 shrink-0">Time:</span>
              <span className="text-gray-300">{plan.timeRange.display}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600 w-14 shrink-0">Goal:</span>
              <span className="text-gray-300 font-mono">{plan.dataGoal}</span>
            </div>
            {plan.entities.length > 0 && (
              <div className="col-span-2 flex items-start gap-1.5">
                <span className="text-gray-600 w-14 shrink-0 pt-0.5">Entities:</span>
                <div className="flex flex-wrap gap-1">
                  {plan.entities.map((e, i) => (
                    <span key={i} className="inline-flex items-center gap-0.5 text-[9px]">
                      <span className="text-gray-600">{e.type}:</span>
                      <span className="text-gray-300 font-mono">{e.value}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-[10px] text-gray-600 italic leading-relaxed">{plan.explanation}</p>

          <div className="space-y-1 pt-1 border-t border-gray-800/40">
            {validation.checks.map((check, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[10px]">
                <span className={check.passed ? 'text-green-500' : 'text-amber-400'}>
                  {check.passed ? '✓' : '⚠'}
                </span>
                <span className="text-gray-600 shrink-0">{check.name}:</span>
                <span className={check.passed ? 'text-gray-500' : 'text-amber-300'}>
                  {check.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
