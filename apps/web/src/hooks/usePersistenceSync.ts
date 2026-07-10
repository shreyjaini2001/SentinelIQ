import { useEffect, useRef } from 'react'
import { useInvestigationStore } from '../stores/investigationStore'
import { useAlertStore } from '../stores/alertStore'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { useLogsStore } from '../stores/logsStore'
import { usePersistenceStore } from '../stores/persistenceStore'
import { fetchPersistedState, savePersistedState } from '../utils/persistenceClient'
import { buildSnapshot, applySnapshot, snapshotSignature } from '../utils/persistenceSnapshot'

const DEBOUNCE_MS = 1200

/**
 * Wire the local demo persistence layer (v1.2.0):
 *  1. On mount, hydrate stores from the backend (best-effort). If the backend is down we
 *     stay on the in-memory mock seed + browser-local (zustand persist) state — never blocks.
 *  2. After hydration, autosave a debounced snapshot whenever persist-worthy state changes.
 *     A signature check skips no-op writes (e.g. typing in the Logs editor).
 *
 * Scratch-first landing is preserved: the active case is never restored here.
 */
export function usePersistenceSync() {
  const hydratedRef = useRef(false)
  const lastSigRef = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const p = usePersistenceStore.getState()

    async function doSave() {
      if (!hydratedRef.current) return
      const snap = buildSnapshot()
      const sig = snapshotSignature(snap)
      if (sig === lastSigRef.current) return // nothing persist-worthy changed
      usePersistenceStore.getState().setSaving(true)
      try {
        const { savedAt } = await savePersistedState(snap)
        lastSigRef.current = sig
        usePersistenceStore.getState().markSaved(savedAt)
        usePersistenceStore.getState().setStorageMode('local-sqlite')
      } catch {
        usePersistenceStore.getState().setBackend('disconnected')
        usePersistenceStore.getState().setStorageMode('browser-fallback')
        usePersistenceStore.getState().setError('Save failed — continuing with local state')
      } finally {
        usePersistenceStore.getState().setSaving(false)
      }
    }

    function scheduleSave() {
      if (!hydratedRef.current) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => void doSave(), DEBOUNCE_MS)
    }

    // Subscribe immediately; changes are ignored until hydration completes (guard above).
    const unsubs = [
      useInvestigationStore.subscribe(scheduleSave),
      useAlertStore.subscribe(scheduleSave),
      useWorkspaceStore.subscribe(scheduleSave),
      useLogsStore.subscribe(scheduleSave),
    ]

    // Hydrate (best-effort, non-blocking).
    p.setBackend('connecting')
    ;(async () => {
      try {
        const state = await fetchPersistedState()
        if (state.hasPersistedState) applySnapshot(state)
        usePersistenceStore.getState().setBackend('connected')
        usePersistenceStore.getState().setStorageMode('local-sqlite')
        usePersistenceStore.getState().markSaved(state.generatedAt)
      } catch {
        // Backend unavailable — keep mock seed + browser-local state; app still works fully.
        usePersistenceStore.getState().setBackend('disconnected')
        usePersistenceStore.getState().setStorageMode('browser-fallback')
        usePersistenceStore.getState().setError('Persistence backend unavailable — using local state')
      } finally {
        lastSigRef.current = snapshotSignature(buildSnapshot())
        hydratedRef.current = true
        usePersistenceStore.getState().setHydrated(true)
      }
    })()

    return () => {
      unsubs.forEach((u) => u())
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])
}
