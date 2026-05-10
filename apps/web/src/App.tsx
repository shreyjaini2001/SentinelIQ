import { SearchBar } from './components/SearchBar/SearchBar'
import { AlertTriagePanel } from './components/panels/AlertTriagePanel'
import { HuntResultPanel } from './components/panels/HuntResultPanel'
import { TimelinePanel } from './components/panels/TimelinePanel'
import { BlastRadiusPanel } from './components/panels/BlastRadiusPanel'
import { DocumentationPanel } from './components/panels/DocumentationPanel'
import { ComparativeAnalysisPanel } from './components/panels/ComparativeAnalysisPanel'
import { RuleSuggestionPanel } from './components/panels/RuleSuggestionPanel'
import { HandoffBriefingPanel } from './components/panels/HandoffBriefingPanel'
import { RunbookPanel } from './components/panels/RunbookPanel'
import { NoiseCoachingPanel } from './components/panels/NoiseCoachingPanel'
import { useSessionStore } from './stores/sessionStore'
import type {
  TriageResult, HuntResult, TimelineResult,
  BlastRadiusResult, DocumentationResult, ComparativeResult,
  RuleSuggestionResult, HandoffBriefingResult, RunbookResult, NoiseCoachingResult,
} from './types'

const ALERT_QUEUE = [
  { label: 'Critical', count: 3,   color: 'text-red-400',    bar: 'bg-red-500',    pct: 15 },
  { label: 'High',     count: 12,  color: 'text-orange-400', bar: 'bg-orange-500', pct: 40 },
  { label: 'Medium',   count: 47,  color: 'text-amber-400',  bar: 'bg-amber-500',  pct: 80 },
  { label: 'Low',      count: 128, color: 'text-gray-400',   bar: 'bg-gray-600',   pct: 100 },
]

const DEMO_CATEGORIES = [
  {
    label: 'Query',
    description: 'Natural-language KQL generation',
    dot: 'bg-blue-500',
    chip: 'border-blue-500/30 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20',
    prompts: ['Failed logins last 24h', 'Lateral movement events this week'],
  },
  {
    label: 'Triage & Hunt',
    description: 'AI-scored alert triage + ATT&CK hunt',
    dot: 'bg-purple-500',
    chip: 'border-purple-500/30 text-purple-300 bg-purple-500/10 hover:bg-purple-500/20',
    prompts: ['Triage my open alerts', 'Hunt for LAPSUS$ TTPs'],
  },
  {
    label: 'Investigation',
    description: 'Attack timelines, blast radius, behavioral analysis',
    dot: 'bg-orange-500',
    chip: 'border-orange-500/30 text-orange-300 bg-orange-500/10 hover:bg-orange-500/20',
    prompts: [
      'Timeline for jsmith@corp.com',
      'Blast radius for jsmith@corp.com',
      'Compare jsmith behavior vs baseline',
    ],
  },
  {
    label: 'Detection',
    description: 'AI-generated KQL detection rules with backtesting',
    dot: 'bg-emerald-500',
    chip: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20',
    prompts: ['Write a detection rule for this'],
  },
  {
    label: 'Reporting',
    description: 'Technical, executive and regulatory documentation',
    dot: 'bg-cyan-500',
    chip: 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20',
    prompts: [
      'Write a technical report',
      'Generate an executive summary for this investigation',
    ],
  },
  {
    label: 'Operations',
    description: 'Shift handoffs, runbooks and noise reduction',
    dot: 'bg-amber-500',
    chip: 'border-amber-500/30 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20',
    prompts: [
      'Write my handoff summary',
      'Generate a runbook for privilege escalation alerts',
      'Why does GeoAnomalyLogin fire so often?',
    ],
  },
]

function WelcomeState({ onPrompt }: { onPrompt: (text: string) => void }) {
  return (
    <div className="space-y-6">
      {/* Hero text */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-blue-400 text-lg">⌕</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white mb-1">AI-Native SIEM Platform</h2>
            <p className="text-sm text-gray-400 leading-relaxed max-w-lg">
              Ask any security question in plain English. SentinelIQ generates KQL, triages alerts,
              reconstructs attack timelines, and produces executive-ready reports — all from one bar.
            </p>
            <p className="text-xs text-gray-600 mt-2">Press Enter to submit · Shift+Enter for new line · Tab to autocomplete</p>
          </div>
        </div>
      </div>

      {/* Categorized demo prompts */}
      <div className="space-y-4">
        {DEMO_CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">{cat.label}</span>
              <span className="text-[10px] text-gray-700">{cat.description}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {cat.prompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onPrompt(prompt)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-150 ${cat.chip}`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MainPanel() {
  const { actionData, currentResult, setPendingQuery } = useSessionStore()

  if (actionData?.handler === 'triage')
    return <AlertTriagePanel result={actionData.data as TriageResult} />
  if (actionData?.handler === 'hunt')
    return <HuntResultPanel result={actionData.data as HuntResult} />
  if (actionData?.handler === 'timeline')
    return <TimelinePanel result={actionData.data as TimelineResult} />
  if (actionData?.handler === 'blast_radius')
    return <BlastRadiusPanel result={actionData.data as BlastRadiusResult} />
  if (actionData?.handler === 'documentation')
    return <DocumentationPanel result={actionData.data as DocumentationResult} />
  if (actionData?.handler === 'comparative')
    return <ComparativeAnalysisPanel result={actionData.data as ComparativeResult} />
  if (actionData?.handler === 'rule_suggestion')
    return <RuleSuggestionPanel result={actionData.data as RuleSuggestionResult} />
  if (actionData?.handler === 'handoff')
    return <HandoffBriefingPanel result={actionData.data as HandoffBriefingResult} />
  if (actionData?.handler === 'runbook')
    return <RunbookPanel result={actionData.data as RunbookResult} />
  if (actionData?.handler === 'noise_coaching')
    return <NoiseCoachingPanel result={actionData.data as NoiseCoachingResult} />

  if (currentResult) return null // QueryPreviewCard renders in SearchBar's below-bar area

  return <WelcomeState onPrompt={(text) => setPendingQuery(text)} />
}

export default function App() {
  return (
    <div className="min-h-screen bg-sentinel-bg">
      {/* Top navigation bar */}
      <header className="border-b border-gray-800/80 bg-gray-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-tight">S</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold text-white tracking-tight">SentinelIQ</span>
              <span className="text-[10px] text-gray-600 font-mono">v0.4.0</span>
            </div>
          </div>

          {/* Search bar fills remaining space */}
          <div className="flex-1 max-w-4xl">
            <SearchBar />
          </div>

          {/* Nav */}
          <nav className="hidden lg:flex items-center gap-1 shrink-0">
            {['Alerts', 'Hunts', 'Rules', 'Reports'].map((item) => (
              <button
                key={item}
                className="text-xs text-gray-500 hover:text-gray-200 hover:bg-gray-800/60 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content area */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-3 gap-6">

          {/* Left sidebar */}
          <div className="col-span-1 space-y-4">

            {/* Alert Queue */}
            <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Alert Queue</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-gray-600">Live</span>
                </div>
              </div>
              <div className="space-y-2.5">
                {ALERT_QUEUE.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{item.label}</span>
                      <span className={`text-sm font-mono font-semibold ${item.color}`}>{item.count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
                      <div className={`h-full rounded-full ${item.bar} opacity-60`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
                <span className="text-[10px] text-gray-600">190 total · updated just now</span>
                <span className="text-[10px] text-blue-500 cursor-not-allowed">View queue →</span>
              </div>
            </div>

            {/* Active Investigation */}
            <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3">Active Investigation</h3>
              <div className="flex flex-col items-center justify-center py-3 text-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-800/80 border border-gray-700/50 flex items-center justify-center">
                  <span className="text-gray-600 text-sm">◈</span>
                </div>
                <p className="text-xs text-gray-600">No active investigation.</p>
                <p className="text-[10px] text-gray-700">Use the search bar to start one.</p>
              </div>
            </div>

            {/* How to use */}
            <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3">AI Interaction Modes</h3>
              <div className="space-y-2.5">
                {[
                  { mode: 'Query',  color: 'text-blue-400',   dot: 'bg-blue-500',   example: '"Failed logins last 6h"' },
                  { mode: 'Action', color: 'text-purple-400', dot: 'bg-purple-500', example: '"Triage my open alerts"' },
                  { mode: 'Hunt',   color: 'text-orange-400', dot: 'bg-orange-500', example: '"Hunt for LAPSUS$ TTPs"' },
                  { mode: 'Refine', color: 'text-emerald-400',dot: 'bg-emerald-500',example: '"Now filter to finance"' },
                ].map((item) => (
                  <div key={item.mode} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.dot} mt-1.5 shrink-0`} />
                    <div>
                      <span className={`text-xs font-medium ${item.color}`}>{item.mode}</span>
                      <p className="text-[10px] text-gray-600 mt-0.5">{item.example}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Capability coverage */}
            <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3">Capabilities</h3>
              <div className="space-y-1">
                {[
                  { name: 'Alert Triage',        phase: 'P1', color: 'text-emerald-400' },
                  { name: 'Threat Hunt',         phase: 'P1', color: 'text-emerald-400' },
                  { name: 'Timeline',            phase: 'P1', color: 'text-emerald-400' },
                  { name: 'Blast Radius',        phase: 'P2', color: 'text-blue-400' },
                  { name: 'Documentation',       phase: 'P2', color: 'text-blue-400' },
                  { name: 'Behavioral Analysis', phase: 'P2', color: 'text-blue-400' },
                  { name: 'Rule Suggestion',     phase: 'P2', color: 'text-blue-400' },
                  { name: 'Shift Handoff',       phase: 'P3', color: 'text-cyan-400' },
                  { name: 'Runbook Generator',   phase: 'P3', color: 'text-cyan-400' },
                  { name: 'Noise Coaching',      phase: 'P3', color: 'text-cyan-400' },
                ].map((cap) => (
                  <div key={cap.name} className="flex items-center justify-between py-0.5">
                    <span className="text-[11px] text-gray-400">{cap.name}</span>
                    <span className={`text-[10px] font-mono ${cap.color}`}>{cap.phase}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main panel */}
          <div className="col-span-2 space-y-4">
            <MainPanel />
          </div>
        </div>
      </main>
    </div>
  )
}
