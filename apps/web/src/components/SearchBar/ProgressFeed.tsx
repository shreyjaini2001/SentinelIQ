interface Props {
  message: string | null
  isRunning: boolean
}

export function ProgressFeed({ message, isRunning }: Props) {
  if (!isRunning && !message) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
      {isRunning && (
        <span className="inline-block w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
      )}
      <span className="text-xs text-purple-300">{message ?? 'Processing...'}</span>
    </div>
  )
}
