import { useEffect, useState } from 'react'
import { listConnectorMetadata } from '../utils/connectors/connectorRegistry'
import { useConnectorStore } from '../stores/connectorStore'
import { ConnectorCard } from '../components/datasources/ConnectorCard'
import { IngestionRunList } from '../components/datasources/IngestionRunList'
import { NormalizedEventPreview } from '../components/datasources/NormalizedEventPreview'

const MOCK_TABLES = [
  'SigninLogs', 'AuditLogs', 'SecurityEvent', 'DeviceEvents',
  'IdentityLogonEvents', 'DeviceNetworkEvents', 'DeviceProcessEvents',
  'FileEvents', 'AlertInfo', 'AlertEvidence', 'CloudAppEvents',
  'ThreatIntelligenceIndicator', 'EmailEvents', 'AADRiskyUsers',
  'OfficeActivity', 'IdentityInfo',
]

export function DataSourcesPage() {
  const connectors = listConnectorMetadata()
  const {
    ingestionRuns, lastTest, lastSync, previewConnectorId, previewEvents, previewLoading, previewError,
    hydrate, testConnection, preview, clearPreview, runSync,
  } = useConnectorStore()
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => { void hydrate() }, [hydrate])

  const connectedCount = connectors.filter((c) => c.status === 'connected').length

  async function handleSync(id: string) {
    setSyncing(id)
    try { await runSync(id) } finally { setSyncing(null) }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-white">Data Sources</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {connectedCount} connected · {connectors.length - connectedCount} planned · Connector &amp; normalized-ingestion foundation (mock)
        </p>
      </div>

      {/* Explainer */}
      <div className="rounded-xl border border-gray-700/40 bg-gray-900/40 px-4 py-3">
        <p className="text-[11px] text-gray-400 leading-relaxed">
          <span className="text-gray-300 font-medium">Ingestion path:</span> connector source → raw security records →
          normalized event model → alerts / query results / evidence → investigation memory. Only the mock connector
          is active; real SIEM/EDR connectors are safe placeholders (no credentials, no network calls).
        </p>
      </div>

      {/* Connectors — each card renders its own preview INLINE directly beneath it, so the
          normalized event table is visible without scrolling past the other connector cards. */}
      <div className="space-y-3">
        {connectors.map((meta) => {
          const isActive = previewConnectorId === meta.id
          return (
            <div key={meta.id} className="space-y-2">
              <ConnectorCard
                meta={meta}
                lastSync={lastSync[meta.id] ?? meta.lastSync}
                test={lastTest[meta.id]}
                busy={syncing === meta.id}
                previewBusy={previewLoading && isActive}
                onTest={() => testConnection(meta.id)}
                onPreview={() => void preview(meta.id)}
                onSync={() => handleSync(meta.id)}
              />

              {/* Inline preview for the selected connector: loading / error / results */}
              {isActive && (
                previewLoading ? (
                  <div className="ml-3 rounded-xl border border-blue-500/25 bg-blue-500/5 px-4 py-4 flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-blue-400/60 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-gray-300">Loading sample events for {meta.name}…</span>
                  </div>
                ) : previewError ? (
                  <div className="ml-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-4 flex items-center justify-between gap-3">
                    <span className="text-xs text-amber-400">⚠ {previewError}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => void preview(meta.id)}
                        className="text-[10px] px-2 py-1 rounded border border-gray-600/40 text-gray-300 hover:bg-gray-700/40 transition-colors"
                      >
                        Retry
                      </button>
                      <button onClick={clearPreview} className="text-[10px] px-2 py-1 rounded border border-gray-700/40 text-gray-500 hover:bg-gray-800/60 transition-colors">
                        Dismiss
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="ml-3">
                    <NormalizedEventPreview
                      events={previewEvents}
                      connectorName={meta.name}
                      onClose={clearPreview}
                    />
                  </div>
                )
              )}
            </div>
          )
        })}
      </div>

      {/* Ingestion runs */}
      <IngestionRunList runs={ingestionRuns} />

      {/* Available mock tables */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Available Sources (Mock SOC Dataset)</h3>
          <span className="text-[10px] text-gray-600">{MOCK_TABLES.length} tables</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MOCK_TABLES.map((table) => (
            <span key={table} className="text-[10px] font-mono px-2 py-1 rounded bg-gray-800/60 border border-gray-700/40 text-gray-400">
              {table}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
