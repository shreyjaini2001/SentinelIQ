import { clsx } from 'clsx'
import { useInvestigationStore } from '../../stores/investigationStore'

export type PageId =
  | 'overview' | 'alerts' | 'investigations' | 'investigation-workspace'
  | 'logs' | 'hunts' | 'rules' | 'reports' | 'assets' | 'data-sources' | 'settings'

interface NavItem { id: PageId; label: string; icon: string; badge?: number }

const NAV_MAIN: NavItem[] = [
  { id: 'overview',       label: 'Overview',      icon: '⊞' },
  { id: 'alerts',         label: 'Alerts',         icon: '◉', badge: 190 },
  { id: 'investigations', label: 'Investigations', icon: '◈' },
  { id: 'logs',           label: 'Logs',           icon: '⊟' },
  { id: 'hunts',          label: 'Hunts',          icon: '⊕' },
  { id: 'rules',          label: 'Rules',          icon: '⊛' },
  { id: 'reports',        label: 'Reports',        icon: '◧' },
  { id: 'assets',         label: 'Assets',         icon: '▣' },
  { id: 'data-sources',   label: 'Data Sources',   icon: '≡' },
]

const NAV_BOTTOM: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

const SEV_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-amber-500',
  low:      'bg-gray-500',
}

interface SidebarProps {
  currentPage: PageId
  onNavigate: (page: PageId) => void
}

function NavBtn({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 border text-left',
        active
          ? 'bg-blue-600/15 text-blue-300 border-blue-500/20 font-medium'
          : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800/50 border-transparent',
      )}
    >
      <span className="text-sm leading-none shrink-0 w-4 text-center">{item.icon}</span>
      <span className="flex-1 text-[13px]">{item.label}</span>
      {item.badge !== undefined && (
        <span className={clsx(
          'text-[10px] font-mono px-1.5 py-0.5 rounded',
          active ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-800/80 text-gray-500',
        )}>
          {item.badge}
        </span>
      )}
    </button>
  )
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { investigations, activeInvestigationId } = useInvestigationStore()
  const activeInv = investigations.find((i) => i.id === activeInvestigationId)

  // Investigations nav item is highlighted when on either the list or the workspace
  const isInvActive =
    currentPage === 'investigations' || currentPage === 'investigation-workspace'

  return (
    <div className="flex flex-col h-full pt-3 pb-3">

      {/* Active investigation context card */}
      {activeInv && (
        <div className="px-2 mb-3">
          <button
            onClick={() => onNavigate('investigation-workspace')}
            className={clsx(
              'w-full text-left rounded-lg border px-3 py-2.5 transition-all',
              currentPage === 'investigation-workspace'
                ? 'border-blue-500/30 bg-blue-500/10'
                : 'border-gray-700/50 bg-gray-900/40 hover:border-gray-600/60',
            )}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', SEV_DOT[activeInv.severity])} />
              <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Active Case</span>
            </div>
            <p className="text-[11px] text-gray-200 font-medium truncate leading-snug">{activeInv.title}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">
              {activeInv.turns.length} turns · {activeInv.artifacts.length} artifacts
            </p>
          </button>
        </div>
      )}

      <div className="flex-1 px-2 space-y-0.5">
        {NAV_MAIN.map((item) => {
          if (item.id === 'investigations') {
            return (
              <NavBtn
                key={item.id}
                item={item}
                active={isInvActive}
                onClick={() => onNavigate('investigations')}
              />
            )
          }
          return (
            <NavBtn
              key={item.id}
              item={item}
              active={currentPage === item.id}
              onClick={() => onNavigate(item.id)}
            />
          )
        })}
      </div>

      <div className="px-2 pt-3 mt-3 border-t border-gray-800/60 space-y-0.5">
        {NAV_BOTTOM.map((item) => (
          <NavBtn key={item.id} item={item} active={currentPage === item.id} onClick={() => onNavigate(item.id)} />
        ))}
      </div>
    </div>
  )
}
