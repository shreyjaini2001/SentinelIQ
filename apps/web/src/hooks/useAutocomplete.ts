import { useState, useCallback } from 'react'

export function useAutocomplete() {
  const [showAutocomplete, setShowAutocomplete] = useState(false)

  const handleFocus = useCallback(() => setShowAutocomplete(true), [])
  const handleBlur = useCallback(() => {
    // Delay allows a click on a dropdown item to fire before the dropdown closes
    setTimeout(() => setShowAutocomplete(false), 150)
  }, [])
  const closeAutocomplete = useCallback(() => setShowAutocomplete(false), [])

  return { showAutocomplete, handleFocus, handleBlur, closeAutocomplete }
}
