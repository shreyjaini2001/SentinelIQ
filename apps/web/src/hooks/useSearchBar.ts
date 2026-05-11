import { useState, useCallback, useRef, useEffect } from 'react'
import { useDebounce } from './useDebounce'
import { useSessionStore } from '../stores/sessionStore'
import { useInvestigationStore } from '../stores/investigationStore'
import * as api from '../api/client'
import type { ClassifyResult, ActionProgressEvent, Mode } from '../types'
import type { ArtifactType } from '../types/investigation'

const HANDLER_TO_ARTIFACT_TYPE: Record<string, ArtifactType> = {
  triage:     'alert_triage',
  hunt:       'hunt',
  timeline:   'timeline',
  blast_radius: 'blast_radius',
  comparative: 'comparative_analysis',
  rule_suggestion: 'rule_suggestion',
  documentation: 'documentation',
  handoff:    'handoff',
  runbook:    'runbook',
  noise_coaching: 'noise_coaching',
}

function buildArtifactTitle(handler: string, data: unknown, submittedText: string): string {
  if (!data || typeof data !== 'object') return `${handler}: ${submittedText.slice(0, 60)}`
  const d = data as Record<string, unknown>
  switch (handler) {
    case 'documentation':  return String(d.title ?? submittedText.slice(0, 60))
    case 'handoff':        return `Handoff Briefing — ${String(d.shift_window ?? 'Current Shift')}`
    case 'runbook':        return `Runbook — ${String(d.title ?? submittedText.slice(0, 40))}`
    case 'noise_coaching': return `Noise Coaching — ${String(d.rule_name ?? submittedText.slice(0, 40))}`
    default:               return `${handler}: ${submittedText.slice(0, 60)}`
  }
}

function buildResultSummary(handler: string, data: unknown): string {
  if (!data || typeof data !== 'object') return handler
  const d = data as Record<string, unknown>
  switch (handler) {
    case 'triage':          return `Triage: ${d.likely_tp ?? '?'} TP, ${d.likely_fp ?? '?'} FP of ${d.total_alerts ?? '?'}`
    case 'hunt':            return `Hunt: ${d.techniques_with_evidence ?? '?'}/${d.techniques_queried ?? '?'} techniques with evidence`
    case 'timeline':        return `Timeline: ${d.total_events ?? '?'} events`
    case 'blast_radius':    return `Blast radius: ${d.total_reachable_assets ?? '?'} assets, risk ${d.risk_score ?? '?'}/10`
    case 'comparative':     return `Comparative: deviation score ${d.overall_deviation_score ?? '?'}`
    case 'rule_suggestion': return `Rule: ${String(d.rule_name ?? 'suggestion generated')}`
    case 'documentation':   return `Report: ${String(d.variant ?? '')} — ${String(d.title ?? '')}`
    case 'handoff':         return `Handoff: ${Array.isArray(d.open_items) ? d.open_items.length : '?'} open items`
    case 'runbook':         return `Runbook: ${String(d.title ?? 'generated')}`
    case 'noise_coaching':  return `Noise coaching: ${d.estimated_alert_reduction_pct ?? '?'}% alert reduction`
    default:                return handler
  }
}

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
  // Token guard: incremented on every new action submission.
  // Callbacks from aborted/stale streams check this before updating state.
  const actionTokenRef = useRef(0)
  // Always-current ref to submit — used by pendingQuery effect so it doesn't
  // need submit in its dependency array (which would clear the timer on text change).
  const submitRef = useRef<(text?: string) => Promise<void>>(async () => {})

  const {
    sessionId,
    currentMode,
    setMode,
    setResult,
    setChips,
    pushBreadcrumb,
    pushSubmitHistory,
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

  // Debounced classification — updates the mode pill while typing
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
    const submittedText = (inputText ?? text).trim()
    if (!submittedText || !sessionId) return

    // Clear stale classification so the pill resets to neutral while live classify runs
    setClassification(null)

    // ── Step 1: Always re-classify the submitted text live.
    // The debounce effect may not have settled (user typed fast or used a
    // welcome-button). Using a stale classification would route action prompts
    // to the query pipeline, producing KQL instead of the action panel.
    let mode: Mode = 'query'
    try {
      const live = await api.classify(submittedText, sessionId)
      setClassification(live)
      setMode(live.mode)
      mode = live.mode
    } catch {
      // Classify API down — fall back to last known classification
      mode = classification?.mode ?? 'query'
    }

    if (mode === 'action') {
      // Record in submit history (covers action prompts which never push breadcrumbs)
      pushSubmitHistory(submittedText)

      // ── Step 2a: Clear stale query state so QueryPreviewCard disappears
      setResult(null)
      setChips([])

      // ── Step 3: Start action stream
      setActionRunning(true)
      setActionOutput(null)
      setActionData(null)
      setActionProgress('Starting...')

      // Abort any in-flight action from a previous submission
      if (abortActionRef.current) abortActionRef.current()

      // Increment token — old stream callbacks will see a mismatch and exit
      const token = ++actionTokenRef.current
      let streamDone = false

      abortActionRef.current = api.streamAction(
        submittedText,
        sessionId,
        undefined,
        (event: ActionProgressEvent) => {
          // Ignore callbacks from superseded streams
          if (actionTokenRef.current !== token) return

          if (event.type === 'progress' && event.message) {
            setActionProgress(event.message)
          } else if (event.type === 'result') {
            streamDone = true
            const out = event.output ?? ''
            // Set a non-empty sentinel if handler produced no text output so
            // the QueryPreviewCard guard {currentResult && !actionOutput} stays false
            setActionOutput(out || ' ')
            if (event.handler && event.data !== undefined) {
              setActionData({ handler: event.handler, data: event.data })

              // Record turn + artifact in active investigation (if any)
              const invStore = useInvestigationStore.getState()
              if (invStore.activeInvestigationId) {
                const artifactType = HANDLER_TO_ARTIFACT_TYPE[event.handler] ?? 'documentation'
                const artifactId = invStore.addArtifact({
                  type: artifactType,
                  title: buildArtifactTitle(event.handler, event.data, submittedText),
                  data: event.data,
                })
                invStore.addTurn({
                  user_text: submittedText,
                  mode: 'action',
                  result_summary: buildResultSummary(event.handler, event.data),
                  artifact_ids: artifactId ? [artifactId] : [],
                })
              }
            }
            setActionProgress(null)
            setActionRunning(false)
          } else if (event.type === 'error') {
            streamDone = true
            setActionProgress(`Error: ${event.message ?? 'Action failed — check API logs'}`)
            setActionRunning(false)
          } else if (event.type === 'disambiguation') {
            streamDone = true
            setActionProgress(null)
            setActionRunning(false)
          }
        },
        () => {
          // onDone: stream closed (normal end, abort, or network failure).
          // If no terminal event (result/error) was received, unblock the UI.
          if (actionTokenRef.current !== token) return
          if (!streamDone) {
            setActionRunning(false)
            setActionProgress(null)
          }
        },
      )
    } else {
      // ── Step 2b: Clear stale action state so old panels disappear
      setActionData(null)
      setActionOutput(null)
      setActionProgress(null)

      // ── Step 3: Run query or refine
      setLoading(true)
      try {
        const result = await api.query(
          submittedText,
          sessionId,
          mode === 'refine' ? 'refine' : 'query',
        )
        setResult(result)
        pushSubmitHistory(submittedText)
        pushBreadcrumb({
          query_id: result.query_id,
          original_text: submittedText,
          generated_query: result.generated_query,
          confidence: result.confidence,
          timestamp: new Date().toISOString(),
        })

        // Record turn + artifact in active investigation (if any)
        const invStore = useInvestigationStore.getState()
        if (invStore.activeInvestigationId) {
          const artifactId = invStore.addArtifact({
            type: 'query',
            title: `Query: ${submittedText.slice(0, 60)}`,
            data: { kql: result.generated_query, query_id: result.query_id },
          })
          invStore.addTurn({
            user_text: submittedText,
            mode: mode === 'refine' ? 'refine' : 'query',
            result_summary: `KQL: ${result.generated_query.split('\n')[0]}`,
            artifact_ids: artifactId ? [artifactId] : [],
          })
        }

        api.getSuggestions(sessionId).then((data) => {
          setChips(data.chips)
        }).catch(() => {})
      } catch (err) {
        console.error('Query failed:', err)
      } finally {
        setLoading(false)
      }
    }
  }, [
    text,
    sessionId,
    classification,
    currentMode,
    setMode,
    setLoading,
    setResult,
    setChips,
    pushBreadcrumb,
    pushSubmitHistory,
    setActionRunning,
    setActionOutput,
    setActionData,
    setActionProgress,
  ])

  // Keep submitRef always pointing to the latest submit function.
  // This lets the pendingQuery effect call submit without listing it as a
  // dependency (which would clear the timer every time text changes).
  submitRef.current = submit

  // Consume pendingQuery set by external callers (e.g. welcome screen buttons).
  // No timer or cleanup: setPendingQuery(null) changes the dep and would cause
  // the cleanup to fire, cancelling a setTimeout before it fires. Instead we
  // fire submit synchronously (submitRef always points to the latest function).
  useEffect(() => {
    if (!pendingQuery || isLoading || isActionRunning) return
    const captured = pendingQuery
    setText(captured)
    setPendingQuery(null)
    void submitRef.current(captured)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuery, isLoading, isActionRunning, setPendingQuery])

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
