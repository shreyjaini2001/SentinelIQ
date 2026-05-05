import { useState, useCallback } from 'react'

export function useAutocomplete() {
  const [showAutocomplete, setShowAutocomplete] = useState(false)

  const handleFocus = useCallback(() => setShowAutocomplete(true), [])
  const handleBlur = useCallback(() => {
    // Delay to allow click on dropdown item to fire first
    setTimeout(() => setShowAutocomplete(false), 150)
  }, [])

  return { showAutocomplete, handleFocus, handleBlur }
}
