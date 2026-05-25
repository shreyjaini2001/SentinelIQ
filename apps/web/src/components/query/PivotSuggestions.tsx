import { submitCommand } from '../../utils/commandRunner'
import type { MockQueryResult } from '../../utils/mockResults'

interface Pivot {
  label: string
  prompt: string
  color: string
}

function buildPivots(result: MockQueryResult): Pivot[] {
  const users   = result.extractedEntities.filter((e) => e.type === 'user').map((e) => e.value)
  const hosts   = result.extractedEntities.filter((e) => e.type === 'host').map((e) => e.value)
  const pivots: Pivot[] = []

  if (users.length > 0) {
    const u = users[0]
    pivots.push({
      label: `Timeline for ${u}`,
      prompt: `Build a timeline for ${u}`,
      color: 'text-orange-300 bg-orange-500/10 border-orange-500/25 hover:bg-orange-500/20',
    })
    pivots.push({
      label: `Blast radius for ${u}`,
      prompt: `What is the blast radius for ${u}?`,
      color: 'text-red-300 bg-red-500/10 border-red-500/25 hover:bg-red-500/20',
    })
  }

  if (hosts.length > 0) {
    const h = hosts[0]
    pivots.push({
      label: `Endpoint activity on ${h}`,
      prompt: `Show me all process executions on ${h} in the last 24 hours`,
      color: 'text-blue-300 bg-blue-500/10 border-blue-500/25 hover:bg-blue-500/20',
    })
  }

  if (result.sourceTable === 'SigninLogs' || result.sourceTable === 'IdentityLogonEvents') {
    pivots.push({
      label: users.length > 0 ? `Compare ${users[0]} vs baseline` : 'Compare behavior vs baseline',
      prompt: users.length > 0
        ? `Compare ${users[0]} behavior vs baseline`
        : 'Compare user activity patterns vs baseline',
      color: 'text-teal-300 bg-teal-500/10 border-teal-500/25 hover:bg-teal-500/20',
    })
  }

  pivots.push({
    label: 'Create detection rule',
    prompt: 'Create a detection rule from this pattern',
    color: 'text-purple-300 bg-purple-500/10 border-purple-500/25 hover:bg-purple-500/20',
  })

  pivots.push({
    label: 'Hunt related TTPs',
    prompt: users.length > 0
      ? `Hunt for credential access and lateral movement TTPs related to ${users[0]}`
      : 'Hunt for related threat TTPs in the last 7 days',
    color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/20',
  })

  return pivots.slice(0, 5)
}

interface Props {
  result: MockQueryResult
}

export function PivotSuggestions({ result }: Props) {
  const pivots = buildPivots(result)

  if (pivots.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
        Suggested Pivots
      </div>
      <div className="flex flex-wrap gap-1.5">
        {pivots.map((pivot) => (
          <button
            key={pivot.label}
            onClick={() => void submitCommand(pivot.prompt, { source: 'pivot_chip' })}
            className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors ${pivot.color}`}
          >
            {pivot.label} →
          </button>
        ))}
      </div>
    </div>
  )
}
