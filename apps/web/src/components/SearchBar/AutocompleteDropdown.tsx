import { useState, useEffect, useRef } from 'react'
import { useDebounce } from '../../hooks/useDebounce'
import { getAutocomplete } from '../../api/client'
import type { AutocompleteCompletion } from '../../types'

interface Props {
  inputValue: string
  sessionId?: string | null
  onSelect: (text: string) => void
  visible: boolean
}

const SOURCE_LABEL: Record<AutocompleteCompletion['source'], string> = {
  history: 'History',
  template: 'Template',
  team_pool: 'Commonly used',
}

export function AutocompleteDropdown({ inputValue, sessionId, onSelect, visible }: Props) {
  const [completions, setCompletions] = useState<AutocompleteCompletion[]>([])
  const debouncedInput = useDebounce(inputValue, 200)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!visible || debouncedInput.length < 3) {
      setCompletions([])
      return
    }
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    getAutocomplete(debouncedInput, sessionId ?? undefined)
      .then((data) => setCompletions(data.completions))
      .catch(() => {})
  }, [debouncedInput, sessionId, visible])

  if (!visible || completions.length === 0) return null

  return (
    <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-gray-700 bg-gray-900 shadow-xl overflow-hidden">
      {completions.map((c, i) => (
        <button
          key={i}
          onClick={() => onSelect(c.text)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-800 transition-colors group"
        >
          <span className="text-gray-200 truncate flex-1">{c.text}</span>
          <span className="text-xs text-gray-600 ml-2 shrink-0 group-hover:text-gray-400">
            {SOURCE_LABEL[c.source]}
          </span>
        </button>
      ))}
    </div>
  )
}
