import type { MockQueryResult } from './mockResults'

function unique(arr: string[]): string[] {
  return [...new Set(arr)]
}

export function summarizeQueryResult(result: MockQueryResult): string {
  const users    = result.extractedEntities.filter((e) => e.type === 'user').map((e) => e.value)
  const hosts    = result.extractedEntities.filter((e) => e.type === 'host').map((e) => e.value)
  const ips      = result.extractedEntities.filter((e) => e.type === 'ip').map((e) => e.value)
  const countries = result.extractedEntities.filter((e) => e.type === 'country').map((e) => e.value)

  switch (result.sourceTable) {
    case 'SigninLogs':
      return [
        `${result.rowCount} sign-in events from ${result.sourceTable}.`,
        users.length   > 0 ? `Affected users: ${unique(users).slice(0, 3).join(', ')}.`   : '',
        countries.length > 0 ? `Source countries: ${unique(countries).slice(0, 3).join(', ')}.` : '',
        ips.length     > 0 ? `Source IPs include ${ips[0]}.` : '',
        'Recommend: verify account status, apply conditional access, review Azure AD sign-in risk.',
      ].filter(Boolean).join(' ')

    case 'DeviceProcessEvents':
      return [
        `${result.rowCount} process creation events.`,
        users.length > 0 ? `Accounts involved: ${unique(users).slice(0, 3).join(', ')}.` : '',
        hosts.length > 0 ? `Devices: ${unique(hosts).slice(0, 3).join(', ')}.` : '',
        'Encoded PowerShell and script-based execution detected.',
        'Recommend: isolate affected endpoints, review script content, check for persistence.',
      ].filter(Boolean).join(' ')

    case 'DeviceNetworkEvents':
      return [
        `${result.rowCount} network connection events.`,
        hosts.length > 0 ? `Source hosts: ${unique(hosts).slice(0, 3).join(', ')}.` : '',
        ips.length   > 0 ? `Destination IPs: ${unique(ips).slice(0, 3).join(', ')}.` : '',
        'Large data transfers to external IPs detected.',
        'Recommend: block suspicious IPs, review DLP policies, check for data exfiltration.',
      ].filter(Boolean).join(' ')

    case 'IdentityLogonEvents':
      return [
        `${result.rowCount} lateral movement events.`,
        users.length > 0 ? `Accounts: ${unique(users).join(', ')}.` : '',
        hosts.length > 0 ? `Hosts traversed: ${unique(hosts).slice(0, 4).join(', ')}.` : '',
        'Network logon events suggest credential reuse across hosts.',
        'Recommend: reset compromised credentials, review SMB/WMI lateral movement paths.',
      ].filter(Boolean).join(' ')

    case 'SecurityEvent':
      return [
        `${result.rowCount} security audit events.`,
        users.length > 0 ? `Accounts: ${unique(users).slice(0, 3).join(', ')}.` : '',
        hosts.length > 0 ? `Systems: ${unique(hosts).slice(0, 3).join(', ')}.` : '',
        'Recommend: review privileged account changes and logon activity.',
      ].filter(Boolean).join(' ')

    default:
      return [
        `${result.rowCount} events from ${result.sourceTable}.`,
        users.length > 0 ? `Users: ${unique(users).slice(0, 3).join(', ')}.` : '',
        hosts.length > 0 ? `Hosts: ${unique(hosts).slice(0, 3).join(', ')}.` : '',
        'Review for anomalous patterns.',
      ].filter(Boolean).join(' ')
  }
}

export function getQueryTitle(kql: string): string {
  const tables = [
    'SigninLogs', 'SecurityEvent', 'DeviceProcessEvents', 'DeviceNetworkEvents',
    'DeviceEvents', 'IdentityInfo', 'IdentityLogonEvents', 'AuditLogs',
    'AADRiskyUsers', 'NetworkCommunication',
  ]
  for (const table of tables) {
    if (kql.includes(table)) {
      const lines = kql.split('\n')
      const whereLine = lines.find((l) => l.trim().toLowerCase().startsWith('| where'))
      if (whereLine) {
        const condition = whereLine.replace(/^\|\s*where\s*/i, '').trim().slice(0, 40)
        return `${table} — ${condition}`
      }
      return table
    }
  }
  return kql.trim().split('\n')[0].trim().slice(0, 50)
}
