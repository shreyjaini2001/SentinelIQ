import { clsx } from 'clsx'
import type { ExtractedEntity } from '../../utils/mockResults'

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  user:     { label: 'User',    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25 hover:bg-cyan-500/20' },
  host:     { label: 'Host',    color: 'text-blue-400 bg-blue-500/10 border-blue-500/25 hover:bg-blue-500/20' },
  ip:       { label: 'IP',      color: 'text-red-400 bg-red-500/10 border-red-500/25 hover:bg-red-500/20' },
  process:  { label: 'Process', color: 'text-orange-400 bg-orange-500/10 border-orange-500/25 hover:bg-orange-500/20' },
  country:  { label: 'Country', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/20' },
  event_id: { label: 'EventID', color: 'text-purple-400 bg-purple-500/10 border-purple-500/25 hover:bg-purple-500/20' },
}

interface Props {
  entities: ExtractedEntity[]
  onEntityClick?: (entity: ExtractedEntity) => void
}

export function EntityChips({ entities, onEntityClick }: Props) {
  if (entities.length === 0) return null

  // Deduplicate by type+value
  const seen = new Set<string>()
  const unique = entities.filter((e) => {
    const key = `${e.type}:${e.value}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
        Extracted Entities
      </div>
      <div className="flex flex-wrap gap-1.5">
        {unique.map((entity) => {
          const cfg = TYPE_CONFIG[entity.type] ?? {
            label: entity.type,
            color: 'text-gray-400 bg-gray-700/20 border-gray-700/40 hover:bg-gray-700/40',
          }
          return (
            <button
              key={`${entity.type}:${entity.value}`}
              onClick={() => onEntityClick?.(entity)}
              className={clsx(
                'flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-colors',
                cfg.color,
                onEntityClick ? 'cursor-pointer' : 'cursor-default',
              )}
            >
              <span className="text-[9px] opacity-60">{cfg.label}</span>
              <span className="font-mono">{entity.value}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
