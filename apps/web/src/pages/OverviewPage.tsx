import { useMemo } from 'react'
import { submitCommand } from '../utils/commandRunner'
import { useAlertStore } from '../stores/alertStore'
import { useInvestigationStore } from '../stores/investigationStore'
import { WorkspaceModeBadge } from '../components/common/WorkspaceModeBadge'
import type { PageId } from '../components/AppShell/Sidebar'


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

function WelcomeState() {
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
                  onClick={() => void submitCommand(prompt, { source: 'overview_chip' })}
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

interface OverviewPageProps {
  onNavigate: (page: PageId) => void
}

export function OverviewPage({ onNavigate }: OverviewPageProps) {
  // Stable primitive selector — alerts array reference only changes on mutations.
  // Calling s.stats() directly as a selector returns a new object every render,
  // which trips useSyncExternalStore's getSnapshot check and causes an infinite loop.
  const alerts = useAlertStore((s) => s.alerts)
  const alertStats = useMemo(() => {
    const r = { total: alerts.length, open: 0, investigating: 0, acknowledged: 0, closed: 0, suppressed: 0, false_positive: 0, escalated: 0, critical: 0, high: 0, medium: 0, low: 0 } as Record<string, number>
    for (const a of alerts) { r[a.status]++; r[a.severity]++ }
    return r
  }, [alerts])

  const activeId = useInvestigationStore((s) => s.activeInvestigationId)
  const investigations = useInvestigationStore((s) => s.investigations)
  const activeCase = investigations.find((i) => i.id === activeId)

  return (
    <div className="space-y-5">
      {/* Workspace lens — Scratch vs active case context */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <WorkspaceModeBadge />
          <span className="text-[11px] text-gray-600">
            {activeCase
              ? `Working in ${activeCase.title} — AI actions default to this case; saves still need explicit approval.`
              : 'Neutral SOC workspace — work stays scratch until you save or link it to a case.'}
          </span>
        </div>
        {activeCase && (
          <button
            onClick={() => onNavigate('investigation-workspace')}
            className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors shrink-0"
          >
            Open case workspace →
          </button>
        )}
      </div>

      {/* Stat cards — derived from alertStore */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Alerts"   value={alertStats.total}    sub="updated just now"        color="text-white" />
        <StatCard label="Critical"       value={alertStats.critical}  sub="require immediate action" color="text-red-400" />
        <StatCard label="Investigations" value={2}                    sub="active this shift"        color="text-orange-400" />
        <StatCard label="Active Hunts"   value={1}                    sub="in progress"              color="text-purple-400" />
      </div>

      {/* Dashboard layout — the stable underlying page. Command results float above it
          in the global command-palette overlay and never replace or push this content. */}
      <div className="grid grid-cols-3 gap-5">

          {/* Left column — widgets */}
          <div className="col-span-1 space-y-4">

            {/* Alert queue */}
            <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Alert Queue</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-gray-600">Mock</span>
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Critical', count: alertStats.critical, color: 'text-red-400',    bar: 'bg-red-500' },
                  { label: 'High',     count: alertStats.high,     color: 'text-orange-400', bar: 'bg-orange-500' },
                  { label: 'Medium',   count: alertStats.medium,   color: 'text-amber-400',  bar: 'bg-amber-500' },
                  { label: 'Low',      count: alertStats.low,      color: 'text-gray-400',   bar: 'bg-gray-600' },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{item.label}</span>
                      <span className={`text-sm font-mono font-semibold ${item.color}`}>{item.count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.bar} opacity-60`}
                        style={{ width: `${Math.round((item.count / alertStats.total) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
                <span className="text-[10px] text-gray-600">{alertStats.total} total · {alertStats.open} open</span>
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

          {/* Right column — welcome / capability guidance */}
          <div className="col-span-2 space-y-4">
            <WelcomeState />
          </div>

        </div>
    </div>
  )
}
