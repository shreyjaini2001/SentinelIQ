import { useState, useEffect, useRef } from 'react'
import { useDebounce } from '../../hooks/useDebounce'
import { getAutocomplete } from '../../api/client'
import type { AutocompleteCompletion } from '../../types'

interface Props {
  inputValue: string
  sessionId?: string | null
  onSelect: (text: string) => void
  visible: boolean
  recentHistory?: string[]
}

const SOURCE_LABEL: Record<AutocompleteCompletion['source'], string> = {
  history:   'History',
  template:  'Template',
  team_pool: 'Common',
}

const MAX_ITEMS = 5

export function AutocompleteDropdown({ inputValue, sessionId, onSelect, visible, recentHistory = [] }: Props) {
  const [completions, setCompletions] = useState<AutocompleteCompletion[]>([])
  const debouncedInput = useDebounce(inputValue, 200)
  const abortRef = useRef<AbortController | null>(null)

  // Clear stale completions when dropdown hides so they don't flash on next open
  useEffect(() => {
    if (!visible) {
      abortRef.current?.abort()
      setCompletions([])
    }
  }, [visible])

  // Fetch API completions when input is long enough
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

  if (!visible) return null

  // Short / empty input → show recent history from the local store
  if (inputValue.length < 3) {
    if (recentHistory.length === 0) return null
    const items = recentHistory.slice(0, MAX_ITEMS)
    return (
      <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-lg border border-gray-700/70 bg-gray-900 shadow-2xl overflow-hidden">
        <div className="px-3 py-1.5 border-b border-gray-800/80">
          <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Recent</span>
        </div>
        {items.map((text, i) => (
          <button
            key={i}
            onMouseDown={(e) => e.preventDefault()} // prevent blur before click
            onClick={() => onSelect(text)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-800/60 transition-colors group"
          >
            <span className="text-gray-600 font-mono text-xs shrink-0">↺</span>
            <span className="text-gray-300 truncate flex-1">{text}</span>
          </button>
        ))}
      </div>
    )
  }

  // Longer input → deduplicate API completions and limit count
  const seen = new Set<string>()
  const deduped = completions.filter((c) => {
    if (seen.has(c.text)) return false
    seen.add(c.text)
    return true
  }).slice(0, MAX_ITEMS)

  if (deduped.length === 0) return null

  return (
    <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-lg border border-gray-700/70 bg-gray-900 shadow-2xl overflow-hidden">
      {deduped.map((c, i) => (
        <button
          key={i}
          onMouseDown={(e) => e.preventDefault()} // prevent blur before click
          onClick={() => onSelect(c.text)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-800/60 transition-colors group"
        >
          <span className="text-gray-200 truncate flex-1">{c.text}</span>
          <span className="text-[10px] text-gray-600 ml-2 shrink-0 group-hover:text-gray-400 uppercase tracking-wider">
            {SOURCE_LABEL[c.source]}
          </span>
        </button>
      ))}
    </div>
  )
}
