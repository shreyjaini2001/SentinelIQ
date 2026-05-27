import { clsx } from 'clsx'
import type { SiemPlatform } from '../../types/queryPlan'
import { PLATFORM_NAMES } from '../../utils/siemAdapters'

const PLATFORMS: { id: SiemPlatform; short: string }[] = [
  { id: 'sentinel', short: 'Sentinel' },
  { id: 'splunk',   short: 'Splunk' },
  { id: 'elastic',  short: 'Elastic' },
]

interface Props {
  value: SiemPlatform
  onChange: (p: SiemPlatform) => void
}

export function PlatformSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-gray-700/40 bg-gray-900/40 p-0.5">
      {PLATFORMS.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          title={PLATFORM_NAMES[p.id]}
          className={clsx(
            'text-[9px] px-2 py-0.5 rounded transition-colors',
            p.id === value
              ? 'bg-blue-600/50 text-blue-100 font-medium'
              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50',
          )}
        >
          {p.short}
        </button>
      ))}
    </div>
  )
}
