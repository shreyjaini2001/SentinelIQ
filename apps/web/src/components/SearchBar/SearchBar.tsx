import { useRef, KeyboardEvent } from 'react'
import { clsx } from 'clsx'
import { ModeIndicatorPill } from './ModeIndicatorPill'
import { QueryPreviewCard } from './QueryPreviewCard'
import { ChipRow } from './ChipRow'
import { SessionBreadcrumb } from './SessionBreadcrumb'
import { DisambiguationChips } from './DisambiguationChips'
import { ProgressFeed } from './ProgressFeed'
import { ActionOutput } from './ActionOutput'
import { AutocompleteDropdown } from './AutocompleteDropdown'
import { useSearchBar } from '../../hooks/useSearchBar'
import { useSession } from '../../hooks/useSession'
import { useSessionStore } from '../../stores/sessionStore'
import { useAutocomplete } from '../../hooks/useAutocomplete'

export function SearchBar() {
  const sessionId = useSession()
  const {
    text,
    setText,
    classification,
    placeholder,
    isExpanded,
    isLoading,
    isActionRunning,
    submit,
    confirmDisambiguation,
  } = useSearchBar()

  const {
    currentResult, chips, breadcrumbs, submitHistory,
    actionOutput, actionData, actionProgress,
    setResult, setChips, setLogsKql,
  } = useSessionStore()
  const hasDedicatedPanel = [
    'triage', 'hunt', 'timeline',
    'blast_radius', 'documentation', 'comparative', 'rule_suggestion',
    'handoff', 'runbook', 'noise_coaching',
  ].includes(actionData?.handler ?? '')
  const actionError = !actionData && !isActionRunning && actionProgress?.startsWith('Error:')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { showAutocomplete, handleFocus, handleBlur, closeAutocomplete } = useAutocomplete()

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      closeAutocomplete()
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      closeAutocomplete()
      submit(text)
    }
  }

  const handleSubmitClick = () => {
    closeAutocomplete()
    submit(text)
  }

  const handleChipClick = (promptText: string) => {
    closeAutocomplete()
    setText(promptText)
    inputRef.current?.focus()
    setTimeout(() => submit(promptText), 50)
  }

  const handleBreadcrumbRestore = (entry: { original_text: string }) => {
    setText(entry.original_text)
    inputRef.current?.focus()
  }

  // When the user selects from autocomplete: fill the bar and immediately submit
  const handleAutocompleteSelect = (t: string) => {
    closeAutocomplete()
    setText(t)
    submit(t)
  }

  const showDisambiguation =
    classification?.disambiguation_chips &&
    classification.disambiguation_chips.length > 0

  return (
    <div className="w-full relative">
      {/* Main search bar */}
      <div
        className={clsx(
          'relative flex items-start gap-3 px-4 py-3',
          'rounded-xl border border-gray-700/60 bg-gray-900/80 backdrop-blur',
          'transition-all duration-200',
          'focus-within:border-blue-500/60 focus-within:bg-gray-900/90',
          isLoading && 'opacity-80',
        )}
      >
        {/* Mode indicator */}
        <div className="flex items-center pt-0.5 shrink-0">
          <ModeIndicatorPill
            mode={classification?.mode ?? 'query'}
            confidence={classification?.confidence}
          />
        </div>

        {/* Input — autocomplete is absolutely positioned relative to this div */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            rows={isExpanded ? 3 : 1}
            className={clsx(
              'w-full bg-transparent text-gray-100 placeholder-gray-500',
              'text-sm resize-none outline-none leading-relaxed',
              'transition-all duration-200',
            )}
            disabled={isLoading || isActionRunning}
            aria-label="AI Search Bar"
            data-session-id={sessionId ?? ''}
          />
          <AutocompleteDropdown
            inputValue={text}
            sessionId={sessionId}
            visible={showAutocomplete}
            recentHistory={submitHistory}
            onSelect={handleAutocompleteSelect}
          />
        </div>

        {/* Submit button */}
        <button
          data-testid="submit-button"
          onClick={handleSubmitClick}
          disabled={!text.trim() || isLoading || isActionRunning || !sessionId}
          className={clsx(
            'shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium',
            'transition-all duration-150',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            isLoading || isActionRunning
              ? 'bg-gray-700 text-gray-400'
              : 'bg-blue-600 hover:bg-blue-500 text-white',
          )}
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span>Working</span>
            </span>
          ) : isActionRunning ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <span>Running</span>
            </span>
          ) : (
            <span>Ask →</span>
          )}
        </button>
      </div>

      {/* Below-bar content */}
      <div className="mt-2 space-y-2">
        {/* Disambiguation chips */}
        {showDisambiguation && (
          <DisambiguationChips
            chips={classification!.disambiguation_chips!}
            onSelect={confirmDisambiguation}
          />
        )}

        {/* Action progress feed */}
        {(isActionRunning || (actionProgress && !actionError)) && (
          <ProgressFeed message={actionProgress} isRunning={isActionRunning} />
        )}

        {/* Action error card */}
        {actionError && (
          <div className="rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-xs text-red-400">
            {actionProgress}
          </div>
        )}

        {/* Query preview card — only when there is a query result and no action is in flight */}
        {currentResult && !actionOutput && !isActionRunning && (
          <QueryPreviewCard
            key={currentResult.query_id}
            result={currentResult}
            onDismiss={() => { setResult(null); setChips([]) }}
            onOpenInLogs={(kql) => { setLogsKql(kql); setResult(null); setChips([]) }}
          />
        )}

        {/* Action output — only show text fallback when no dedicated panel */}
        {actionOutput && !hasDedicatedPanel && <ActionOutput output={actionOutput} />}

        {/* Chip suggestions */}
        {chips.length > 0 && (
          <ChipRow chips={chips} onChipClick={handleChipClick} />
        )}

        {/* Session breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <SessionBreadcrumb
            breadcrumbs={breadcrumbs}
            onRestore={handleBreadcrumbRestore}
          />
        )}
      </div>
    </div>
  )
}
