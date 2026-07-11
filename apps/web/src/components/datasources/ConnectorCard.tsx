import { clsx } from 'clsx'
import type { ConnectorMetadata, TestConnectionResult } from '../../types/connectors'
import { isMockConnector } from '../../utils/connectors/connectorRegistry'

const PLATFORM_DOT: Record<string, string> = {
  mock: 'bg-blue-500',
  sentinel: 'bg-cyan-500',
  splunk: 'bg-orange-500',
  elastic: 'bg-teal-500',
  defender: 'bg-blue-400',
  crowdstrike: 'bg-red-500',
  okta: 'bg-purple-500',
  generic: 'bg-gray-500',
}

function fmtLastSync(iso: string | null): string {
  if (!iso) return 'never'
  return iso.replace('T', ' ').slice(0, 16) + ' UTC'
}

interface Props {
  meta: ConnectorMetadata
  lastSync: string | null
  test?: TestConnectionResult
  busy?: boolean
  previewBusy?: boolean
  onTest: () => void
  onPreview: () => void
  onSync: () => void
}

export function ConnectorCard({ meta, lastSync, test, busy, previewBusy, onTest, onPreview, onSync }: Props) {
  const mock = isMockConnector(meta.id)
  const connected = meta.status === 'connected'

  return (
    <div className={clsx(
      'rounded-xl border bg-gray-900/60 p-4',
      connected ? 'border-gray-700/50' : 'border-gray-800/50',
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', PLATFORM_DOT[meta.platform] ?? 'bg-gray-500')} />
            <span className="text-sm font-semibold text-white">{meta.name}</span>
            {mock && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border text-blue-300 bg-blue-500/10 border-blue-500/25">Mock</span>
            )}
            <span className="text-[9px] px-1.5 py-0.5 rounded border text-gray-500 border-gray-700/40 font-mono uppercase">{meta.platform}</span>
          </div>
          <p className="text-xs text-gray-500 mb-2">{meta.description}</p>

          {/* Capabilities */}
          <div className="flex flex-wrap items-center gap-1 mb-2">
            {meta.capabilities.map((c) => (
              <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800/60 border border-gray-700/40 text-gray-500 font-mono">{c}</span>
            ))}
          </div>

          <div className="flex items-center gap-4 text-[11px] text-gray-600">
            <span>{meta.recordsAvailable > 0 ? `${meta.recordsAvailable} records` : 'no records'}</span>
            <span>Last sync: {fmtLastSync(lastSync)}</span>
          </div>

          {meta.note && !connected && (
            <p className="text-[10px] text-amber-500/70 mt-1.5">{meta.note}</p>
          )}
          {test && (
            <p className={clsx('text-[10px] mt-1.5', test.ok ? 'text-emerald-400' : 'text-amber-500/80')}>
              {test.ok ? '✓ ' : '⚠ '}{test.message}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right space-y-1.5">
          {connected ? (
            <div className="flex items-center justify-end gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium">Connected</span>
            </div>
          ) : (
            <span className="text-[10px] text-gray-600 border border-gray-700/50 px-1.5 py-0.5 rounded">Not configured</span>
          )}

          <div className="flex flex-col items-end gap-1 pt-1">
            <button
              onClick={onTest}
              className="text-[10px] px-2 py-1 rounded border border-gray-600/40 text-gray-400 hover:bg-gray-700/40 transition-colors"
            >
              Test connection
            </button>
            <button
              onClick={onPreview}
              disabled={!mock || previewBusy}
              title={mock ? 'Preview normalized sample events' : 'Preview disabled — connector not configured'}
              className="text-[10px] px-2 py-1 rounded border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {previewBusy ? 'Loading…' : 'Preview events'}
            </button>
            <button
              onClick={onSync}
              disabled={!mock || busy}
              title={mock ? 'Run a mock ingestion sync' : 'Sync disabled — connector not configured'}
              className="text-[10px] px-2 py-1 rounded border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {busy ? 'Syncing…' : 'Run mock sync'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
