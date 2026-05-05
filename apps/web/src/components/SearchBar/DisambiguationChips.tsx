import type { DisambiguationChip, Mode } from '../../types'

interface Props {
  chips: DisambiguationChip[]
  onSelect: (mode: Mode) => void
}

export function DisambiguationChips({ chips, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg bg-gray-900/80 border border-gray-700 backdrop-blur">
      <p className="text-xs text-gray-400">Did you mean:</p>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip.mode + chip.label}
            onClick={() => onSelect(chip.mode)}
            className="px-3 py-1.5 rounded-lg border border-gray-600 text-xs text-gray-200 hover:border-blue-500 hover:text-blue-400 transition-colors"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  )
}
