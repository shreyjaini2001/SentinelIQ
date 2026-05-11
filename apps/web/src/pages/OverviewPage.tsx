import { AlertTriagePanel } from '../components/panels/AlertTriagePanel'
import { HuntResultPanel } from '../components/panels/HuntResultPanel'
import { TimelinePanel } from '../components/panels/TimelinePanel'
import { BlastRadiusPanel } from '../components/panels/BlastRadiusPanel'
import { DocumentationPanel } from '../components/panels/DocumentationPanel'
import { ComparativeAnalysisPanel } from '../components/panels/ComparativeAnalysisPanel'
import { RuleSuggestionPanel } from '../components/panels/RuleSuggestionPanel'
import { HandoffBriefingPanel } from '../components/panels/HandoffBriefingPanel'
import { RunbookPanel } from '../components/panels/RunbookPanel'
import { NoiseCoachingPanel } from '../components/panels/NoiseCoachingPanel'
import { useSessionStore } from '../stores/sessionStore'
import type { PageId } from '../components/AppShell/Sidebar'
import type {
  TriageResult, HuntResult, TimelineResult,
  BlastRadiusResult, DocumentationResult, ComparativeResult,
  RuleSuggestionResult, HandoffBriefingResult, RunbookResult, NoiseCoachingResult,
} from '../types'

const ALERT_QUEUE = [
  { label: 'Critical', count: 3,   color: 'text-red-400',    bar: 'bg-red-500',    pct: 15 },
  { label: 'High',     count: 12,  color: 'text-orange-400', bar: 'bg-orange-500', pct: 40 },
  { label: 'Medium',   count: 47,  color: 'text-amber-400',  bar: 'bg-amber-500',  pct: 80 },
  { label: 'Low',      count: 128, color: 'text-gray-400',   bar: 'bg-gray-600',   pct: 100 },
]

const DEMO_CATEGORIES = [
  {
    label: 'Query',
    dot: 'bg-blue-500',
    chip: 'border-blue-500/30 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20',
    prompts: ['Show me failed logins last 6 hours', 'Lateral movement events this week'],
  },
  {
    label: 'Triage & Hunt',
    dot: 'bg-purple-500',
    chip: 'border-purple-500/30 text-purple-300 bg-purple-500/10 hover:bg-purple-500/20',
    prompts: ['Triage my open alerts', 'Hunt for LAPSUS$ TTPs'],
  },
  {
    label: 'Investigation',
    dot: 'bg-orange-500',
    chip: 'border-orange-500/30 text-orange-300 bg-orange-500/10 hover:bg-orange-500/20',
    prompts: [
      'Build a timeline for jsmith@corp.com',
      'Map the blast radius for jsmith',
      'Compare jsmith behavior vs baseline',
    ],
  },
  {
    label: 'Detection',
    dot: 'bg-emerald-500',
    chip: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20',
    prompts: ['Create a detection rule from this pattern'],
  },
  {
    label: 'Reporting',
    dot: 'bg-cyan-500',
    chip: 'border-cyan-500/30 text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20',
    prompts: [
      'Generate an executive summary for this investigation',
      'Write a technical report',
    ],
  },
  {
    label: 'Operations',
    dot: 'bg-amber-500',
    chip: 'border-amber-500/30 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20',
    prompts: [
      'Write my handoff summary',
      'Generate a runbook for privilege escalation alerts',
      'Why does GeoAnomalyLogin fire so often?',
    ],
  },
]

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 px-4 py-3">
      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-600 mt-0.5">{sub}</div>
    </div>
  )
}

function WelcomeState({ onPrompt }: { onPrompt: (text: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
            <span className="text-blue-400 text-base">⌕</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white mb-1">AI-Native SIEM Platform</h2>
            <p className="text-xs text-gray-400 leading-relaxed max-w-lg">
              Ask any security question in plain English. SentinelIQ generates KQL, triages alerts,
              reconstructs attack timelines, and produces executive-ready reports — all from one bar.
            </p>
            <p className="text-[11px] text-gray-600 mt-1.5">Enter to submit · Shift+Enter for new line · Tab to autocomplete</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {DEMO_CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">{cat.label}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cat.prompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onPrompt(prompt)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all duration-150 ${cat.chip}`}
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

  if (currentResult) return null

  return <WelcomeState onPrompt={(text) => setPendingQuery(text)} />
}

interface OverviewPageProps {
  onNavigate: (page: PageId) => void
}

export function OverviewPage({ onNavigate }: OverviewPageProps) {
  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Alerts"    value={190} sub="updated just now"           color="text-white" />
        <StatCard label="Critical"        value={3}   sub="require immediate action"    color="text-red-400" />
        <StatCard label="Investigations"  value={2}   sub="active this shift"           color="text-orange-400" />
        <StatCard label="Active Hunts"    value={1}   sub="in progress"                 color="text-purple-400" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-5">

        {/* Left column — widgets */}
        <div className="col-span-1 space-y-4">

          {/* Alert queue */}
          <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Alert Queue</h3>
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
              <span className="text-[10px] text-gray-600">190 total</span>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
              >
                View queue →
              </button>
            </div>
          </div>

          {/* AI Interaction Modes */}
          <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3">AI Modes</h3>
            <div className="space-y-2.5">
              {[
                { mode: 'Query',  color: 'text-blue-400',    dot: 'bg-blue-500',    example: '"Failed logins last 6h"' },
                { mode: 'Action', color: 'text-purple-400',  dot: 'bg-purple-500',  example: '"Triage my open alerts"' },
                { mode: 'Hunt',   color: 'text-orange-400',  dot: 'bg-orange-500',  example: '"Hunt for LAPSUS$ TTPs"' },
                { mode: 'Refine', color: 'text-emerald-400', dot: 'bg-emerald-500', example: '"Now filter to finance"' },
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

          {/* Capabilities */}
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

        {/* Right column — AI workspace */}
        <div className="col-span-2 space-y-4">
          <MainPanel />
        </div>

      </div>
    </div>
  )
}
