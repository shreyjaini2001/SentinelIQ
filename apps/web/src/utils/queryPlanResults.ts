import type { QueryPlan, RenderedQuery } from '../types/queryPlan'
import type { MockQueryResult, ExtractedEntity } from './mockResults'
import {
  ALL_SIGNIN_ROWS,
  ALL_PROCESS_ROWS,
  ALL_NETWORK_ROWS,
  ALL_SECURITYEVENT_ROWS,
  signinEntities,
  processEntities,
  networkEntities,
  securityEventEntities,
  matchesFilter,
} from './mockResults'

function planEnt(plan: QueryPlan, type: 'user' | 'host' | 'ip' | 'process'): string | null {
  return plan.entities.find((e) => e.type === type)?.value ?? null
}

function withMeta(result: MockQueryResult, plan: QueryPlan, rendered: RenderedQuery): MockQueryResult {
  return {
    ...result,
    sourcePlatform: rendered.platform,
    queryLanguage: rendered.language,
    renderedQuery: rendered.query,
    queryPlan: plan,
  }
}

export function generateResultsFromPlan(plan: QueryPlan, rendered: RenderedQuery): MockQueryResult {
  switch (plan.intent) {

    case 'identity_inventory':
      return withMeta(identityInventoryResult(), plan, rendered)

    case 'observed_users':
      return withMeta(observedUsersResult(), plan, rendered)

    case 'host_inventory':
      return withMeta(hostInventoryResult(), plan, rendered)

    case 'ip_inventory':
      return withMeta(ipInventoryResult(), plan, rendered)

    case 'process_inventory':
      return withMeta(processInventoryResult(), plan, rendered)

    case 'failed_logins': {
      const user = planEnt(plan, 'user')
      const ip   = planEnt(plan, 'ip')
      let rows = ALL_SIGNIN_ROWS
      if (user) {
        const f = rows.filter((r) => matchesFilter(r[1], user))
        if (f.length > 0) rows = f
      } else if (ip) {
        const f = rows.filter((r) => matchesFilter(r[2], ip))
        if (f.length > 0) rows = f
      }
      return withMeta({
        columns: ['TimeGenerated', 'UserPrincipalName', 'IPAddress', 'Location', 'ResultType', 'AppDisplayName'],
        rows,
        rowCount: rows.length,
        queryTimeMs: 342,
        sourceTable: 'SigninLogs',
        extractedEntities: signinEntities(rows),
      }, plan, rendered)
    }

    case 'user_activity': {
      const user = planEnt(plan, 'user')
      let rows = ALL_SECURITYEVENT_ROWS
      if (user) {
        const f = rows.filter((r) => matchesFilter(r[3], user))
        if (f.length > 0) rows = f
      }
      return withMeta({
        columns: ['TimeGenerated', 'Computer', 'EventID', 'AccountName', 'Activity'],
        rows,
        rowCount: rows.length,
        queryTimeMs: 312,
        sourceTable: 'SecurityEvent',
        extractedEntities: securityEventEntities(rows),
      }, plan, rendered)
    }

    case 'host_activity': {
      const host = planEnt(plan, 'host')
      let rows = ALL_SECURITYEVENT_ROWS
      if (host) {
        const f = rows.filter((r) => matchesFilter(r[1], host))
        if (f.length > 0) rows = f
      }
      return withMeta({
        columns: ['TimeGenerated', 'Computer', 'EventID', 'AccountName', 'Activity'],
        rows,
        rowCount: rows.length,
        queryTimeMs: 312,
        sourceTable: 'SecurityEvent',
        extractedEntities: securityEventEntities(rows),
      }, plan, rendered)
    }

    case 'ip_activity': {
      const ip = planEnt(plan, 'ip')
      let rows = ALL_NETWORK_ROWS
      if (ip) {
        const f = rows.filter((r) => matchesFilter(r[2], ip))
        if (f.length > 0) rows = f
      }
      return withMeta({
        columns: ['TimeGenerated', 'DeviceName', 'RemoteIP', 'RemotePort', 'Protocol', 'BytesSent', 'ActionType'],
        rows,
        rowCount: rows.length,
        queryTimeMs: 198,
        sourceTable: 'DeviceNetworkEvents',
        extractedEntities: networkEntities(rows),
      }, plan, rendered)
    }

    case 'process_activity': {
      const user = planEnt(plan, 'user')
      const host = planEnt(plan, 'host')
      let rows = ALL_PROCESS_ROWS
      if (user) {
        const f = rows.filter((r) => matchesFilter(r[2], user))
        if (f.length > 0) rows = f
      } else if (host) {
        const f = rows.filter((r) => matchesFilter(r[1], host))
        if (f.length > 0) rows = f
      }
      return withMeta({
        columns: ['TimeGenerated', 'DeviceName', 'AccountName', 'FileName', 'ProcessCommandLine', 'SHA256'],
        rows,
        rowCount: rows.length,
        queryTimeMs: 287,
        sourceTable: 'DeviceProcessEvents',
        extractedEntities: processEntities(rows),
      }, plan, rendered)
    }

    case 'suspicious_powershell': {
      const host = planEnt(plan, 'host')
      let rows = ALL_PROCESS_ROWS.filter((r) => r[3].toLowerCase().includes('powershell'))
      if (host) {
        const f = rows.filter((r) => matchesFilter(r[1], host))
        if (f.length > 0) rows = f
      }
      if (rows.length === 0) rows = ALL_PROCESS_ROWS.slice(0, 2)
      return withMeta({
        columns: ['TimeGenerated', 'DeviceName', 'AccountName', 'FileName', 'ProcessCommandLine', 'SHA256'],
        rows,
        rowCount: rows.length,
        queryTimeMs: 287,
        sourceTable: 'DeviceProcessEvents',
        extractedEntities: processEntities(rows),
      }, plan, rendered)
    }

    case 'outbound_connections': {
      const host = planEnt(plan, 'host')
      let rows = ALL_NETWORK_ROWS
      if (host) {
        const f = rows.filter((r) => matchesFilter(r[1], host))
        if (f.length > 0) rows = f
      }
      return withMeta({
        columns: ['TimeGenerated', 'DeviceName', 'RemoteIP', 'RemotePort', 'Protocol', 'BytesSent', 'ActionType'],
        rows,
        rowCount: rows.length,
        queryTimeMs: 198,
        sourceTable: 'DeviceNetworkEvents',
        extractedEntities: networkEntities(rows),
      }, plan, rendered)
    }

    case 'user_host_relationships': {
      const user = planEnt(plan, 'user')
      const u = user ?? 'jsmith'
      const rows = [
        ['DESKTOP-42',  u, 'Interactive', '23', '2026-05-09 08:12', '2026-05-10 07:55'],
        ['SERVER-DC01', u, 'Network',     '8',  '2026-05-09 03:02', '2026-05-10 06:40'],
        ['FILE-SRV01',  u, 'Network',     '3',  '2026-05-09 22:14', '2026-05-10 01:15'],
      ]
      const entities: ExtractedEntity[] = [
        { type: 'user', value: u },
        { type: 'host', value: 'DESKTOP-42' },
        { type: 'host', value: 'SERVER-DC01' },
        { type: 'host', value: 'FILE-SRV01' },
      ]
      return withMeta({
        columns: ['DeviceName', 'AccountName', 'LogonType', 'LogonCount', 'FirstSeen', 'LastSeen'],
        rows,
        rowCount: rows.length,
        queryTimeMs: 221,
        sourceTable: 'DeviceLogonEvents',
        extractedEntities: entities,
      }, plan, rendered)
    }

    case 'local_admin_creation': {
      const host = planEnt(plan, 'host')
      const allRows = [
        ['2026-05-10 05:55', 'SERVER-DC01',    '4720', 'svc-backup2', 'admin-svc', 'CORP'],
        ['2026-05-10 04:10', 'WORKSTATION-07', '4728', 'svc-backup2', 'admin-svc', 'CORP'],
        ['2026-05-09 23:44', 'SERVER-DC01',    '4720', 'temp-admin',  'SYSTEM',    'CORP'],
      ]
      const rows = host
        ? (allRows.filter((r) => matchesFilter(r[1], host)).length > 0
            ? allRows.filter((r) => matchesFilter(r[1], host))
            : allRows)
        : allRows
      const entities: ExtractedEntity[] = [
        { type: 'user',     value: 'svc-backup2' },
        { type: 'user',     value: 'admin-svc' },
        { type: 'host',     value: 'SERVER-DC01' },
        { type: 'host',     value: 'WORKSTATION-07' },
        { type: 'event_id', value: '4720' },
        { type: 'event_id', value: '4728' },
      ]
      return withMeta({
        columns: ['TimeGenerated', 'Computer', 'EventID', 'TargetUserName', 'SubjectUserName', 'SubjectDomainName'],
        rows,
        rowCount: rows.length,
        queryTimeMs: 156,
        sourceTable: 'SecurityEvent',
        extractedEntities: entities,
      }, plan, rendered)
    }

    default: {
      const rows = ALL_SECURITYEVENT_ROWS
      return withMeta({
        columns: ['TimeGenerated', 'Computer', 'EventID', 'AccountName', 'Activity'],
        rows,
        rowCount: rows.length,
        queryTimeMs: 312,
        sourceTable: 'SecurityEvent',
        extractedEntities: securityEventEntities(rows),
      }, plan, rendered)
    }
  }
}

// ── Static result factories for inventory intents ─────────────────────────────

function identityInventoryResult(): MockQueryResult {
  return {
    columns: ['AccountUPN', 'AccountName', 'Department', 'JobTitle', 'AssignedRoles', 'RiskLevel', 'IsEnabled'],
    rows: [
      ['jsmith@corp.com',    'jsmith',    'Engineering', 'Senior Engineer',   'User,GlobalReader',    'Medium', 'true'],
      ['mwatson@corp.com',   'mwatson',   'Finance',     'Financial Analyst', 'User',                 'Low',    'true'],
      ['jdoe@corp.com',      'jdoe',      'Marketing',   'Campaign Manager',  'User',                 'Low',    'true'],
      ['tbrown@corp.com',    'tbrown',    'IT',          'Systems Admin',     'User,HelpDesk',        'Low',    'true'],
      ['lgarcia@corp.com',   'lgarcia',   'HR',          'HR Generalist',     'User',                 'Low',    'true'],
      ['admin-svc@corp.com', 'admin-svc', 'IT',          'Service Account',   'User,DeviceManagement','None',   'true'],
    ],
    rowCount: 6,
    queryTimeMs: 89,
    sourceTable: 'IdentityInfo',
    extractedEntities: [
      { type: 'user', value: 'jsmith@corp.com' },
      { type: 'user', value: 'mwatson@corp.com' },
      { type: 'user', value: 'jdoe@corp.com' },
      { type: 'user', value: 'tbrown@corp.com' },
      { type: 'user', value: 'lgarcia@corp.com' },
    ],
  }
}

function observedUsersResult(): MockQueryResult {
  return {
    columns: ['UserPrincipalName', 'LastSeen', 'SignInEvents', 'FailedSignIns', 'IPs', 'Locations'],
    rows: [
      ['jsmith@corp.com',  '2026-05-10 08:23', '47', '3', '["185.220.101.5","10.0.1.12"]',  '["RU/Moscow","US/Virginia"]'],
      ['mwatson@corp.com', '2026-05-10 07:58', '12', '1', '["194.165.16.3"]',               '["NG/Lagos"]'],
      ['jdoe@corp.com',    '2026-05-10 03:22', '8',  '0', '["203.0.113.42"]',               '["CN/Beijing"]'],
      ['lgarcia@corp.com', '2026-05-09 17:10', '31', '0', '["10.0.1.44"]',                  '["US/Virginia"]'],
      ['tbrown@corp.com',  '2026-05-09 15:42', '22', '0', '["10.0.1.55"]',                  '["US/Virginia"]'],
    ],
    rowCount: 5,
    queryTimeMs: 412,
    sourceTable: 'SigninLogs',
    extractedEntities: [
      { type: 'user', value: 'jsmith@corp.com' },
      { type: 'user', value: 'mwatson@corp.com' },
      { type: 'user', value: 'jdoe@corp.com' },
      { type: 'ip',   value: '185.220.101.5' },
      { type: 'ip',   value: '194.165.16.3' },
      { type: 'ip',   value: '203.0.113.42' },
    ],
  }
}

function hostInventoryResult(): MockQueryResult {
  return {
    columns: ['Computer', 'LastSeen', 'Events', 'UniqueUsers'],
    rows: [
      ['SERVER-DC01',    '2026-05-10 08:00', '312', '4'],
      ['DESKTOP-42',     '2026-05-10 07:45', '187', '2'],
      ['WORKSTATION-07', '2026-05-10 07:30', '94',  '3'],
      ['DESKTOP-A7B',    '2026-05-10 06:22', '76',  '2'],
      ['LAPTOP-F19',     '2026-05-09 17:10', '43',  '1'],
    ],
    rowCount: 5,
    queryTimeMs: 445,
    sourceTable: 'SecurityEvent',
    extractedEntities: [
      { type: 'host', value: 'SERVER-DC01' },
      { type: 'host', value: 'DESKTOP-42' },
      { type: 'host', value: 'WORKSTATION-07' },
      { type: 'host', value: 'DESKTOP-A7B' },
      { type: 'host', value: 'LAPTOP-F19' },
    ],
  }
}

function ipInventoryResult(): MockQueryResult {
  return {
    columns: ['RemoteIP', 'Connections', 'Hosts', 'FirstSeen', 'LastSeen'],
    rows: [
      ['185.220.101.5', '47', '["SERVER-DC01","DESKTOP-42"]',    '2026-05-09 03:12', '2026-05-10 06:58'],
      ['203.0.113.42',  '23', '["DESKTOP-42","DESKTOP-A7B"]',    '2026-05-09 14:30', '2026-05-10 04:30'],
      ['31.13.72.36',   '18', '["DESKTOP-A7B"]',                 '2026-05-09 18:55', '2026-05-10 07:32'],
      ['8.8.8.8',       '12', '["WORKSTATION-07","DESKTOP-42"]', '2026-05-09 06:00', '2026-05-10 05:44'],
      ['104.18.20.14',  '8',  '["LAPTOP-F19"]',                  '2026-05-09 22:10', '2026-05-10 01:30'],
    ],
    rowCount: 5,
    queryTimeMs: 278,
    sourceTable: 'DeviceNetworkEvents',
    extractedEntities: [
      { type: 'ip',   value: '185.220.101.5' },
      { type: 'ip',   value: '203.0.113.42' },
      { type: 'ip',   value: '31.13.72.36' },
      { type: 'host', value: 'SERVER-DC01' },
      { type: 'host', value: 'DESKTOP-42' },
      { type: 'host', value: 'DESKTOP-A7B' },
    ],
  }
}

function processInventoryResult(): MockQueryResult {
  return {
    columns: ['FileName', 'Executions', 'Hosts', 'Users', 'FirstSeen'],
    rows: [
      ['powershell.exe', '34', '["DESKTOP-42","SERVER-DC01","LAPTOP-F19"]', '["jsmith","admin-svc"]', '2026-05-09 01:12'],
      ['cmd.exe',        '28', '["DESKTOP-42","DESKTOP-A7B"]',              '["jsmith","tbrown"]',    '2026-05-09 02:30'],
      ['wscript.exe',    '7',  '["DESKTOP-A7B"]',                           '["tbrown"]',             '2026-05-10 03:10'],
      ['mshta.exe',      '3',  '["LAPTOP-F19"]',                            '["lgarcia"]',            '2026-05-10 02:55'],
      ['certutil.exe',   '2',  '["SERVER-DC01"]',                           '["admin-svc"]',          '2026-05-09 23:44'],
    ],
    rowCount: 5,
    queryTimeMs: 321,
    sourceTable: 'DeviceProcessEvents',
    extractedEntities: [
      { type: 'process', value: 'powershell.exe' },
      { type: 'process', value: 'cmd.exe' },
      { type: 'process', value: 'wscript.exe' },
      { type: 'host',    value: 'DESKTOP-42' },
      { type: 'host',    value: 'SERVER-DC01' },
      { type: 'user',    value: 'jsmith' },
      { type: 'user',    value: 'admin-svc' },
    ],
  }
}
