import { useState, useEffect } from 'react'
import { SearchBar } from './components/SearchBar/SearchBar'
import { Sidebar, type PageId } from './components/AppShell/Sidebar'
import { OverviewPage } from './pages/OverviewPage'
import { AlertsPage } from './pages/AlertsPage'
import { InvestigationsPage } from './pages/InvestigationsPage'
import { LogsPage } from './pages/LogsPage'
import { HuntsPage } from './pages/HuntsPage'
import { RulesPage } from './pages/RulesPage'
import { ReportsPage } from './pages/ReportsPage'
import { AssetsPage } from './pages/AssetsPage'
import { DataSourcesPage } from './pages/DataSourcesPage'
import { SettingsPage } from './pages/SettingsPage'
import { useSessionStore } from './stores/sessionStore'

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('overview')
  const { actionData, logsKql, setResult, setChips } = useSessionStore()

  // Auto-navigate to Overview when an AI action panel result arrives
  useEffect(() => {
    if (actionData) setCurrentPage('overview')
  }, [actionData])

  // Auto-navigate to Logs when a query is sent there via "Open in Logs"
  useEffect(() => {
    if (logsKql) setCurrentPage('logs')
  }, [logsKql])

  // Navigating clears the transient QueryPreviewCard so it doesn't float over unrelated pages
  const handleNavigate = (page: PageId) => {
    setCurrentPage(page)
    setResult(null)
    setChips([])
  }

  return (
    <div className="bg-sentinel-bg min-h-screen">

      {/* Sticky global header with AI command bar */}
      <header className="sticky top-0 z-40 border-b border-gray-800/80 bg-gray-950/80 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-tight">S</span>
            </div>
            <div className="hidden lg:flex items-baseline gap-1.5">
              <span className="text-sm font-semibold text-white tracking-tight">SentinelIQ</span>
              <span className="text-[10px] text-gray-600 font-mono">v0.5.0</span>
            </div>
          </div>

          {/* Global AI command bar */}
          <div className="flex-1 max-w-3xl">
            <SearchBar />
          </div>

          {/* Mock mode indicator + analyst avatar */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-gray-700/50 bg-gray-900/40">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-[10px] text-gray-500">Mock</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center">
              <span className="text-blue-300 text-xs font-bold">A</span>
            </div>
          </div>

        </div>
      </header>

      {/* Body: sidebar + main content */}
      <div className="flex">

        {/* Left navigation sidebar */}
        <aside className="w-52 shrink-0 border-r border-gray-800/60 bg-gray-950/40 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto self-start">
          <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
        </aside>

        {/* Main content area */}
        <main className="flex-1 min-w-0 px-6 py-6">
          {currentPage === 'overview'       && <OverviewPage onNavigate={handleNavigate} />}
          {currentPage === 'alerts'         && <AlertsPage />}
          {currentPage === 'investigations' && <InvestigationsPage />}
          {currentPage === 'logs'           && <LogsPage />}
          {currentPage === 'hunts'          && <HuntsPage />}
          {currentPage === 'rules'          && <RulesPage />}
          {currentPage === 'reports'        && <ReportsPage />}
          {currentPage === 'assets'         && <AssetsPage />}
          {currentPage === 'data-sources'   && <DataSourcesPage />}
          {currentPage === 'settings'       && <SettingsPage />}
        </main>

      </div>
    </div>
  )
}
