import type { SiemPlatform } from '../../types/queryPlan'
import { getAdapter, PLATFORM_NAMES, PLATFORM_LANGUAGES } from '../../utils/siemAdapters'

const PLATFORMS: SiemPlatform[] = ['sentinel', 'splunk', 'elastic']

export function AdapterCapabilities() {
  return (
    <div className="space-y-3">
      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
        Source Catalog
      </div>
      {PLATFORMS.map((platform) => {
        const adapter = getAdapter(platform)
        const sources = adapter.getSupportedSources()
        return (
          <div key={platform} className="rounded-lg border border-gray-700/30 bg-gray-900/30 p-2.5 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium text-gray-400">{PLATFORM_NAMES[platform]}</span>
              <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${
                platform === 'sentinel' ? 'text-blue-400 border-blue-500/25 bg-blue-500/5' :
                platform === 'splunk'   ? 'text-orange-400 border-orange-500/25 bg-orange-500/5' :
                                          'text-green-400 border-green-500/25 bg-green-500/5'
              }`}>
                {PLATFORM_LANGUAGES[platform]}
              </span>
            </div>
            <div className="pl-1 space-y-0.5">
              {sources.map((s, i) => (
                <div key={i} className="flex items-center gap-1 text-[9px]">
                  <span className="text-gray-600 shrink-0 min-w-0 truncate">{s.neutralName}</span>
                  <span className="text-gray-700 shrink-0">→</span>
                  <span className="font-mono text-gray-500 truncate">{s.platformSource}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
