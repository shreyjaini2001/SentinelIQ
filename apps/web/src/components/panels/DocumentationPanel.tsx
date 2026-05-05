import { useState } from 'react'
import type { DocumentationResult } from '../../types'

interface Props {
  result: DocumentationResult
}

const VARIANT_COLORS: Record<string, string> = {
  technical: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  executive: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  regulatory: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
}

export function DocumentationPanel({ result }: Props) {
  const [activeSection, setActiveSection] = useState<number | null>(null)
  const variantCls = VARIANT_COLORS[result.variant] ?? 'text-gray-400 border-gray-600 bg-gray-700/20'

  return (
    <div className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-gray-900/50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">Documentation</span>
          <span className={`px-2 py-0.5 rounded text-xs border capitalize ${variantCls}`}>
            {result.variant}
          </span>
        </div>
        <span className="text-xs text-gray-500">{result.duration_ms}ms</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Title + meta */}
        <div>
          <h3 className="text-base font-semibold text-white mb-1">{result.title}</h3>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span>Scope: {result.entity_scope}</span>
            <span>·</span>
            <span>Generated: {new Date(result.generated_at).toLocaleString()}</span>
            <span>·</span>
            <span>{result.sections.length} sections</span>
          </div>
        </div>

        {/* Section navigation */}
        {result.sections.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {result.sections.map((section, i) => (
              <button
                key={i}
                onClick={() => setActiveSection(activeSection === i ? null : i)}
                className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                  activeSection === i
                    ? 'border-blue-500/60 bg-blue-500/10 text-blue-300'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                {section.heading}
              </button>
            ))}
          </div>
        )}

        {/* Sections */}
        <div className="space-y-4">
          {result.sections.map((section, i) => {
            if (activeSection !== null && activeSection !== i) return null
            return (
              <div key={i} className="rounded-lg bg-gray-800/40 border border-gray-700/40 overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-700/40 bg-gray-800/60">
                  <h4 className="text-sm font-medium text-gray-200">{section.heading}</h4>
                </div>
                <div className="px-3 py-3">
                  <pre className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
                    {section.body}
                  </pre>
                </div>
              </div>
            )
          })}
        </div>

        {/* Export buttons (disabled — Phase 2 placeholder) */}
        <div className="pt-2 border-t border-gray-800 flex flex-wrap gap-2">
          <button disabled className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-600 cursor-not-allowed">
            Export PDF
          </button>
          <button disabled className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-600 cursor-not-allowed">
            Copy Markdown
          </button>
          <button disabled className="text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-600 cursor-not-allowed">
            Send to ITSM
          </button>
        </div>
      </div>
    </div>
  )
}
