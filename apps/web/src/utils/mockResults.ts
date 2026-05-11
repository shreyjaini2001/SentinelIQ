export interface MockQueryResult {
  columns: string[]
  rows: string[][]
}

export function generateMockResults(kql: string): MockQueryResult {
  const lower = kql.toLowerCase()

  if (
    lower.includes('signinlogs') ||
    lower.includes('aadriskyusers') ||
    lower.includes('identitylogon') ||
    lower.includes('failed login') ||
    lower.includes('sign-in') ||
    lower.includes('signin')
  ) {
    return {
      columns: ['TimeGenerated', 'UserPrincipalName', 'IPAddress', 'Location', 'ResultType'],
      rows: [
        ['2026-05-10 08:23', 'jsmith@corp.com',  '185.220.101.5', 'RU / Moscow',   '50126'],
        ['2026-05-10 08:21', 'jsmith@corp.com',  '185.220.101.5', 'RU / Moscow',   '50126'],
        ['2026-05-10 08:19', 'jsmith@corp.com',  '185.220.101.5', 'RU / Moscow',   '50053'],
        ['2026-05-10 07:58', 'mwatson@corp.com', '194.165.16.3',  'NG / Lagos',    '50074'],
        ['2026-05-10 05:30', 'svc-backup-new',   '10.0.2.15',     'US / Virginia', '50126'],
        ['2026-05-10 03:22', 'jdoe@corp.com',    '203.0.113.42',  'CN / Beijing',  '50126'],
      ],
    }
  }

  if (
    lower.includes('deviceevents') ||
    lower.includes('processcreation') ||
    lower.includes('powershell') ||
    lower.includes('commandline')
  ) {
    return {
      columns: ['TimeGenerated', 'DeviceName', 'AccountName', 'FileName', 'CommandLine'],
      rows: [
        ['2026-05-10 06:12', 'DESKTOP-42',  'jsmith',    'powershell.exe', '-EncodedCommand aQBmAC...'],
        ['2026-05-10 05:45', 'DESKTOP-42',  'jsmith',    'cmd.exe',        '/c whoami'],
        ['2026-05-10 04:31', 'SERVER-DC01', 'admin-svc', 'powershell.exe', '-ExecutionPolicy Bypass -File run.ps1'],
        ['2026-05-10 03:10', 'DESKTOP-A7B', 'tbrown',    'wscript.exe',    'C:\\Temp\\dropper.vbs'],
      ],
    }
  }

  if (
    lower.includes('networkcommunication') ||
    lower.includes('networkflow') ||
    lower.includes('outbound') ||
    lower.includes('connectionevents')
  ) {
    return {
      columns: ['TimeGenerated', 'DeviceName', 'RemoteIP', 'RemotePort', 'BytesSent'],
      rows: [
        ['2026-05-10 07:32', 'DESKTOP-A7B',  '31.13.72.36',   '443', '1,240,832'],
        ['2026-05-10 07:15', 'DESKTOP-A7B',  '31.13.72.36',   '443', '985,421'],
        ['2026-05-10 06:58', 'SERVER-DC01',  '185.220.101.5', '80',  '2,108,000'],
        ['2026-05-10 05:44', 'WORKSTATION-07','8.8.8.8',      '53',  '512'],
      ],
    }
  }

  if (
    lower.includes('lateralmovement') ||
    lower.includes('lateral') ||
    lower.includes('smb') ||
    lower.includes('identitylogon')
  ) {
    return {
      columns: ['TimeGenerated', 'AccountName', 'DeviceName', 'RemoteDeviceName', 'LogonType'],
      rows: [
        ['2026-05-10 07:10', 'jsmith',    'DESKTOP-42',  'SERVER-DC01',   'Network'],
        ['2026-05-10 06:55', 'jsmith',    'DESKTOP-42',  'SERVER-FILES01', 'Network'],
        ['2026-05-10 06:40', 'admin-svc', 'SERVER-DC01', 'WORKSTATION-07', 'Network'],
      ],
    }
  }

  // Generic fallback — SecurityEvent / AuditLogs
  return {
    columns: ['TimeGenerated', 'Computer', 'EventID', 'AccountName', 'Activity'],
    rows: [
      ['2026-05-10 08:00', 'SERVER-DC01',    '4624', 'jsmith',     'Successful logon'],
      ['2026-05-10 07:45', 'DESKTOP-42',     '4688', 'jsmith',     'Process created: powershell.exe'],
      ['2026-05-10 07:30', 'WORKSTATION-07', '4625', 'admin',      'Failed logon — account locked'],
      ['2026-05-10 06:45', 'SERVER-DC01',    '4728', 'admin-svc',  'Member added to security group'],
      ['2026-05-10 05:55', 'DESKTOP-42',     '4720', 'svc-backup', 'User account created'],
    ],
  }
}
