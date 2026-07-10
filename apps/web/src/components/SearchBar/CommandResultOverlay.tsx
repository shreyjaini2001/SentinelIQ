import { useEffect, useRef, type ReactNode } from 'react'
import { OVERLAY_OPEN_GRACE_MS, isInsideOverlaySafeZone } from '../../utils/overlayGuards'

interface Props {
  /** Called when the overlay should close (Escape, outside click, or × button). */
  onClose: () => void
  /** Short label shown in the overlay header strip. */
  label?: string
  children: ReactNode
}

/**
 * Floating command-palette overlay anchored directly under the global command bar.
 *
 * Positioned `absolute top-full` relative to the SearchBar's `relative` root, so it
 * floats over page content WITHOUT participating in document flow — the sticky header
 * never grows and the page never shifts down. High z-index keeps it above the app body;
 * it has its own max-height and internal scroll. This is a lightweight console overlay,
 * NOT a blocking modal: the command bar above it stays fully interactive.
 *
 * Outside-click closing is deliberately conservative (see overlayGuards): it ignores the
 * opening click via a grace window and never closes on interactions inside the command
 * bar, the overlay itself, or any [data-overlay-ignore] control (e.g. native selects).
 */
export function CommandResultOverlay({ onClose, label, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  // Captured at construction (≈ open time) so the click that opened the overlay is ignored.
  const openedAtRef = useRef<number>(Date.now())

  useEffect(() => {
    console.debug('[SentinelIQ] overlay:open')
    return () => console.debug('[SentinelIQ] overlay:unmount')
  }, [])

  // Escape closes the overlay reliably.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.debug('[SentinelIQ] overlay:close reason=escape')
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Outside-click closes the overlay — but only for a genuine click away from it.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      // Ignore the click that opened the overlay (and any within the grace window).
      if (Date.now() - openedAtRef.current < OVERLAY_OPEN_GRACE_MS) return
      // Ignore clicks inside the overlay, the command bar, or explicit ignore zones.
      if (isInsideOverlaySafeZone(e.target, panelRef.current)) return
      console.debug('[SentinelIQ] overlay:close reason=outside-click')
      onClose()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [onClose])

  return (
    <div
      ref={panelRef}
      data-command-overlay
      role="dialog"
      aria-label={label ?? 'Command result'}
      className="absolute top-full left-0 right-0 mt-2 z-50"
    >
      <div className="rounded-xl border border-gray-700/70 bg-gray-950/95 backdrop-blur-md shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header strip */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800/70 bg-gray-900/60">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
              {label ?? 'Command Result'}
            </span>
          </div>
          <button
            onClick={onClose}
            title="Close (Esc)"
            className="text-gray-500 hover:text-gray-200 text-sm leading-none px-1.5 py-0.5 rounded hover:bg-gray-800/60 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content region */}
        <div className="max-h-[calc(100vh-140px)] overflow-y-auto p-3 space-y-2">
          {children}
        </div>
      </div>
    </div>
  )
}
