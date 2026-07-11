import type {
  SecurityDataConnector,
  ConnectorMetadata,
  TestConnectionResult,
} from '../../types/connectors'
import type { SourcePlatform } from '../../types/events'
import { mockSocConnector, mockConnectorMetadata } from './mockSocConnector'

/**
 * Connector registry (v1.3.0).
 *
 * The mock connector is fully implemented; every real platform is a safe **placeholder** that
 * reports `not_configured`, refuses to sync, and never touches a network or credentials.
 * This is the boundary a future phase fills in (SentinelConnector, SplunkConnector, …).
 */

interface PlaceholderSpec {
  id: string
  name: string
  platform: SourcePlatform
  description: string
}

const PLACEHOLDERS: PlaceholderSpec[] = [
  { id: 'sentinel', name: 'Microsoft Sentinel', platform: 'sentinel', description: 'Azure Log Analytics workspace via the Sentinel API.' },
  { id: 'splunk', name: 'Splunk Enterprise', platform: 'splunk', description: 'Splunk Enterprise / Cloud via the REST API.' },
  { id: 'elastic', name: 'Elastic Security', platform: 'elastic', description: 'Elasticsearch / Kibana SIEM via API key.' },
  { id: 'defender', name: 'Microsoft Defender XDR', platform: 'defender', description: 'Endpoint + identity telemetry via the Defender API.' },
  { id: 'crowdstrike', name: 'CrowdStrike Falcon', platform: 'crowdstrike', description: 'Endpoint detections + incidents via the Falcon API.' },
  { id: 'okta', name: 'Okta', platform: 'okta', description: 'Identity + authentication events via the Okta System Log API.' },
]

function placeholderMetadata(spec: PlaceholderSpec): ConnectorMetadata {
  return {
    id: spec.id,
    name: spec.name,
    platform: spec.platform,
    description: spec.description,
    status: 'not_configured',
    mode: 'real_placeholder',
    capabilities: ['alerts', 'query'],
    recordsAvailable: 0,
    lastSync: null,
    note: 'Planned — real credentials and API integration are future work. No data is fetched.',
  }
}

/** A safe, inert connector for a not-yet-configured real platform. */
function makePlaceholderConnector(spec: PlaceholderSpec): SecurityDataConnector {
  const meta = placeholderMetadata(spec)
  const notConfigured: TestConnectionResult = {
    ok: false,
    status: 'not_configured',
    message: `${spec.name} is not configured. Real credentials and API integration are future work — no connection was attempted.`,
  }
  return {
    meta,
    listSources: () => [],
    testConnection: () => notConfigured,
    fetchSampleEvents: () => [],
    fetchAlerts: () => [],
    runQuery: () => [],
    normalize: (raw) => ({
      id: String(raw.id ?? 'EVT-none'),
      timestamp: new Date().toISOString(),
      sourcePlatform: spec.platform,
      sourceProduct: spec.name,
      sourceType: 'placeholder',
      sourceTableOrIndex: 'n/a',
      eventCategory: 'alert',
      eventName: 'placeholder',
      raw,
    }),
    getLastSync: () => null,
  }
}

const REGISTRY: Record<string, SecurityDataConnector> = {
  'mock-soc': mockSocConnector,
  ...Object.fromEntries(PLACEHOLDERS.map((p) => [p.id, makePlaceholderConnector(p)])),
}

/** All connector metadata, mock first. Deterministic order. */
export function listConnectorMetadata(): ConnectorMetadata[] {
  return [mockConnectorMetadata(), ...PLACEHOLDERS.map(placeholderMetadata)]
}

export function getConnector(id: string): SecurityDataConnector | undefined {
  return REGISTRY[id]
}

export function isMockConnector(id: string): boolean {
  return id === 'mock-soc'
}
