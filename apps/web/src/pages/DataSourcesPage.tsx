const CONNECTORS = [
  {
    id: 'SRC-001',
    name: 'Microsoft Sentinel',
    type: 'sentinel',
    description: 'Azure Log Analytics workspace — all tables available in mock mode',
    tables: 24,
    eventsPerDay: '~2.4M',
    status: 'connected',
    lastSync: 'just now',
    mode: 'mock',
  },
  {
    id: 'SRC-002',
    name: 'Splunk Enterprise',
    type: 'splunk',
    description: 'Splunk Enterprise or Splunk Cloud connector via REST API',
    tables: 0,
    eventsPerDay: '—',
    status: 'not_configured',
    lastSync: 'never',
    mode: null,
  },
  {
    id: 'SRC-003',
    name: 'Elastic Security',
    type: 'elastic',
    description: 'Elasticsearch / Kibana SIEM connector via API key',
    tables: 0,
    eventsPerDay: '—',
    status: 'not_configured',
    lastSync: 'never',
    mode: null,
  },
  {
    id: 'SRC-004',
    name: 'CrowdStrike Falcon',
    type: 'crowdstrike',
    description: 'Endpoint telemetry, detections, and incidents from Falcon platform',
    tables: 0,
    eventsPerDay: '—',
    status: 'not_configured',
    lastSync: 'never',
    mode: null,
  },
]

const MOCK_TABLES = [
  'SigninLogs', 'AuditLogs', 'SecurityEvent', 'DeviceEvents',
  'IdentityLogonEvents', 'NetworkCommunicationEvents', 'ProcessEvents',
  'FileEvents', 'AlertInfo', 'AlertEvidence', 'CloudAppEvents',
  'ThreatIntelligenceIndicator', 'EmailEvents', 'AADRiskyUsers',
  'OfficeActivity', 'Heartbeat', 'Update', 'CommonSecurityLog',
  'Syslog', 'WindowsFirewall', 'AzureActivity', 'AzureMetrics',
  'BehaviorAnalytics', 'IdentityInfo',
]

export function DataSourcesPage() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-white">Data Sources</h1>
        <p className="text-xs text-gray-500 mt-0.5">1 connected · 3 not configured · Mock connector active</p>
      </div>

      {/* Connectors */}
      <div className="space-y-3">
        {CONNECTORS.map((conn) => (
          <div key={conn.id} className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white">{conn.name}</span>
                  {conn.mode === 'mock' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded border text-blue-300 bg-blue-500/10 border-blue-500/25">
                      Mock
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2">{conn.description}</p>
                <div className="flex items-center gap-4 text-[11px] text-gray-600">
                  {conn.tables > 0 && <span>{conn.tables} tables</span>}
                  {conn.eventsPerDay !== '—' && <span>{conn.eventsPerDay} events/day</span>}
                  <span>Last sync: {conn.lastSync}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                {conn.status === 'connected' ? (
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-400 font-medium">Connected</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-600 border border-gray-700/50 px-1.5 py-0.5 rounded">
                    Not configured
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Available tables */}
      <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Available Tables (Mock)</h3>
          <span className="text-[10px] text-gray-600">{MOCK_TABLES.length} tables</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MOCK_TABLES.map((table) => (
            <span
              key={table}
              className="text-[10px] font-mono px-2 py-1 rounded bg-gray-800/60 border border-gray-700/40 text-gray-400"
            >
              {table}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
