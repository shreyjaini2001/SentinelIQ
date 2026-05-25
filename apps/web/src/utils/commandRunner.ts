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

  console.debug('[SentinelIQ] cmd:start', { id, source, prompt: prompt.slice(0, 80) })

  // Sync the visible AI bar text so the user sees what ran
  _setText?.(prompt)

  if (!_dispatch) {
    console.warn('[SentinelIQ] cmd:blocked — dispatch not registered yet', { id, source })
    return
  }

  try {
    await _dispatch(prompt)
    console.debug('[SentinelIQ] cmd:complete', { id })
  } catch (err) {
    console.debug('[SentinelIQ] cmd:failed', { id, error: err })
  }
}
