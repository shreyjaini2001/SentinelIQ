import { clsx } from 'clsx'
import type { Mode } from '../../types'

const MODE_CONFIG: Record<Mode, { label: string; color: string; icon: string }> = {
  query: { label: 'Query', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '⌕' },
  action: { label: 'Action', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: '⚡' },
  refine: { label: 'Refine', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: '↩' },
}

interface Props {
  mode: Mode
  confidence?: number
}

export function ModeIndicatorPill({ mode, confidence }: Props) {
  const config = MODE_CONFIG[mode]
  const isDim = confidence !== undefined && confidence < 0.6

  return (
    <span
      data-testid="mode-pill"
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium',
        'transition-all duration-300',
        config.color,
        isDim && 'opacity-60',
      )}
      title={confidence !== undefined ? `Confidence: ${Math.round(confidence * 100)}%` : undefined}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  )
}
