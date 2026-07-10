import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { useSessionStore } from '../stores/sessionStore'
import { useInvestigationStore } from '../stores/investigationStore'
import { useWorkspaceStore } from '../stores/workspaceStore'
import { workspaceIdFor, isScratchWorkspace } from '../utils/workspaceMemory'

const HUNT_TEMPLATES = [
  'Hunt for LAPSUS$ TTPs',
  'Hunt for APT29 TTPs',
  'Hunt for credential dumping',
  'Hunt for lateral movement this week',
]

const FIXTURE_HUNTS = [
  {
    id: 'HNT-001',
    actor: 'LAPSUS$',
    techniques: 12,
    findings: 3,
    confirmed: 1,
    date: '2026-05-10',
    duration: '3m 12s',
    status: 'completed',
    narrative: 'Hunt identified 3 technique matches across identity and endpoint logs. 1 confirmed credential dumping event on DESKTOP-42.',
  },
  {
    id: 'HNT-002',
    actor: 'APT29 (Cozy Bear)',
    techniques: 15,
    findings: 0,
    confirmed: 0,
    date: '2026-05-09',
    duration: '4m 01s',
    status: 'completed',
    narrative: 'No confirmed indicators of APT29 activity in the reviewed time window. Recommended to re-run after ingesting Defender endpoint telemetry.',
  },
]

export function HuntsPage() {
  const { setPendingQuery } = useSessionStore()
  const activeInvestigationId = useInvestigationStore((s) => s.activeInvestigationId)
  const workspaceId = workspaceIdFor(activeInvestigationId)

  // Restore the last selected hunt template / recent hunt from this case's workspace
  // checkpoint. Scratch starts neutral (no template selected, no case-specific hunt).
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(() => {
    if (isScratchWorkspace(workspaceId)) return null
    return useWorkspaceStore.getState().getWorkspace(workspaceId).huntsState?.selectedHuntPrompt ?? null
  })
  const [selectedHuntId, setSelectedHuntId] = useState<string | null>(() => {
    if (isScratchWorkspace(workspaceId)) return null
    const saved = useWorkspaceStore.getState().getWorkspace(workspaceId).huntsState?.selectedHuntId
    return FIXTURE_HUNTS.some((h) => h.id === saved) ? (saved as string) : null
  })

  // Record hunt selection into the workspace checkpoint (never for Scratch — keeps it fresh).
  useEffect(() => {
    if (isScratchWorkspace(workspaceId)) return
    useWorkspaceStore.getState().patchHuntsState(workspaceId, {
      selectedHuntPrompt: selectedPrompt,
      selectedHuntId,
    })
  }, [workspaceId, selectedPrompt, selectedHuntId])

  // Lightweight selection only — a launched hunt is a prompt to the AI bar, not stored result
  // data. Saved hunt outputs become investigation artifacts through the normal action flow.
  function launchHunt(prompt: string, huntId: string | null = null) {
    setSelectedPrompt(prompt)
    setSelectedHuntId(huntId)
    setPendingQuery(prompt)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Hunts</h1>
          <p className="text-xs text-gray-500 mt-0.5">2 completed this week · MITRE ATT&amp;CK aligned</p>
        </div>
        <button
          onClick={() => launchHunt('Hunt for LAPSUS$ TTPs')}
          className="px-3 py-1.5 rounded-lg bg-orange-600/20 border border-orange-500/30 text-orange-300 text-xs font-medium hover:bg-orange-600/30 transition-colors"
        >
          Start Hunt →
        </button>
      </div>

      {/* Quick hunt prompts */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3">AI Hunt Templates</div>
        <div className="flex flex-wrap gap-2">
          {HUNT_TEMPLATES.map((prompt) => (
            <button
              key={prompt}
              onClick={() => launchHunt(prompt)}
              className={clsx(
                'text-xs px-2.5 py-1.5 rounded-lg border transition-colors',
                selectedPrompt === prompt
                  ? 'border-orange-400/60 text-orange-200 bg-orange-500/20 ring-1 ring-orange-400/40'
                  : 'border-orange-500/30 text-orange-300 bg-orange-500/10 hover:bg-orange-500/20',
              )}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Hunt history */}
      <div className="space-y-3">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Recent Hunts</div>
        {FIXTURE_HUNTS.map((hunt) => (
          <div
            key={hunt.id}
            className={clsx(
              'rounded-xl border bg-gray-900/60 p-4 transition-colors',
              selectedHuntId === hunt.id ? 'border-orange-500/40 ring-1 ring-orange-500/25' : 'border-gray-700/50',
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-gray-600">{hunt.id}</span>
                  <span className="text-[10px] text-gray-600">{hunt.date} · {hunt.duration}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border text-emerald-400 bg-emerald-500/10 border-emerald-500/25">
                    {hunt.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white">Threat Actor: {hunt.actor}</h3>
                <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500">
                  <span>{hunt.techniques} techniques queried</span>
                  <span className={hunt.findings > 0 ? 'text-orange-400 font-medium' : 'text-gray-500'}>
                    {hunt.findings} findings
                  </span>
                  <span className={hunt.confirmed > 0 ? 'text-red-400 font-medium' : 'text-gray-500'}>
                    {hunt.confirmed} confirmed
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{hunt.narrative}</p>
              </div>
              <button
                onClick={() => launchHunt(`Hunt for ${hunt.actor} TTPs`, hunt.id)}
                className="text-[10px] px-2 py-1 rounded bg-orange-500/10 border border-orange-500/25 text-orange-300 hover:bg-orange-500/20 transition-colors shrink-0"
              >
                Re-run
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
