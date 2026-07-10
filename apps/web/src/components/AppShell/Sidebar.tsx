import { useState } from 'react'
import { clsx } from 'clsx'
import { useInvestigationStore } from '../../stores/investigationStore'
import { useAlertStore } from '../../stores/alertStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { workspaceIdFor, snapshotCurrentWorkspace, restoreWorkspace } from '../../utils/workspaceMemory'
import { SCRATCH_WORKSPACE_ID, type WorkspacePageId } from '../../types/workspace'

export type PageId =
  | 'overview' | 'alerts' | 'investigations' | 'investigation-workspace'
  | 'logs' | 'hunts' | 'rules' | 'reports' | 'assets' | 'data-sources' | 'settings'

interface NavItem { id: PageId; label: string; icon: string; badge?: number }

const NAV_MAIN_BASE: Omit<NavItem, 'badge'>[] = [
  { id: 'overview',       label: 'Overview',      icon: '⊞' },
  { id: 'alerts',         label: 'Alerts',         icon: '◉' },
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
  const { investigations, activeInvestigationId, openInvestigation, closeActiveInvestigation } = useInvestigationStore()
  const openCount = useAlertStore((s) => s.openCount())
  const activeInv = investigations.find((i) => i.id === activeInvestigationId)
  const [showCaseSelector, setShowCaseSelector] = useState(false)

  const NAV_MAIN: NavItem[] = NAV_MAIN_BASE.map((item) =>
    item.id === 'alerts' ? { ...item, badge: openCount } : item,
  )

  // Workspace switch: remember where we are in the current workspace, close any transient
  // command overlay, switch the active case (or Scratch), then restore the target
  // workspace's last page. Investigation memory is never touched here.
  function switchWorkspace(targetId: string | null) {
    const ws = useWorkspaceStore.getState()
    const outgoing = workspaceIdFor(activeInvestigationId)
    const incoming = targetId ?? SCRATCH_WORKSPACE_ID
    if (incoming === outgoing) { setShowCaseSelector(false); return }

    // Auto-checkpoint the outgoing workspace, close overlays, flip the active case, then
    // restore the incoming workspace (Scratch is always reset fresh; a case restores its
    // checkpoint). Investigation memory is never touched here.
    ws.setLastPage(outgoing, currentPage as WorkspacePageId)
    snapshotCurrentWorkspace(outgoing)
    useSessionStore.getState().clear() // close overlay + clear transient command result
    if (targetId) openInvestigation(targetId)
    else closeActiveInvestigation()
    restoreWorkspace(incoming)
    setShowCaseSelector(false)
    const restored = ws.getWorkspace(incoming).lastPage
    onNavigate(restored ?? (targetId ? 'investigation-workspace' : 'overview'))
  }

  // Investigations nav item is highlighted when on either the list or the workspace
  const isInvActive =
    currentPage === 'investigations' || currentPage === 'investigation-workspace'

  return (
    <div className="flex flex-col h-full pt-3 pb-3">

      {/* Active case card with change/clear controls */}
      <div className="px-2 mb-3">
        {activeInv ? (
          <div className={clsx(
            'rounded-lg border transition-all',
            currentPage === 'investigation-workspace'
              ? 'border-blue-500/30 bg-blue-500/10'
              : 'border-gray-700/50 bg-gray-900/40',
          )}>
            {/* Case header row */}
            <div className="flex items-center gap-1 px-3 pt-2.5 pb-1">
              <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', SEV_DOT[activeInv.severity])} />
              <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest flex-1">Active Case</span>
              {/* Change button */}
              <button
                onClick={() => setShowCaseSelector((v) => !v)}
                title="Switch case"
                className="text-[9px] text-gray-600 hover:text-gray-400 px-1 transition-colors"
              >
                {showCaseSelector ? '▲' : '▼'}
              </button>
              {/* Clear / scratch mode button */}
              <button
                onClick={() => switchWorkspace(null)}
                title="Switch to Scratch Mode (no active case)"
                className="text-[9px] text-gray-600 hover:text-red-400 px-1 transition-colors leading-none"
              >
                ×
              </button>
            </div>
            {/* Case title — click to go to workspace */}
            <button
              onClick={() => { setShowCaseSelector(false); onNavigate('investigation-workspace') }}
              className="w-full text-left px-3 pb-2.5"
            >
              <p className="text-[11px] text-gray-200 font-medium truncate leading-snug">{activeInv.title}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">
                {activeInv.turns.length} turns · {activeInv.artifacts.length} artifacts
              </p>
            </button>
            {/* Case switcher dropdown */}
            {showCaseSelector && (
              <div className="border-t border-gray-700/50 px-2 py-1.5 space-y-0.5 max-h-40 overflow-y-auto">
                {/* Explicit Scratch Mode option */}
                <button
                  onClick={() => switchWorkspace(null)}
                  className="w-full text-left px-2 py-1 rounded text-[10px] text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition-colors truncate"
                >
                  ○ Scratch Mode / No Active Case
                </button>
                {investigations.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => switchWorkspace(inv.id)}
                    className={clsx(
                      'w-full text-left px-2 py-1 rounded text-[10px] transition-colors truncate',
                      inv.id === activeInvestigationId
                        ? 'text-blue-300 bg-blue-500/10'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50',
                    )}
                  >
                    {inv.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Scratch mode — no active case */
          <div className="rounded-lg border border-gray-700/30 bg-gray-900/20 px-3 py-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-600 shrink-0" />
              <span className="text-[9px] font-mono text-gray-700 uppercase tracking-widest">No Active Case · Scratch Mode</span>
            </div>
            <p className="text-[10px] text-gray-600 mb-1 leading-snug">
              New queries, alerts &amp; hunts won't attach to a case. Save/pin/link will ask for a destination.
            </p>
            {investigations.length > 0 ? (
              <select
                className="w-full text-[10px] bg-gray-900 border border-gray-700/50 text-gray-400 rounded px-1 py-0.5 mt-0.5"
                value=""
                onChange={(e) => { if (e.target.value) switchWorkspace(e.target.value) }}
              >
                <option value="">Select a case…</option>
                {investigations.map((inv) => (
                  <option key={inv.id} value={inv.id}>{inv.title}</option>
                ))}
              </select>
            ) : (
              <p className="text-[10px] text-gray-700">No cases yet</p>
            )}
          </div>
        )}
      </div>

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
