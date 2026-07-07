import { useState } from 'react'
import type { DocumentationResult } from '../../types'
import type { AiOrchestrationResult } from '../../types/aiOrchestration'
import { ContextUsedPanel } from '../ai/ContextUsedPanel'
import { ExecutionTrace } from '../ai/ExecutionTrace'
import { SaveAiOutputActions } from '../ai/SaveAiOutputActions'
import { useInvestigationStore } from '../../stores/investigationStore'

interface Props {
  result: DocumentationResult
  orchestration?: AiOrchestrationResult
}

const VARIANT_CONFIG: Record<string, { color: string; accent: string; dot: string }> = {
  technical:  { color: 'text-blue-400 border-blue-500/40 bg-blue-500/10',   accent: 'bg-blue-500/70',   dot: 'bg-blue-500'   },
  executive:  { color: 'text-purple-400 border-purple-500/40 bg-purple-500/10', accent: 'bg-purple-500/70', dot: 'bg-purple-500' },
  regulatory: { color: 'text-amber-400 border-amber-500/40 bg-amber-500/10', accent: 'bg-amber-500/70',  dot: 'bg-amber-500'  },
}

export function DocumentationPanel({ result, orchestration }: Props) {
  const [activeSection, setActiveSection] = useState<number | null>(null)
  const cfg = VARIANT_CONFIG[result.variant] ?? VARIANT_CONFIG.technical
  const { investigations, activeInvestigationId } = useInvestigationStore()
  const activeInv = investigations.find((i) => i.id === activeInvestigationId)

  return (
    <div data-testid="documentation-panel" className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/50 bg-gray-900/60">
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-5 rounded-full ${cfg.accent}`} />
          <span className="text-sm font-semibold text-white tracking-tight">Documentation</span>
          <span className={`px-2 py-0.5 rounded-md text-xs border capitalize font-medium ${cfg.color}`}>
            {result.variant}
          </span>
        </div>
        <span className="text-xs text-gray-500 font-mono">{result.duration_ms}ms</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Title + meta */}
        <div>
          <h3 className="text-base font-semibold text-white mb-2 leading-snug">{result.title}</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="font-mono bg-gray-800/60 border border-gray-700/40 px-2 py-0.5 rounded-md">{result.entity_scope}</span>
            <span className="text-gray-700">·</span>
            <span>{new Date(result.generated_at).toLocaleString()}</span>
            <span className="text-gray-700">·</span>
            <span>{result.sections.length} sections</span>
          </div>
          {/* Context Used replaces raw contextMeta text when orchestration present */}
          {orchestration ? (
            <div className="mt-2">
              <ContextUsedPanel orchestration={orchestration} />
            </div>
          ) : activeInv && (
            <p className="text-[10px] text-gray-600 mt-1.5">
              Context used: {activeInv.turns.length} turns · {activeInv.artifacts.length} artifacts · {activeInv.pinned_findings.length} pinned findings · {activeInv.notes.length} notes
            </p>
          )}
        </div>

        {/* Section navigation tabs */}
        {result.sections.length > 1 && (
          <div className="flex flex-wrap gap-1.5 border-b border-gray-800/60 pb-3">
            <button
              onClick={() => setActiveSection(null)}
              className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                activeSection === null
                  ? 'border-gray-600 bg-gray-700/60 text-white'
                  : 'border-gray-700/50 text-gray-500 hover:border-gray-600 hover:text-gray-300'
              }`}
            >
              All
            </button>
            {result.sections.map((section, i) => (
              <button
                key={i}
                onClick={() => setActiveSection(activeSection === i ? null : i)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                  activeSection === i
                    ? `${cfg.color} font-medium`
                    : 'border-gray-700/50 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                {section.heading}
              </button>
            ))}
          </div>
        )}

        {/* Sections */}
        <div className="space-y-3">
          {result.sections.map((section, i) => {
            if (activeSection !== null && activeSection !== i) return null
            return (
              <div key={i} className="rounded-lg bg-gray-800/30 border border-gray-700/40 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-700/40 bg-gray-800/50 flex items-center gap-2">
                  <div className={`w-0.5 h-3.5 rounded-full ${cfg.accent}`} />
                  <h4 className="text-sm font-semibold text-gray-200">{section.heading}</h4>
                </div>
                <div className="px-4 py-3.5">
                  <pre className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
                    {section.body}
                  </pre>
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="pt-1 border-t border-gray-800/60 space-y-2">
          {orchestration ? (
            <>
              <ExecutionTrace orchestration={orchestration} />
              <SaveAiOutputActions orchestration={orchestration} content={result.raw_markdown} />
            </>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button disabled className="text-xs px-3 py-1.5 rounded-lg border border-gray-700/60 text-gray-600 cursor-not-allowed">
                Export PDF
              </button>
              <button disabled className="text-xs px-3 py-1.5 rounded-lg border border-gray-700/60 text-gray-600 cursor-not-allowed">
                Copy Markdown
              </button>
              <button disabled className="text-xs px-3 py-1.5 rounded-lg border border-gray-700/60 text-gray-600 cursor-not-allowed">
                Send to ITSM
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
