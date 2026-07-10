import { useEffect } from 'react'
import { useSessionStore } from '../stores/sessionStore'
import * as api from '../api/client'

const SESSION_KEY = 'sentineliq_session_id'

export function useSession() {
  const { sessionId, setSessionId } = useSessionStore()

  useEffect(() => {
    if (sessionId) return

    const stored = localStorage.getItem(SESSION_KEY)
    if (stored) {
      setSessionId(stored)
      return
    }

    // Set an IMMEDIATE local session id so the command bar is usable on this very render —
    // no waiting on the network. Client-side actions (triage / evidence) work fully offline,
    // and Ask never sits disabled waiting for /session. Then best-effort upgrade to a real
    // backend session in the background; if the backend is down we simply keep the local id.
    setSessionId(`local-${Date.now()}`)
    api.createSession()
      .then(({ session_id }) => {
        localStorage.setItem(SESSION_KEY, session_id)
        setSessionId(session_id)
      })
      .catch((err) => {
        console.warn('[session] backend unavailable — using local session', err)
      })
  }, [sessionId, setSessionId])

  return sessionId
}
