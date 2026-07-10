import { clsx } from 'clsx'
import { useInvestigationStore } from '../../stores/investigationStore'

/**
 * Shows the current workspace lens: "Scratch Mode" (neutral, no active case) or the
 * active case name. Purely a context indicator — it does not change any state.
 */
export function WorkspaceModeBadge({ className }: { className?: string }) {
  const activeId = useInvestigationStore((s) => s.activeInvestigationId)
  const investigations = useInvestigationStore((s) => s.investigations)
  const activeCase = investigations.find((i) => i.id === activeId)

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono border',
        activeCase
          ? 'text-blue-300 border-blue-500/30 bg-blue-500/10'
          : 'text-gray-400 border-gray-600/40 bg-gray-800/40',
        className,
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', activeCase ? 'bg-blue-400' : 'bg-gray-500')} />
      {activeCase ? `Case: ${activeCase.title}` : 'Scratch Mode'}
    </span>
  )
}
