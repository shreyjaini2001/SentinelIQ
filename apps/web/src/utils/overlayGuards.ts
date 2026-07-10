/**
 * Shared guards for the command-palette overlay outside-click behavior.
 *
 * The overlay must close only when the user genuinely clicks away from it — never on
 * the click that opened it, never on the command bar, and never on interactive controls
 * we explicitly mark as safe (native selects, dropdowns, etc.). These helpers centralize
 * that logic so the overlay stays stable across all the interactions in v1.1.2.
 */

/**
 * Clicks within this window after the overlay opens are ignored. This absorbs the
 * pointer/click sequence that opened the overlay (mousedown fires before the overlay
 * mounts its listener) and any StrictMode re-mount races, so the overlay never
 * closes itself the instant it appears.
 */
export const OVERLAY_OPEN_GRACE_MS = 300

/** Elements (and their subtrees) that must never be treated as an outside click. */
const SAFE_ZONE_SELECTOR = '[data-command-bar],[data-command-overlay],[data-overlay-ignore]'

/**
 * True when the event target is inside the overlay, the command bar, or any explicit
 * ignore zone — i.e. NOT a genuine outside click.
 */
export function isInsideOverlaySafeZone(
  target: EventTarget | null,
  ...roots: (HTMLElement | null)[]
): boolean {
  const node = target instanceof Node ? target : null
  if (!node) return false

  for (const root of roots) {
    if (root && root.contains(node)) return true
  }

  const el = node instanceof Element ? node : node.parentElement
  if (el && el.closest(SAFE_ZONE_SELECTOR)) return true

  return false
}
