import { PersistenceStatusCard } from '../components/settings/PersistenceStatusCard'
import { APP_VERSION } from '../utils/appVersion'

const PROVIDERS = [
  {
    id: 'mock',
    name: 'Mock Provider',
    description: 'Deterministic responses using templates and fixture data. No API calls or billing.',
    status: 'active',
    badge: 'Active',
    badgeStyle: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    description: 'claude-sonnet-4-6 or claude-opus-4-7. Requires ANTHROPIC_API_KEY environment variable.',
    status: 'not_configured',
    badge: 'Not Configured',
    badgeStyle: 'text-gray-500 bg-gray-500/10 border-gray-500/25',
  },
  {
    id: 'azure',
    name: 'Azure OpenAI',
    description: 'GPT-4o or o4-mini via Azure. Requires Azure endpoint, deployment, and API key.',
    status: 'not_configured',
    badge: 'Not Configured',
    badgeStyle: 'text-gray-500 bg-gray-500/10 border-gray-500/25',
  },
  {
    id: 'local',
    name: 'Local LLM',
    description: 'Ollama or LM Studio endpoint for fully air-gapped deployments.',
    status: 'coming_soon',
    badge: 'v1.1',
    badgeStyle: 'text-gray-600 bg-gray-700/20 border-gray-700/40',
  },
]

export function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-white">Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">Model provider, privacy, and integrations</p>
      </div>

      {/* Model Provider */}
      <section className="space-y-3">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">AI Model Provider</div>
        <div className="space-y-2">
          {PROVIDERS.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{p.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${p.badgeStyle}`}>{p.badge}</span>
                </div>
                <p className="text-xs text-gray-500">{p.description}</p>
              </div>
              {p.status === 'active' && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-400">In use</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-600">
          To switch providers, set the <code className="font-mono text-gray-500">LLM_PROVIDER</code> environment variable
          in <code className="font-mono text-gray-500">apps/api/.env</code> and restart the API server.
        </p>
      </section>

      {/* Local persistence status + reset demo data */}
      <PersistenceStatusCard />

      {/* Privacy */}
      <section className="space-y-3">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Privacy &amp; Data</div>
        <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4 space-y-3">
          {[
            { label: 'PII Scrubbing',        value: 'Enabled',   note: 'Emails, IPs, and UPNs are scrubbed before reaching the LLM.' },
            { label: 'External Model Calls', value: 'Disabled',  note: 'Mock mode — no data leaves this machine.' },
            { label: 'Training Opt-Out',     value: 'N/A',       note: 'Not applicable in mock mode.' },
            { label: 'Audit Logging',        value: 'In-memory', note: 'Session logs are held in memory only. Not persisted.' },
          ].map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-4 py-1">
              <div>
                <div className="text-xs font-medium text-gray-300">{row.label}</div>
                <div className="text-[10px] text-gray-600 mt-0.5">{row.note}</div>
              </div>
              <span className="text-xs text-emerald-400 font-mono shrink-0">{row.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Version */}
      <section className="space-y-3">
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Version Info</div>
        <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">
          <div className="space-y-1.5 text-xs">
            {[
              { label: 'SentinelIQ',    value: `${APP_VERSION} — Local Persistence` },
              { label: 'API',           value: 'FastAPI / Python 3.12' },
              { label: 'Frontend',      value: 'React 18 + Vite + Tailwind' },
              { label: 'Persistence',   value: 'Local SQLite (demo)' },
              { label: 'Capabilities',  value: '10 AI capabilities · 150 tests passing' },
              { label: 'Mode',          value: 'Mock (fixture data)' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-gray-500">{row.label}</span>
                <span className="text-gray-300 font-mono">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
