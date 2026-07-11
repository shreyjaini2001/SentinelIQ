import type { SecurityDataConnector, ConnectorMetadata, ConnectorSource, TestConnectionResult } from '../../types/connectors'
import type { NormalizedSecurityEvent } from '../../types/events'
import { ALL_ALERTS } from '../../data/mockSocData'
import { alertToNormalizedEvent } from '../normalization'

/**
 * MockSocConnector — the only fully-implemented connector in v1.3.0.
 *
 * Reads the centralized deterministic mock SOC dataset and produces vendor-neutral
 * NormalizedSecurityEvents. It is the "source of truth" for the Data Sources ingestion
 * preview and demonstrates the connector → normalized event → downstream path without any
 * network I/O or credentials.
 */

// A small, deterministic set of non-alert sample events across categories, tied to the
// jsmith investigation so the abstraction connects to the rest of the demo.
const SAMPLE_EVENTS: NormalizedSecurityEvent[] = [
  {
    id: 'EVT-AUTH-1', timestamp: '2026-05-10T08:23:00Z', sourcePlatform: 'mock',
    sourceProduct: 'Azure AD', sourceType: 'SIEM', sourceTableOrIndex: 'SigninLogs',
    eventCategory: 'authentication', eventName: 'Failed sign-in (impossible travel)', severity: 'high',
    user: 'jsmith@corp.com', ip: '185.220.101.5', country: 'Russia', eventId: '50126',
    ruleName: 'ImpossibleTravelV2', tactic: 'Initial Access', technique: 'T1078',
    linkedAlertIds: ['ALT-001'], linkedInvestigationIds: ['INV-001'],
  },
  {
    id: 'EVT-PROC-1', timestamp: '2026-05-10T06:12:00Z', sourcePlatform: 'mock',
    sourceProduct: 'Microsoft Defender', sourceType: 'EDR', sourceTableOrIndex: 'DeviceProcessEvents',
    eventCategory: 'process', eventName: 'Encoded PowerShell execution', severity: 'high',
    user: 'jsmith', host: 'DESKTOP-42', process: 'powershell.exe',
    commandLine: '-EncodedCommand aQBmACAoAC...', tactic: 'Execution', technique: 'T1059.001',
    linkedInvestigationIds: ['INV-001'],
  },
  {
    id: 'EVT-NET-1', timestamp: '2026-05-10T06:58:00Z', sourcePlatform: 'mock',
    sourceProduct: 'Microsoft Defender', sourceType: 'EDR', sourceTableOrIndex: 'DeviceNetworkEvents',
    eventCategory: 'network', eventName: 'Outbound connection to suspicious IP', severity: 'high',
    host: 'SERVER-DC01', ip: '185.220.101.5', tactic: 'Command and Control', technique: 'T1071.001',
    linkedInvestigationIds: ['INV-001'],
  },
  {
    id: 'EVT-ID-1', timestamp: '2026-05-10T00:00:00Z', sourcePlatform: 'mock',
    sourceProduct: 'Azure AD', sourceType: 'IdP', sourceTableOrIndex: 'IdentityInfo',
    eventCategory: 'identity', eventName: 'Identity inventory record', severity: 'informational',
    user: 'jsmith@corp.com',
  },
  {
    id: 'EVT-NET-2', timestamp: '2026-05-10T04:30:00Z', sourcePlatform: 'mock',
    sourceProduct: 'Microsoft Defender', sourceType: 'EDR', sourceTableOrIndex: 'DeviceNetworkEvents',
    eventCategory: 'network', eventName: 'C2 beacon (non-standard port)', severity: 'medium',
    host: 'DESKTOP-42', ip: '203.0.113.42', tactic: 'Command and Control', technique: 'T1571',
  },
  {
    id: 'EVT-CLOUD-1', timestamp: '2026-05-10T04:15:00Z', sourcePlatform: 'mock',
    sourceProduct: 'Azure AD', sourceType: 'SIEM', sourceTableOrIndex: 'AuditLogs',
    eventCategory: 'cloud', eventName: 'OAuth app consent granted', severity: 'medium',
    user: 'apps-team@corp.com', tactic: 'Persistence', technique: 'T1098.001',
  },
]

const SOURCES: ConnectorSource[] = [
  { name: 'SigninLogs', kind: 'table', category: 'authentication' },
  { name: 'AuditLogs', kind: 'table', category: 'cloud' },
  { name: 'DeviceProcessEvents', kind: 'table', category: 'process' },
  { name: 'DeviceNetworkEvents', kind: 'table', category: 'network' },
  { name: 'IdentityInfo', kind: 'table', category: 'identity' },
  { name: 'SecurityEvent', kind: 'table', category: 'authentication' },
]

export function mockConnectorMetadata(): ConnectorMetadata {
  return {
    id: 'mock-soc',
    name: 'Mock SOC Dataset',
    platform: 'mock',
    description: 'Deterministic in-app SOC dataset (Microsoft Sentinel-style). Source of truth for the demo.',
    status: 'connected',
    mode: 'mock',
    capabilities: ['authentication', 'process', 'network', 'identity', 'alerts', 'query'],
    recordsAvailable: ALL_ALERTS.length + SAMPLE_EVENTS.length,
    lastSync: null,
  }
}

export const mockSocConnector: SecurityDataConnector = {
  meta: mockConnectorMetadata(),

  listSources: () => SOURCES,

  testConnection: (): TestConnectionResult => ({
    ok: true,
    status: 'connected',
    message: `Mock connector reachable — ${ALL_ALERTS.length} alerts + ${SAMPLE_EVENTS.length} sample events available.`,
  }),

  fetchSampleEvents: (limit = 12) => {
    // Mix of category sample events + a few alert-derived events, deterministic order.
    const alertEvents = ALL_ALERTS.slice(0, Math.max(0, limit - SAMPLE_EVENTS.length)).map(alertToNormalizedEvent)
    return [...SAMPLE_EVENTS, ...alertEvents].slice(0, limit)
  },

  fetchAlerts: () => ALL_ALERTS.map(alertToNormalizedEvent),

  runQuery: (renderedQuery: string) => {
    const q = renderedQuery.toLowerCase()
    return mockSocConnector.fetchSampleEvents(24).filter((e) =>
      q.includes(e.sourceTableOrIndex.toLowerCase()) || e.eventCategory.includes(q) || true,
    )
  },

  normalize: (raw: Record<string, unknown>): NormalizedSecurityEvent => ({
    id: String(raw.id ?? `EVT-${Date.now()}`),
    timestamp: String(raw.timestamp ?? new Date().toISOString()),
    sourcePlatform: 'mock',
    sourceProduct: String(raw.sourceProduct ?? 'Mock'),
    sourceType: String(raw.sourceType ?? 'SIEM'),
    sourceTableOrIndex: String(raw.sourceTableOrIndex ?? raw.table ?? 'Unknown'),
    eventCategory: 'alert',
    eventName: String(raw.eventName ?? raw.name ?? 'Event'),
    user: raw.user ? String(raw.user) : undefined,
    host: raw.host ? String(raw.host) : undefined,
    ip: raw.ip ? String(raw.ip) : undefined,
    raw,
  }),

  getLastSync: () => null,
}
