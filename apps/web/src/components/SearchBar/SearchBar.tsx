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

  const { currentResult, chips, breadcrumbs, actionOutput, actionData, actionProgress } = useSessionStore()
  const hasDedicatedPanel = ['triage', 'hunt', 'timeline', 'blast_radius', 'documentation', 'comparative', 'rule_suggestion'].includes(actionData?.handler ?? '')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { showAutocomplete, handleFocus, handleBlur } = useAutocomplete()

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const handleChipClick = (promptText: string) => {
    setText(promptText)
    inputRef.current?.focus()
    setTimeout(() => submit(promptText), 50)
  }

  const handleBreadcrumbRestore = (entry: { original_text: string }) => {
    setText(entry.original_text)
    inputRef.current?.focus()
  }

  const showDisambiguation =
    classification?.disambiguation_chips &&
    classification.disambiguation_chips.length > 0

  return (
    <div className="w-full z-50 relative">
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

        {/* Input */}
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
          />
          <AutocompleteDropdown
            inputValue={text}
            sessionId={sessionId}
            visible={showAutocomplete}
            onSelect={(t) => { setText(t); inputRef.current?.focus() }}
          />
        </div>

        {/* Submit button */}
        <button
          onClick={() => submit()}
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
        {(isActionRunning || actionProgress) && (
          <ProgressFeed message={actionProgress} isRunning={isActionRunning} />
        )}

        {/* Query preview card */}
        {currentResult && !actionOutput && (
          <QueryPreviewCard
            result={currentResult}
            onRun={() => console.log('Execute:', currentResult.generated_query)}
            onEdit={(q) => setText(q)}
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
