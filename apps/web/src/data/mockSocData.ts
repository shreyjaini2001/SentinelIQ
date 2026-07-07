import type { MockAlert, AlertSeverity, AlertStatus, AlertEntityType } from '../types/alerts'

// Fixed deterministic timestamps anchored to MOCK_NOW = '2026-05-10T08:45:00Z'
// Alerts spread over the 72h window before MOCK_NOW
function tsAt(hoursAgo: number, minutesAgo = 0): string {
  const base = new Date('2026-05-10T08:45:00Z')
  base.setMinutes(base.getMinutes() - hoursAgo * 60 - minutesAgo)
  return base.toISOString()
}

// ──────────────────────────────────────────────────────────
// Anchor alerts ALT-001 – ALT-012
// These match the existing AlertsPage + investigationStore data
// ──────────────────────────────────────────────────────────
const ANCHOR_ALERTS: MockAlert[] = [
  {
    id: 'ALT-001',
    name: 'Impossible Travel Detected',
    severity: 'critical',
    status: 'open',
    entity: 'jsmith@corp.com',
    entityType: 'user',
    detectionRule: 'ImpossibleTravelV2',
    sourceProduct: 'Azure AD',
    sourceTable: 'SigninLogs',
    createdAt: tsAt(0, 22),
    updatedAt: tsAt(0, 22),
    riskScore: 95,
    confidence: 91,
    tactics: ['Initial Access'],
    techniques: ['T1078'],
    relatedEntities: ['DESKTOP-A7B', '185.220.101.47'],
    linkedInvestigationId: 'INV-001',
  },
  {
    id: 'ALT-002',
    name: 'Privileged Group Modification',
    severity: 'high',
    status: 'open',
    entity: 'admin-svc',
    entityType: 'service_account',
    detectionRule: 'PrivilegedGroupChange',
    sourceProduct: 'Microsoft Defender',
    sourceTable: 'SecurityEvent',
    createdAt: tsAt(0, 30),
    updatedAt: tsAt(0, 30),
    riskScore: 82,
    confidence: 88,
    tactics: ['Privilege Escalation'],
    techniques: ['T1078.002'],
    relatedEntities: ['SERVER-DC01', 'jsmith@corp.com'],
    linkedInvestigationId: 'INV-001',
  },
  {
    id: 'ALT-003',
    name: 'GeoAnomaly: New Country Login',
    severity: 'high',
    status: 'open',
    entity: 'mwatson@corp.com',
    entityType: 'user',
    detectionRule: 'GeoAnomalyLogin',
    sourceProduct: 'Azure AD',
    sourceTable: 'SigninLogs',
    createdAt: tsAt(0, 47),
    updatedAt: tsAt(0, 47),
    riskScore: 78,
    confidence: 84,
    tactics: ['Initial Access'],
    techniques: ['T1078'],
    relatedEntities: ['195.3.144.10'],
    linkedInvestigationId: 'INV-001',
  },
  {
    id: 'ALT-004',
    name: 'Large Outbound Data Transfer',
    severity: 'high',
    status: 'investigating',
    entity: 'DESKTOP-A7B',
    entityType: 'host',
    detectionRule: 'OutboundDataExfil',
    sourceProduct: 'Microsoft Defender',
    sourceTable: 'DeviceNetworkEvents',
    createdAt: tsAt(1, 13),
    updatedAt: tsAt(0, 15),
    riskScore: 76,
    confidence: 79,
    tactics: ['Exfiltration'],
    techniques: ['T1041'],
    relatedEntities: ['185.220.101.47', 'jsmith@corp.com'],
    linkedInvestigationId: 'INV-001',
  },
  {
    id: 'ALT-005',
    name: 'Lateral Movement via SMB',
    severity: 'high',
    status: 'open',
    entity: 'SERVER-DC01',
    entityType: 'host',
    detectionRule: 'LateralMovementSMB',
    sourceProduct: 'Microsoft Defender',
    sourceTable: 'SecurityEvent',
    createdAt: tsAt(2, 0),
    updatedAt: tsAt(2, 0),
    riskScore: 84,
    confidence: 87,
    tactics: ['Lateral Movement'],
    techniques: ['T1021.002'],
    relatedEntities: ['DESKTOP-A7B', 'WORKSTATION-07'],
    linkedInvestigationId: 'INV-002',
  },
  {
    id: 'ALT-006',
    name: 'Encoded PowerShell Execution',
    severity: 'medium',
    status: 'open',
    entity: 'DESKTOP-42',
    entityType: 'host',
    detectionRule: 'EncodedPowerShellCmd',
    sourceProduct: 'Microsoft Defender',
    sourceTable: 'DeviceProcessEvents',
    createdAt: tsAt(2, 33),
    updatedAt: tsAt(2, 33),
    riskScore: 68,
    confidence: 82,
    tactics: ['Execution'],
    techniques: ['T1059.001'],
    relatedEntities: ['tbrown@corp.com'],
    linkedInvestigationId: 'INV-002',
  },
  {
    id: 'ALT-007',
    name: 'Multiple Failed MFA Attempts',
    severity: 'medium',
    status: 'open',
    entity: 'tbrown@corp.com',
    entityType: 'user',
    detectionRule: 'MFASprayDetection',
    sourceProduct: 'Azure AD',
    sourceTable: 'SigninLogs',
    createdAt: tsAt(2, 50),
    updatedAt: tsAt(2, 50),
    riskScore: 54,
    confidence: 71,
    tactics: ['Credential Access'],
    techniques: ['T1110.003'],
    relatedEntities: ['DESKTOP-42'],
    linkedInvestigationId: 'INV-002',
  },
  {
    id: 'ALT-008',
    name: 'New Service Account Created',
    severity: 'medium',
    status: 'acknowledged',
    entity: 'svc-backup-new',
    entityType: 'service_account',
    detectionRule: 'NewPrivServiceAccount',
    sourceProduct: 'Microsoft Defender',
    sourceTable: 'SecurityEvent',
    createdAt: tsAt(3, 15),
    updatedAt: tsAt(1, 0),
    riskScore: 47,
    confidence: 68,
    tactics: ['Persistence'],
    techniques: ['T1136.001'],
    relatedEntities: ['SERVER-DC01'],
    linkedInvestigationId: 'INV-002',
  },
  {
    id: 'ALT-009',
    name: 'OAuth App Consent Granted',
    severity: 'medium',
    status: 'open',
    entity: 'apps-team@corp.com',
    entityType: 'user',
    detectionRule: 'OAuthConsentGrant',
    sourceProduct: 'Azure AD',
    sourceTable: 'AuditLogs',
    createdAt: tsAt(4, 30),
    updatedAt: tsAt(4, 30),
    riskScore: 41,
    confidence: 60,
    tactics: ['Persistence'],
    techniques: ['T1098.001'],
    relatedEntities: [],
    linkedInvestigationId: 'INV-002',
  },
  {
    id: 'ALT-010',
    name: 'Suspicious Sign-In Activity',
    severity: 'low',
    status: 'open',
    entity: 'guest_user_1',
    entityType: 'user',
    detectionRule: 'SuspiciousSignIn',
    sourceProduct: 'Azure AD',
    sourceTable: 'SigninLogs',
    createdAt: tsAt(5, 0),
    updatedAt: tsAt(5, 0),
    riskScore: 28,
    confidence: 55,
    tactics: ['Initial Access'],
    techniques: ['T1078'],
    relatedEntities: [],
    linkedInvestigationId: 'INV-002',
  },
  {
    id: 'ALT-011',
    name: 'Failed Password Reset Attempt',
    severity: 'low',
    status: 'acknowledged',
    entity: 'jdoe@corp.com',
    entityType: 'user',
    detectionRule: 'PasswordResetAnomaly',
    sourceProduct: 'Azure AD',
    sourceTable: 'AuditLogs',
    createdAt: tsAt(5, 23),
    updatedAt: tsAt(3, 0),
    riskScore: 18,
    confidence: 72,
    tactics: ['Credential Access'],
    techniques: ['T1110'],
    relatedEntities: [],
    linkedInvestigationId: 'INV-002',
  },
  {
    id: 'ALT-012',
    name: 'Non-Standard Port Communication',
    severity: 'low',
    status: 'open',
    entity: 'WORKSTATION-07',
    entityType: 'host',
    detectionRule: 'NonStandardPortComm',
    sourceProduct: 'Microsoft Defender',
    sourceTable: 'DeviceNetworkEvents',
    createdAt: tsAt(5, 47),
    updatedAt: tsAt(5, 47),
    riskScore: 22,
    confidence: 60,
    tactics: ['Command and Control'],
    techniques: ['T1571'],
    relatedEntities: ['91.108.4.200'],
  },
]

// ──────────────────────────────────────────────────────────
// Synthetic alert generation — ALT-013 to ALT-190
// 10 rule templates × cycling entities → 178 alerts
// ──────────────────────────────────────────────────────────

const RULE_TEMPLATES: Array<{
  name: string
  severity: AlertSeverity
  detectionRule: string
  sourceProduct: string
  sourceTable: string
  tactics: string[]
  techniques: string[]
  entityType: AlertEntityType
  riskBase: number
  confidenceBase: number
}> = [
  {
    name: 'Credential Dump Attempt',
    severity: 'critical',
    detectionRule: 'CredentialDumpLsass',
    sourceProduct: 'Microsoft Defender',
    sourceTable: 'DeviceEvents',
    tactics: ['Credential Access'],
    techniques: ['T1003.001'],
    entityType: 'host',
    riskBase: 88,
    confidenceBase: 85,
  },
  {
    name: 'Outbound C2 Beacon',
    severity: 'high',
    detectionRule: 'C2BeaconOutbound',
    sourceProduct: 'Microsoft Defender',
    sourceTable: 'DeviceNetworkEvents',
    tactics: ['Command and Control'],
    techniques: ['T1071.001'],
    entityType: 'host',
    riskBase: 82,
    confidenceBase: 78,
  },
  {
    name: 'Lateral Movement via SMB',
    severity: 'high',
    detectionRule: 'LateralMovementSMB',
    sourceProduct: 'Microsoft Defender',
    sourceTable: 'SecurityEvent',
    tactics: ['Lateral Movement'],
    techniques: ['T1021.002'],
    entityType: 'host',
    riskBase: 79,
    confidenceBase: 81,
  },
  {
    name: 'Privilege Escalation via Token',
    severity: 'high',
    detectionRule: 'PrivEscTokenManipulation',
    sourceProduct: 'Microsoft Defender',
    sourceTable: 'SecurityEvent',
    tactics: ['Privilege Escalation'],
    techniques: ['T1134'],
    entityType: 'host',
    riskBase: 75,
    confidenceBase: 80,
  },
  {
    name: 'Encoded PowerShell Execution',
    severity: 'medium',
    detectionRule: 'EncodedPowerShellCmd',
    sourceProduct: 'Microsoft Defender',
    sourceTable: 'DeviceProcessEvents',
    tactics: ['Execution'],
    techniques: ['T1059.001'],
    entityType: 'host',
    riskBase: 62,
    confidenceBase: 77,
  },
  {
    name: 'Multiple Failed MFA Attempts',
    severity: 'medium',
    detectionRule: 'MFASprayDetection',
    sourceProduct: 'Azure AD',
    sourceTable: 'SigninLogs',
    tactics: ['Credential Access'],
    techniques: ['T1110.003'],
    entityType: 'user',
    riskBase: 50,
    confidenceBase: 68,
  },
  {
    name: 'OAuth App Consent Granted',
    severity: 'medium',
    detectionRule: 'OAuthConsentGrant',
    sourceProduct: 'Azure AD',
    sourceTable: 'AuditLogs',
    tactics: ['Persistence'],
    techniques: ['T1098.001'],
    entityType: 'user',
    riskBase: 42,
    confidenceBase: 62,
  },
  {
    name: 'GeoAnomaly: New Country Login',
    severity: 'medium',
    detectionRule: 'GeoAnomalyLogin',
    sourceProduct: 'Azure AD',
    sourceTable: 'SigninLogs',
    tactics: ['Initial Access'],
    techniques: ['T1078'],
    entityType: 'user',
    riskBase: 58,
    confidenceBase: 74,
  },
  {
    name: 'Suspicious Sign-In Activity',
    severity: 'low',
    detectionRule: 'SuspiciousSignIn',
    sourceProduct: 'Azure AD',
    sourceTable: 'SigninLogs',
    tactics: ['Initial Access'],
    techniques: ['T1078'],
    entityType: 'user',
    riskBase: 25,
    confidenceBase: 55,
  },
  {
    name: 'Non-Standard Port Communication',
    severity: 'low',
    detectionRule: 'NonStandardPortComm',
    sourceProduct: 'Microsoft Defender',
    sourceTable: 'DeviceNetworkEvents',
    tactics: ['Command and Control'],
    techniques: ['T1571'],
    entityType: 'host',
    riskBase: 20,
    confidenceBase: 58,
  },
]

const USER_ENTITIES = [
  'rlee@corp.com',
  'kpatel@corp.com',
  'smorgan@corp.com',
  'aprice@corp.com',
  'dchang@corp.com',
  'lflores@corp.com',
  'nharris@corp.com',
  'cmartin@corp.com',
]

const HOST_ENTITIES = [
  'DESKTOP-B3C',
  'DESKTOP-F9X',
  'SERVER-APP01',
  'SERVER-SQL02',
  'WORKSTATION-12',
  'WORKSTATION-19',
  'LAPTOP-CFO01',
  'LAPTOP-DEV05',
]

const STATUS_CYCLE: AlertStatus[] = [
  'open', 'open', 'open', 'open',
  'investigating',
  'open', 'open', 'open', 'open',
  'acknowledged',
  'open', 'open', 'open', 'open',
  'open', 'open', 'open', 'open',
  'false_positive',
  'closed',
]

function syntheticAlerts(): MockAlert[] {
  const alerts: MockAlert[] = []
  let idx = 0

  for (let i = 0; i < 178; i++) {
    const tpl = RULE_TEMPLATES[i % RULE_TEMPLATES.length]
    const alertNum = i + 13
    const id = `ALT-${String(alertNum).padStart(3, '0')}`

    // Entity: user templates use USER_ENTITIES, host templates use HOST_ENTITIES
    const entityPool = tpl.entityType === 'user' ? USER_ENTITIES : HOST_ENTITIES
    const entity = entityPool[idx % entityPool.length]

    const status = STATUS_CYCLE[i % STATUS_CYCLE.length]

    // Timestamps: spread over 72h, newest first
    const hoursAgo = 6 + (i * 72) / 178
    const createdAt = tsAt(hoursAgo)
    const updatedAt = status === 'open' ? createdAt : tsAt(Math.max(0, hoursAgo - 1))

    // Risk/confidence: base + index variance to avoid identical scores
    const variance = (i % 7) - 3
    const riskScore = Math.min(100, Math.max(5, tpl.riskBase + variance))
    const confidence = Math.min(99, Math.max(40, tpl.confidenceBase + (i % 5) - 2))

    alerts.push({
      id,
      name: tpl.name,
      severity: tpl.severity,
      status,
      entity,
      entityType: tpl.entityType,
      detectionRule: tpl.detectionRule,
      sourceProduct: tpl.sourceProduct,
      sourceTable: tpl.sourceTable,
      createdAt,
      updatedAt,
      riskScore,
      confidence,
      tactics: tpl.tactics,
      techniques: tpl.techniques,
      relatedEntities: [],
    })

    if ((i + 1) % entityPool.length === 0) idx++
  }

  return alerts
}

// Full 190-alert dataset, sorted by createdAt descending (newest first)
export const ALL_ALERTS: MockAlert[] = [...ANCHOR_ALERTS, ...syntheticAlerts()].sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
)

// Quick lookup by ID
export const ALERT_BY_ID: ReadonlyMap<string, MockAlert> = new Map(
  ALL_ALERTS.map((a) => [a.id, a]),
)
