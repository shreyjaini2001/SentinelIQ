import { useState, useCallback, useRef, useEffect } from 'react'
import { useDebounce } from './useDebounce'
import { useSessionStore } from '../stores/sessionStore'
import * as api from '../api/client'
import type { ClassifyResult, ActionProgressEvent } from '../types'

const PLACEHOLDER_CYCLE = [
  'Show me failed logins from unusual geolocations in the last 6 hours...',
  'Find lateral movement patterns this week...',
  'Summarize this investigation as a board-level report...',
  'Hunt for credential dumping in the last 3 days...',
  'What outbound connections did this host make yesterday?',
  'Triage my open alerts and score for false positives...',
]

export function useSearchBar() {
  const [text, setText] = useState('')
  const [classification, setClassification] = useState<ClassifyResult | null>(null)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const abortActionRef = useRef<(() => void) | null>(null)

  const {
    sessionId,
    currentMode,
    setMode,
    setResult,
    setChips,
    pushBreadcrumb,
    setLoading,
    setActionOutput,
    setActionData,
    setActionProgress,
    setActionRunning,
    setPendingQuery,
    isLoading,
    isActionRunning,
    pendingQuery,
  } = useSessionStore()

  const debouncedText = useDebounce(text, 300)

  // Mode classification on debounced input
  useEffect(() => {
    if (!debouncedText.trim() || !sessionId) {
      setClassification(null)
      return
    }
    let cancelled = false
    api.classify(debouncedText, sessionId).then((result) => {
      if (!cancelled) {
        setClassification(result)
        setMode(result.mode)
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [debouncedText, sessionId, setMode])

  // Rotate placeholder text every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDER_CYCLE.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [])

  // Auto-expand at > 80 chars
  useEffect(() => {
    setIsExpanded(text.length > 80)
  }, [text])

  const submit = useCallback(async (inputText?: string) => {
    const submittedText = inputText ?? text
    if (!submittedText.trim() || !sessionId) return

    const mode = classification?.mode ?? currentMode

    if (mode === 'action') {
      // Stream action
      setActionRunning(true)
      setActionOutput(null)
      setActionData(null)
      setActionProgress('Starting...')
      if (abortActionRef.current) abortActionRef.current()

      const outputParts: string[] = []
      abortActionRef.current = api.streamAction(
        submittedText,
        sessionId,
        undefined,
        (event: ActionProgressEvent) => {
          if (event.type === 'progress' && event.message) {
            setActionProgress(event.message)
          } else if (event.type === 'result' && event.output) {
            outputParts.push(event.output)
            setActionOutput(outputParts.join(''))
            if (event.handler && event.data) {
              setActionData({ handler: event.handler, data: event.data })
            }
            setActionProgress(null)
            setActionRunning(false)
          } else if (event.type === 'error') {
            setActionProgress(null)
            setActionRunning(false)
          }
        },
      )
    } else {
      // Query or refine
      setLoading(true)
      try {
        const result = await api.query(
          submittedText,
          sessionId,
          mode === 'refine' ? 'refine' : 'query',
        )
        setResult(result)
        pushBreadcrumb({
          query_id: result.query_id,
          original_text: submittedText,
          generated_query: result.generated_query,
          confidence: result.confidence,
          timestamp: new Date().toISOString(),
        })

        // Async chip generation
        api.getSuggestions(sessionId).then((data) => {
          setChips(data.chips)
        }).catch(() => {})
      } catch (err) {
        console.error('Query failed:', err)
      } finally {
        setLoading(false)
      }
    }
  }, [text, sessionId, classification, currentMode, setLoading, setResult, pushBreadcrumb, setChips, setActionRunning, setActionOutput, setActionData, setActionProgress])

  // Consume pendingQuery set by external callers (e.g. welcome screen buttons)
  useEffect(() => {
    if (!pendingQuery || isLoading || isActionRunning) return
    setText(pendingQuery)
    setPendingQuery(null)
    const timer = setTimeout(() => submit(pendingQuery), 100)
    return () => clearTimeout(timer)
  }, [pendingQuery, isLoading, isActionRunning, setPendingQuery, submit])

  const confirmDisambiguation = useCallback((confirmedMode: string) => {
    if (classification) {
      setClassification({ ...classification, mode: confirmedMode as typeof classification.mode })
    }
  }, [classification])

  return {
    text,
    setText,
    classification,
    placeholder: PLACEHOLDER_CYCLE[placeholderIndex],
    isExpanded,
    isLoading,
    isActionRunning,
    submit,
    confirmDisambiguation,
  }
}
