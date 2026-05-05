import { useEffect } from 'react'
import { useSessionStore } from '../stores/sessionStore'
import * as api from '../api/client'

const SESSION_KEY = 'sentineliq_session_id'

export function useSession() {
  const { sessionId, setSessionId } = useSessionStore()

  useEffect(() => {
    const initSession = async () => {
      const stored = localStorage.getItem(SESSION_KEY)
      if (stored) {
        setSessionId(stored)
        return
      }
      try {
        const { session_id } = await api.createSession()
        localStorage.setItem(SESSION_KEY, session_id)
        setSessionId(session_id)
      } catch (err) {
        console.error('Failed to create session:', err)
      }
    }
    if (!sessionId) initSession()
  }, [sessionId, setSessionId])

  return sessionId
}
