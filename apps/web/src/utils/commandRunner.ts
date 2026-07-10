/**
 * Shared command runner — single dispatch point for all AI command-triggering UI.
 * All buttons, chips, and cards that submit a command must use submitCommand().
 * Never rely on setPendingQuery → effect chain for direct execution.
 */

export type CommandSource =
  | 'global_bar'
  | 'overview_chip'
  | 'entity_chip'
  | 'pivot_chip'
  | 'report_button'
  | 'investigation_quick_action'
  | 'suggestion_chip'
  | 'autocomplete'
  | 'alerts_triage'
  | 'unknown'

export interface CommandOptions {
  source?: CommandSource
  modeHint?: 'query' | 'action'
}

// Module-level references registered by useSearchBar on mount
let _dispatch: ((text: string) => Promise<void>) | null = null
let _setText: ((text: string) => void) | null = null
let _cmdSeq = 0

export function registerDispatch(fn: ((text: string) => Promise<void>) | null): void {
  _dispatch = fn
}

export function registerSetText(fn: ((text: string) => void) | null): void {
  _setText = fn
}

/**
 * Execute a command from any UI entrypoint.
 * Syncs the AI bar text, then dispatches through the same path as pressing Ask.
 * Safe to call without waiting for React state updates.
 */
export async function submitCommand(prompt: string, options?: CommandOptions): Promise<void> {
  const id = ++_cmdSeq
  const source = options?.source ?? 'unknown'
  const text = prompt.trim()

  if (!text) {
    console.debug('[command] blocked reason=empty-prompt', { id, source })
    return
  }

  console.debug('[command] submit start', { id, source, prompt: text.slice(0, 80) })

  // Sync the visible AI bar text so the user sees what ran. This is cosmetic — dispatch
  // below receives the prompt explicitly and does NOT depend on this state landing first.
  _setText?.(text)

  if (!_dispatch) {
    // SearchBar mounts in the app header, so this should never happen in practice.
    console.warn('[command] blocked reason=dispatch-not-registered', { id, source })
    return
  }

  try {
    await _dispatch(text)
    console.debug('[command] complete', { id })
  } catch (err) {
    console.debug('[command] failed', { id, error: err })
  }
}
