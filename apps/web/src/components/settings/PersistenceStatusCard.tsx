import { useState } from 'react'
import { clsx } from 'clsx'
import { usePersistenceStore } from '../../stores/persistenceStore'
import { resetDemoData } from '../../utils/persistenceSnapshot'

/** Human-friendly "x seconds ago" for the last-saved timestamp. */
function timeAgo(iso: string | null): string {
  if (!iso) return 'never'
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (secs < 5) return 'just now'
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  return new Date(iso).toLocaleString()
}

const BACKEND_STYLE: Record<string, string> = {
  connected: 'text-emerald-400',
  connecting: 'text-amber-400',
  disconnected: 'text-orange-400',
  idle: 'text-gray-500',
}

export function PersistenceStatusCard() {
  const { backend, storageMode, lastSavedAt, saving, lastError } = usePersistenceStore()
  const [confirming, setConfirming] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [done, setDone] = useState(false)

  const storageLabel = storageMode === 'local-sqlite' ? 'Local SQLite' : 'Browser fallback'

  async function handleReset() {
    setResetting(true)
    try {
      await resetDemoData()
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    } finally {
      setResetting(false)
      setConfirming(false)
    }
  }

  const rows: Array<{ label: string; value: string; cls?: string }> = [
    { label: 'Storage mode', value: storageLabel },
    { label: 'Backend', value: backend, cls: BACKEND_STYLE[backend] ?? 'text-gray-400' },
    { label: 'Last saved', value: saving ? 'saving…' : timeAgo(lastSavedAt) },
    { label: 'Mock mode', value: 'On' },
  ]

  return (
    <section className="space-y-3">
      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
        Local Persistence (Demo)
      </div>
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4 space-y-3">
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{row.label}</span>
              <span className={clsx('font-mono', row.cls ?? 'text-gray-300')}>{row.value}</span>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-gray-600 leading-relaxed">
          Investigation memory, alert lifecycle/audit trail, and workspace checkpoints persist to a
          local SQLite demo database via the backend. If the backend is unavailable, the app keeps
          working with in-memory mock data and browser-local state.
        </p>

        {lastError && backend === 'disconnected' && (
          <p className="text-[10px] text-orange-400/80">{lastError}</p>
        )}

        {/* Reset demo data — two-step inline confirm (no modal). */}
        <div className="pt-1 border-t border-gray-800/60">
          {done ? (
            <p className="text-[11px] text-emerald-400 pt-2">
              ✓ Demo data reset to defaults · returned to Scratch Mode
            </p>
          ) : !confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="mt-2 text-[11px] px-2.5 py-1 rounded-lg border border-gray-700/50 text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors"
            >
              Reset demo data
            </button>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] text-gray-400">Reset all persisted demo state?</span>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-red-500/30 text-red-300 bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {resetting ? 'Resetting…' : 'Yes, reset'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={resetting}
                className="text-[11px] px-2 py-1 rounded-lg text-gray-500 hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
