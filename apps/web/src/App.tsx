import { SearchBar } from './components/SearchBar/SearchBar'
import { AlertTriagePanel } from './components/panels/AlertTriagePanel'
import { HuntResultPanel } from './components/panels/HuntResultPanel'
import { TimelinePanel } from './components/panels/TimelinePanel'
import { useSessionStore } from './stores/sessionStore'
import type { TriageResult, HuntResult, TimelineResult } from './types'

const EXAMPLE_PROMPTS = [
  'Failed logins last 24h',
  'Triage my open alerts',
  'Hunt for LAPSUS$ TTPs',
  'Timeline for jsmith@corp.com',
]

function MainPanel() {
  const { actionData, currentResult, setPendingQuery } = useSessionStore()

  if (actionData?.handler === 'triage') {
    return <AlertTriagePanel result={actionData.data as TriageResult} />
  }

  if (actionData?.handler === 'hunt') {
    return <HuntResultPanel result={actionData.data as HuntResult} />
  }

  if (actionData?.handler === 'timeline') {
    return <TimelinePanel result={actionData.data as TimelineResult} />
  }

  if (currentResult) {
    return null // QueryPreviewCard renders in SearchBar's below-bar area
  }

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-6 flex flex-col items-center justify-center min-h-[400px]">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto">
          <span className="text-2xl">⌕</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-200">Ask the AI Search Bar</h2>
        <p className="text-sm text-gray-400 max-w-sm">
          Type any security question in plain English above.
          The AI will generate the query, explain it, and suggest next steps.
        </p>
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {EXAMPLE_PROMPTS.map((example) => (
            <button
              key={example}
              onClick={() => setPendingQuery(example)}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-600 text-gray-400 hover:border-blue-500/60 hover:text-blue-300 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-sentinel-bg">
      {/* Top navigation bar */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="text-sm font-semibold text-white">SentinelIQ</span>
            <span className="text-xs text-gray-500 ml-1">Phase 1</span>
          </div>

          {/* Search bar — always visible, expands to fill */}
          <div className="flex-1 max-w-4xl">
            <SearchBar />
          </div>

          {/* Nav items */}
          <nav className="hidden lg:flex items-center gap-4 shrink-0">
            <button className="text-xs text-gray-400 hover:text-gray-200 transition-colors">Alerts</button>
            <button className="text-xs text-gray-400 hover:text-gray-200 transition-colors">Hunts</button>
            <button className="text-xs text-gray-400 hover:text-gray-200 transition-colors">Rules</button>
            <button className="text-xs text-gray-400 hover:text-gray-200 transition-colors">Reports</button>
          </nav>
        </div>
      </header>

      {/* Main content area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Left: Summary stats */}
          <div className="col-span-1 space-y-4">
            <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-4">
              <h3 className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">Alert Queue</h3>
              <div className="space-y-2">
                {[
                  { label: 'Critical', count: 3, color: 'text-red-400' },
                  { label: 'High', count: 12, color: 'text-orange-400' },
                  { label: 'Medium', count: 47, color: 'text-amber-400' },
                  { label: 'Low', count: 128, color: 'text-gray-400' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">{item.label}</span>
                    <span className={`text-sm font-mono font-medium ${item.color}`}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-4">
              <h3 className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">Active Investigations</h3>
              <div className="space-y-2">
                <div className="text-xs text-gray-500">No active investigations.</div>
                <div className="text-xs text-gray-500">Ask the AI bar to start one.</div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 p-4">
              <h3 className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">How to use the bar</h3>
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex gap-2">
                  <span className="text-blue-400 shrink-0">Query</span>
                  <span>"Show me failed logins last 6 hours"</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-purple-400 shrink-0">Action</span>
                  <span>"Triage my open alerts"</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-orange-400 shrink-0">Hunt</span>
                  <span>"Hunt for LAPSUS$ TTPs"</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-emerald-400 shrink-0">Refine</span>
                  <span>"Now filter to just finance"</span>
                </div>
                <p className="text-gray-500 mt-2">Press Enter to submit. Shift+Enter for new line.</p>
              </div>
            </div>
          </div>

          {/* Right: Main panel */}
          <div className="col-span-2 space-y-4">
            <MainPanel />
          </div>
        </div>
      </main>
    </div>
  )
}
