interface Props {
  output: string
}

export function ActionOutput({ output }: Props) {
  // Simple markdown-like rendering
  const lines = output.split('\n')
  const rendered = lines.map((line, i) => {
    if (line.startsWith('## ')) {
      return <h2 key={i} className="text-base font-semibold text-white mt-4 mb-1">{line.slice(3)}</h2>
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      return <p key={i} className="text-sm font-medium text-gray-200">{line.slice(2, -2)}</p>
    }
    if (line.startsWith('```kql') || line.startsWith('```')) {
      return null
    }
    if (line === '```') {
      return null
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return <li key={i} className="text-sm text-gray-300 ml-4 list-disc">{line.slice(2)}</li>
    }
    if (!line.trim()) {
      return <br key={i} />
    }
    return <p key={i} className="text-sm text-gray-300">{line}</p>
  })

  return (
    <div className="rounded-xl border border-gray-700/60 bg-gray-900/70 p-4 space-y-1 max-h-[400px] overflow-y-auto">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
        <span className="text-xs text-purple-400 font-medium">AI Output</span>
        <span className="text-xs text-gray-500">— AI-generated content highlighted</span>
      </div>
      <div className="text-sm leading-relaxed">{rendered}</div>
    </div>
  )
}
