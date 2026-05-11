import { clsx } from 'clsx'

export type PageId =
  | 'overview' | 'alerts' | 'investigations' | 'logs'
  | 'hunts' | 'rules' | 'reports' | 'assets' | 'data-sources' | 'settings'

interface NavItem { id: PageId; label: string; icon: string; badge?: number }

const NAV_MAIN: NavItem[] = [
  { id: 'overview',       label: 'Overview',       icon: '⊞' },
  { id: 'alerts',         label: 'Alerts',         icon: '◉', badge: 190 },
  { id: 'investigations', label: 'Investigations',  icon: '◈' },
  { id: 'logs',           label: 'Logs',            icon: '⊟' },
  { id: 'hunts',          label: 'Hunts',           icon: '⊕' },
  { id: 'rules',          label: 'Rules',           icon: '⊛' },
  { id: 'reports',        label: 'Reports',         icon: '◧' },
  { id: 'assets',         label: 'Assets',          icon: '▣' },
  { id: 'data-sources',   label: 'Data Sources',    icon: '≡' },
]

const NAV_BOTTOM: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

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
  return (
    <div className="flex flex-col h-full pt-3 pb-3">
      <div className="flex-1 px-2 space-y-0.5">
        {NAV_MAIN.map((item) => (
          <NavBtn key={item.id} item={item} active={currentPage === item.id} onClick={() => onNavigate(item.id)} />
        ))}
      </div>
      <div className="px-2 pt-3 mt-3 border-t border-gray-800/60 space-y-0.5">
        {NAV_BOTTOM.map((item) => (
          <NavBtn key={item.id} item={item} active={currentPage === item.id} onClick={() => onNavigate(item.id)} />
        ))}
      </div>
    </div>
  )
}
