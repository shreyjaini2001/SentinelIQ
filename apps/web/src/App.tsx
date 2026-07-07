import { useState, useEffect, useRef } from 'react'
import { SearchBar } from './components/SearchBar/SearchBar'
import { Sidebar, type PageId } from './components/AppShell/Sidebar'
import { OverviewPage } from './pages/OverviewPage'
import { AlertsPage } from './pages/AlertsPage'
import { InvestigationsPage } from './pages/InvestigationsPage'
import { InvestigationWorkspacePage } from './pages/InvestigationWorkspacePage'
import { LogsPage } from './pages/LogsPage'
import { HuntsPage } from './pages/HuntsPage'
import { RulesPage } from './pages/RulesPage'
import { ReportsPage } from './pages/ReportsPage'
import { AssetsPage } from './pages/AssetsPage'
import { DataSourcesPage } from './pages/DataSourcesPage'
import { SettingsPage } from './pages/SettingsPage'
import { useSessionStore } from './stores/sessionStore'

export default function App() {
  // Navigation history — internal stack + browser history sync
  const navRef = useRef<{ stack: PageId[]; idx: number }>({ stack: ['overview'], idx: 0 })
  const [currentPage, setCurrentPage] = useState<PageId>('overview')
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)

  const { actionData, logsKql, setResult, setChips } = useSessionStore()

  const navigate = (page: PageId) => {
    const { stack, idx } = navRef.current
    const newStack = [...stack.slice(0, idx + 1), page]
    const newIdx = idx + 1
    navRef.current = { stack: newStack, idx: newIdx }
    setCurrentPage(page)
    setCanGoBack(true)
    setCanGoForward(false)
    history.pushState({ page, idx: newIdx }, '', `#${page}`)
    setResult(null)
    setChips([])
  }

  const goBack = () => {
    if (navRef.current.idx > 0) history.back()
  }

  const goForward = () => {
    const { stack, idx } = navRef.current
    if (idx < stack.length - 1) history.forward()
  }

  // Initialize browser history and listen for popstate (browser back/forward)
  useEffect(() => {
    history.replaceState({ page: 'overview', idx: 0 }, '', '#overview')

    const handlePop = (e: PopStateEvent) => {
      const page = (e.state?.page ?? 'overview') as PageId
      const idx = (e.state?.idx ?? 0) as number
      navRef.current = { ...navRef.current, idx }
      setCurrentPage(page)
      setCanGoBack(idx > 0)
      setCanGoForward(idx < navRef.current.stack.length - 1)
      setResult(null)
      setChips([])
    }

    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-navigate to Overview when an AI action panel result arrives
  useEffect(() => {
    if (actionData) navigate('overview')
  }, [actionData]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-navigate to Logs when a query is sent there via "Open in Logs"
  useEffect(() => {
    if (logsKql) navigate('logs')
  }, [logsKql]) // eslint-disable-line react-hooks/exhaustive-deps

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
              <span className="text-[10px] text-gray-600 font-mono">v1.1.0</span>
            </div>
          </div>

          {/* Back / Forward */}
          <div className="hidden sm:flex items-center gap-0.5 shrink-0">
            <button
              onClick={goBack}
              disabled={!canGoBack}
              title="Go back"
              className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:text-gray-200 hover:bg-gray-800/60 disabled:opacity-25 disabled:cursor-not-allowed transition-colors text-base leading-none"
            >
              ←
            </button>
            <button
              onClick={goForward}
              disabled={!canGoForward}
              title="Go forward"
              className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:text-gray-200 hover:bg-gray-800/60 disabled:opacity-25 disabled:cursor-not-allowed transition-colors text-base leading-none"
            >
              →
            </button>
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
          <Sidebar currentPage={currentPage} onNavigate={navigate} />
        </aside>

        {/* Main content area */}
        <main className="flex-1 min-w-0 px-6 py-6">
          {currentPage === 'overview'                && <OverviewPage onNavigate={navigate} />}
          {currentPage === 'alerts'                  && <AlertsPage />}
          {currentPage === 'investigations'          && <InvestigationsPage onNavigate={navigate} />}
          {currentPage === 'investigation-workspace' && <InvestigationWorkspacePage onBack={() => navigate('investigations')} />}
          {currentPage === 'logs'                    && <LogsPage />}
          {currentPage === 'hunts'                   && <HuntsPage />}
          {currentPage === 'rules'                   && <RulesPage />}
          {currentPage === 'reports'                 && <ReportsPage />}
          {currentPage === 'assets'                  && <AssetsPage />}
          {currentPage === 'data-sources'            && <DataSourcesPage />}
          {currentPage === 'settings'                && <SettingsPage />}
        </main>

      </div>
    </div>
  )
}
