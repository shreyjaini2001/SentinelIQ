export type ScopeEntityType = 'user' | 'host' | 'ip' | 'process' | null

export interface KqlScope {
  intent: string
  entityType: ScopeEntityType
  entityValue: string | null
  table: string
  timeAgo: string
  isScoped: boolean
  scopeLabel?: string
}

const ENTITY_PATTERNS: Array<[RegExp, ScopeEntityType]> = [
  [/UserPrincipalName\s*=~\s*"([^"]+)"/i,  'user'],
  [/UserPrincipalName\s+has\s+"([^"]+)"/i, 'user'],
  [/Account\s+has\s+"([^"]+)"/i,            'user'],
  [/AccountName\s+has\s+"([^"]+)"/i,        'user'],
  [/AccountName\s*=~\s*"([^"]+)"/i,         'user'],
  [/Computer\s*=~\s*"([^"]+)"/i,            'host'],
  [/DeviceName\s*=~\s*"([^"]+)"/i,          'host'],
  [/RemoteIP\s*==\s*"([^"]+)"/i,            'ip'],
  [/IPAddress\s*==\s*"([^"]+)"/i,           'ip'],
  [/FileName\s*=~\s*"([^"]+)"/i,            'process'],
]

export function parseKqlScope(kql: string): KqlScope {
  const firstLine = kql.split('\n')[0].trim()
  const table = firstLine || 'SecurityEvent'
  const lower = kql.toLowerCase()

  // Time range
  const timeMatch = kql.match(/ago\((\d+[hdm])\)/i)
  const timeAgo = timeMatch ? timeMatch[1] : '24h'

  // Entity scope
  let entityType: ScopeEntityType = null
  let entityValue: string | null = null
  for (const [regex, type] of ENTITY_PATTERNS) {
    const m = kql.match(regex)
    if (m) {
      entityType = type
      entityValue = m[1]
      break
    }
  }

  // Inventory intent detection (only when no entity scope is present — avoids mislabeling
  // host/user-scoped queries that happen to contain summarize/inventory column names)
  let scopeLabel: string | undefined
  let intent = 'Security event search'

  if (lower.includes('identityinfo')) {
    intent = 'Identity inventory'
    scopeLabel = 'All known users'
  } else if (entityType === null && lower.includes('signinlogs') && lower.includes('summarize') && lower.includes('lastseen')) {
    intent = 'Active user inventory'
    scopeLabel = 'Recently active users'
  } else if (entityType === null && lower.includes('securityevent') && lower.includes('summarize') && lower.includes('uniqueusers')) {
    intent = 'Host inventory'
    scopeLabel = 'All active endpoints'
  } else if (entityType === null && lower.includes('devicenetworkevents') && lower.includes('summarize') && lower.includes('connections')) {
    intent = 'IP inventory'
    scopeLabel = 'Public internet IPs'
  } else if (entityType === null && lower.includes('deviceprocessevents') && lower.includes('summarize') && lower.includes('executions')) {
    intent = 'Process inventory'
    scopeLabel = 'All observed processes'
  } else if (lower.includes('signinlogs')) {
    if (lower.includes('resulttype')) {
      intent = entityType ? 'Failed login investigation' : 'Failed login analysis'
    } else {
      intent = entityType ? 'Sign-in activity investigation' : 'Sign-in log search'
    }
  } else if (lower.includes('deviceprocessevents')) {
    intent = entityType ? 'Process investigation' : 'Suspicious process hunt'
  } else if (lower.includes('devicenetworkevents')) {
    if (entityType === 'ip') intent = 'IP activity investigation'
    else if (entityType === 'host') intent = 'Host network investigation'
    else intent = 'Network activity hunt'
  } else if (lower.includes('devicelogonevents')) {
    intent = entityType === 'user' ? 'User lateral movement scope' : 'Logon activity search'
  } else if (lower.includes('deviceevents')) {
    intent = 'Credential access detection'
  } else if (lower.includes('securityevent')) {
    if (lower.includes('4720') || lower.includes('4728')) intent = 'Admin account change detection'
    else if (lower.includes('4672') || lower.includes('privilege')) intent = 'Privilege escalation detection'
    else if (lower.includes('logontype')) intent = 'Lateral movement analysis'
    else if (entityType === 'user') intent = 'User activity investigation'
    else if (entityType === 'host') intent = 'Host activity investigation'
    else intent = 'Security event search'
  }

  return {
    intent,
    entityType,
    entityValue,
    table,
    timeAgo: lower.includes('identityinfo') && !lower.includes('ago(') ? 'N/A' : timeAgo,
    isScoped: entityType !== null,
    scopeLabel,
  }
}
