import { clsx } from 'clsx'
import type { SuggestionChip } from '../../types'

interface Props {
  chips: SuggestionChip[]
  onChipClick: (promptText: string) => void
}

export function ChipRow({ chips, onChipClick }: Props) {
  if (!chips.length) return null

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {chips.map((chip) => (
        <button
          key={chip.id}
          onClick={() => onChipClick(chip.prompt_text)}
          className={clsx(
            'shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs',
            'transition-all duration-150 whitespace-nowrap',
            chip.type === 'action'
              ? 'border-purple-500/40 text-purple-300 hover:border-purple-400 hover:bg-purple-500/10'
              : 'border-gray-600 text-gray-300 hover:border-blue-500/60 hover:text-blue-300 hover:bg-blue-500/10',
          )}
        >
          {chip.type === 'action' && <span className="text-purple-400">⚡</span>}
          {chip.label}
        </button>
      ))}
    </div>
  )
}
