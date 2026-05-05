import { useState } from 'react'
import { clsx } from 'clsx'

interface Props {
  confidence: number
  assumptions?: string[]
}

export function ConfidenceBadge({ confidence, assumptions }: Props) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (confidence >= 70) return null

  const label = confidence >= 40 ? 'Medium confidence' : 'Low confidence — confirm before running'
  const color = confidence >= 40 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'

  return (
    <div className="relative inline-block">
      <button
        className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs', color)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span>⚠</span>
        <span>{confidence}</span>
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 w-72 p-3 rounded-lg bg-gray-900 border border-gray-700 text-xs text-gray-300 z-50 shadow-xl">
          <p className="font-medium text-amber-400 mb-1">{label}</p>
          {assumptions && assumptions.length > 0 && (
            <ul className="space-y-1 mt-2">
              {assumptions.map((a, i) => (
                <li key={i} className="text-gray-400">• {a}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
