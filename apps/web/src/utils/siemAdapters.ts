import type {
  QueryPlan,
  QueryPlanIntent,
  RenderedQuery,
  SiemPlatform,
  SiemAdapter,
  FieldMapping,
  SourceDefinition,
} from '../types/queryPlan'
import { parseKqlScope } from './queryPlanner'

// ── Intent mapping from KQL scope description ─────────────────────────────────

const INTENT_FROM_SCOPE: Record<string, QueryPlanIntent> = {
  'Failed login investigation':     'failed_logins',
  'Failed login analysis':          'failed_logins',
  'Sign-in activity investigation': 'user_activity',
  'Sign-in log search':             'user_activity',
  'User activity investigation':    'user_activity',
  'User lateral movement scope':    'user_host_relationships',
  'Host activity investigation':    'host_activity',
  'Process investigation':          'process_activity',
  'Suspicious process hunt':        'process_activity',
  'IP activity investigation':      'ip_activity',
  'Host network investigation':     'outbound_connections',
  'Network activity hunt':          'outbound_connections',
  'Logon activity search':          'user_host_relationships',
  'Lateral movement analysis':      'user_host_relationships',
  'Credential access detection':    'process_activity',
  'Identity inventory':             'identity_inventory',
  'Active user inventory':          'observed_users',
  'Host inventory':                 'host_inventory',
  'IP inventory':                   'ip_inventory',
  'Process inventory':              'process_inventory',
  'Admin account change detection': 'local_admin_creation',
  'Privilege escalation detection': 'user_activity',
  'Security event search':          'generic',
}

// ── Derive a neutral QueryPlan from raw KQL ───────────────────────────────────

export function deriveQueryPlanFromKql(kql: string): QueryPlan {
  const scope = parseKqlScope(kql)
  const lower = kql.toLowerCase()

  let intent: QueryPlanIntent = INTENT_FROM_SCOPE[scope.intent] ?? 'generic'

  // Refine: encoded/bypassed powershell → suspicious_powershell
  if (
    lower.includes('powershell') &&
    (lower.includes('encodedcommand') || lower.includes('-enc') || lower.includes('bypass'))
  ) {
    intent = 'suspicious_powershell'
  }

  // Refine: sign-in with ResultType filter → failed_logins
  if (lower.includes('signinlogs') && lower.includes('resulttype')) {
    intent = 'failed_logins'
  }

  const entities: QueryPlan['entities'] = []
  if (scope.entityType && scope.entityValue) {
    entities.push({ type: scope.entityType, value: scope.entityValue })
  }

  const timeValue = scope.timeAgo === 'N/A' ? 'all' : scope.timeAgo
  const timeDisplay = scope.timeAgo === 'N/A' ? 'no time filter' : `last ${scope.timeAgo}`

  return {
    intent,
    entities,
    timeRange: { value: timeValue, display: timeDisplay },
    dataGoal: 'result_table',
    requiredFields: [],
    preferredSources: [scope.table],
    explanation: scope.intent + (scope.isScoped && scope.entityValue
      ? ` — ${scope.entityType}: ${scope.entityValue}`
      : ''),
  }
}

// ── Time helpers ──────────────────────────────────────────────────────────────

function splTime(value: string): string {
  if (value === 'all') return ''
  return `earliest=-${value}`
}

function esqlDuration(value: string): string {
  if (value === 'all') return ''
  const n = parseInt(value, 10)
  if (value.endsWith('h')) return `${n} HOURS`
  if (value.endsWith('d')) return `${n} DAYS`
  if (value.endsWith('m')) return `${n} MINUTES`
  return '24 HOURS'
}

// ── Entity lookup helpers ─────────────────────────────────────────────────────

function ent(plan: QueryPlan, type: 'user' | 'host' | 'ip' | 'process'): string | null {
  return plan.entities.find((e) => e.type === type)?.value ?? null
}

// ── Sentinel / KQL adapter ────────────────────────────────────────────────────

function renderSentinel(plan: QueryPlan): RenderedQuery {
  const t = plan.timeRange.value
  const tf = t !== 'all' ? `| where TimeGenerated > ago(${t})` : ''
  const user = ent(plan, 'user')
  const host = ent(plan, 'host')
  const ip   = ent(plan, 'ip')

  let query = ''
  let sourceName = 'SecurityEvent'

  const lines = (...parts: (string | false | null | undefined)[]) =>
    parts.filter(Boolean).join('\n')

  switch (plan.intent) {
    case 'failed_logins':
      sourceName = 'SigninLogs'
      query = lines(
        'SigninLogs',
        tf,
        '| where ResultType != 0',
        user && `| where UserPrincipalName =~ "${user}"`,
        '| project TimeGenerated, UserPrincipalName, IPAddress, Location, ResultType, AppDisplayName',
        '| sort by TimeGenerated desc',
      )
      break

    case 'user_activity':
      sourceName = 'SecurityEvent'
      query = lines(
        'SecurityEvent',
        tf,
        user && `| where Account has "${user}"`,
        '| project TimeGenerated, Computer, EventID, Account, Activity',
        '| sort by TimeGenerated desc',
      )
      break

    case 'host_activity':
      sourceName = 'SecurityEvent'
      query = lines(
        'SecurityEvent',
        tf,
        host && `| where Computer =~ "${host}"`,
        '| project TimeGenerated, Computer, EventID, Account, Activity',
        '| sort by TimeGenerated desc',
      )
      break

    case 'ip_activity':
      sourceName = 'DeviceNetworkEvents'
      query = lines(
        'DeviceNetworkEvents',
        tf,
        ip ? `| where RemoteIP == "${ip}"` : '| where RemoteIPType == "Public"',
        '| project TimeGenerated, DeviceName, RemoteIP, RemotePort, Protocol, BytesSent',
        '| sort by TimeGenerated desc',
      )
      break

    case 'process_activity':
      sourceName = 'DeviceProcessEvents'
      query = lines(
        'DeviceProcessEvents',
        tf,
        host && `| where DeviceName =~ "${host}"`,
        user && `| where AccountName has "${user}"`,
        '| project TimeGenerated, DeviceName, AccountName, FileName, ProcessCommandLine, SHA256',
        '| sort by TimeGenerated desc',
      )
      break

    case 'suspicious_powershell':
      sourceName = 'DeviceProcessEvents'
      query = lines(
        'DeviceProcessEvents',
        tf,
        host && `| where DeviceName =~ "${host}"`,
        '| where FileName =~ "powershell.exe"',
        '| where ProcessCommandLine has_any ("-EncodedCommand", "-Enc", "-ExecutionPolicy Bypass")',
        '| project TimeGenerated, DeviceName, AccountName, FileName, ProcessCommandLine',
        '| sort by TimeGenerated desc',
      )
      break

    case 'outbound_connections':
      sourceName = 'DeviceNetworkEvents'
      query = lines(
        'DeviceNetworkEvents',
        tf,
        host ? `| where DeviceName =~ "${host}"` : '| where RemoteIPType == "Public"',
        '| project TimeGenerated, DeviceName, RemoteIP, RemotePort, Protocol, BytesSent',
        '| sort by BytesSent desc',
      )
      break

    case 'user_host_relationships':
      sourceName = 'DeviceLogonEvents'
      query = lines(
        'DeviceLogonEvents',
        tf,
        '| where LogonType == "Network"',
        user && `| where AccountName has "${user}"`,
        host && `| where DeviceName =~ "${host}"`,
        '| project TimeGenerated, AccountName, DeviceName, RemoteDeviceName, LogonType, Protocol',
        '| sort by TimeGenerated desc',
      )
      break

    case 'identity_inventory':
      sourceName = 'IdentityInfo'
      query = 'IdentityInfo\n| project AccountUPN, AccountName, Department, JobTitle, AssignedRoles, IsEnabled'
      break

    case 'observed_users':
      sourceName = 'SigninLogs'
      query = lines(
        'SigninLogs',
        tf,
        '| summarize LastSeen=max(TimeGenerated), SignInEvents=count(), FailedSignIns=countif(ResultType != 0) by UserPrincipalName',
        '| sort by LastSeen desc',
      )
      break

    case 'host_inventory':
      sourceName = 'SecurityEvent'
      query = lines(
        'SecurityEvent',
        tf,
        '| summarize LastSeen=max(TimeGenerated), Events=count(), UniqueUsers=dcount(Account) by Computer',
        '| sort by LastSeen desc',
      )
      break

    case 'ip_inventory':
      sourceName = 'DeviceNetworkEvents'
      query = lines(
        'DeviceNetworkEvents',
        tf,
        '| where RemoteIPType == "Public"',
        '| summarize Connections=count(), Hosts=make_set(DeviceName) by RemoteIP',
        '| sort by Connections desc',
      )
      break

    case 'process_inventory':
      sourceName = 'DeviceProcessEvents'
      query = lines(
        'DeviceProcessEvents',
        tf,
        '| summarize Executions=count(), Hosts=make_set(DeviceName), Users=make_set(AccountName), FirstSeen=min(TimeGenerated) by FileName',
        '| sort by Executions desc',
      )
      break

    case 'local_admin_creation':
      sourceName = 'SecurityEvent'
      query = lines(
        'SecurityEvent',
        tf,
        '| where EventID in (4720, 4728)',
        '| project TimeGenerated, Computer, EventID, TargetUserName, SubjectUserName, SubjectDomainName',
        '| sort by TimeGenerated desc',
      )
      break

    default:
      sourceName = 'SecurityEvent'
      query = lines(
        'SecurityEvent',
        tf,
        '| project TimeGenerated, Computer, EventID, AccountName, Activity',
        '| sort by TimeGenerated desc',
      )
  }

  return { platform: 'sentinel', language: 'KQL', query, sourceName, explanation: `Microsoft Sentinel / KQL — ${plan.explanation}` }
}

// ── Splunk / SPL adapter ──────────────────────────────────────────────────────

function renderSplunk(plan: QueryPlan): RenderedQuery {
  const st = splTime(plan.timeRange.value)
  const user = ent(plan, 'user')
  const host = ent(plan, 'host')
  const ip   = ent(plan, 'ip')

  let query = ''
  let sourceName = 'index=windows'

  const lines = (...parts: (string | false | null | undefined)[]) =>
    parts.filter(Boolean).join('\n')

  switch (plan.intent) {
    case 'failed_logins':
      sourceName = 'index=identity sourcetype=azure:signin'
      query = lines(
        `index=identity sourcetype=azure:signin${st ? ' ' + st : ''}`,
        '| search result_type!=0',
        user && `| search user="${user}"`,
        '| table _time user ip location app result_type',
        '| sort - _time',
      )
      break

    case 'user_activity':
      sourceName = 'index=windows'
      query = lines(
        `index=windows${st ? ' ' + st : ''}`,
        user && `| search user="${user}" OR user="${user}@corp.com"`,
        '| table _time host user action event_id',
        '| sort - _time',
      )
      break

    case 'host_activity':
      sourceName = 'index=windows'
      query = lines(
        `index=windows${st ? ' ' + st : ''}${host ? ' host="' + host + '"' : ''}`,
        '| table _time host user action event_id',
        '| sort - _time',
      )
      break

    case 'ip_activity':
      sourceName = 'index=network'
      query = lines(
        `index=network${st ? ' ' + st : ''}`,
        ip ? `| search dest_ip="${ip}" OR src_ip="${ip}"` : '| search dest_type=external',
        '| table _time src_host dest_ip dest_port protocol bytes',
        '| sort - _time',
      )
      break

    case 'process_activity':
      sourceName = 'index=edr'
      query = lines(
        `index=edr${st ? ' ' + st : ''}${host ? ' host="' + host + '"' : ''}`,
        user && `| search user="${user}"`,
        '| table _time host user process command_line hash',
        '| sort - _time',
      )
      break

    case 'suspicious_powershell':
      sourceName = 'index=edr'
      query = lines(
        `index=edr${st ? ' ' + st : ''}${host ? ' host="' + host + '"' : ''}`,
        '| search process=powershell.exe',
        '| search command_line="*-EncodedCommand*" OR command_line="*-Enc*" OR command_line="*Bypass*"',
        '| table _time host user process command_line',
        '| sort - _time',
      )
      break

    case 'outbound_connections':
      sourceName = 'index=network'
      query = lines(
        `index=network${st ? ' ' + st : ''}${host ? ' src_host="' + host + '"' : ''}`,
        host ? null : '| search dest_type=external',
        '| table _time src_host dest_ip dest_port protocol bytes',
        '| sort - bytes',
      )
      break

    case 'user_host_relationships':
      sourceName = 'index=windows sourcetype=WinEventLog:Security'
      query = lines(
        `index=windows sourcetype=WinEventLog:Security${st ? ' ' + st : ''} EventCode=4624`,
        '| search logon_type=3',
        user && `| search user="${user}"`,
        '| table _time user src_host dest_host',
        '| sort - _time',
      )
      break

    case 'identity_inventory':
      sourceName = 'identity lookup'
      query = '| inputlookup user_inventory.csv\n| table upn username department job_title roles enabled'
      break

    case 'observed_users':
      sourceName = 'index=identity'
      query = lines(
        `index=identity sourcetype=azure:signin${st ? ' ' + st : ''}`,
        '| stats latest(_time) as last_seen count as total_signins sum(eval(result_type!=0)) as failed by user',
        '| sort - last_seen',
      )
      break

    case 'host_inventory':
      sourceName = 'index=windows'
      query = lines(
        `index=windows sourcetype=WinEventLog:Security${st ? ' ' + st : ''}`,
        '| stats latest(_time) as last_seen count as events dc(user) as unique_users by host',
        '| sort - last_seen',
      )
      break

    case 'ip_inventory':
      sourceName = 'index=network'
      query = lines(
        `index=network${st ? ' ' + st : ''} dest_type=external`,
        '| stats count as connections dc(src_host) as unique_hosts values(src_host) as hosts by dest_ip',
        '| sort - connections',
      )
      break

    case 'process_inventory':
      sourceName = 'index=edr'
      query = lines(
        `index=edr${st ? ' ' + st : ''}`,
        '| stats count as executions dc(host) as unique_hosts values(host) as hosts values(user) as users earliest(_time) as first_seen by process',
        '| sort - executions',
      )
      break

    case 'local_admin_creation':
      sourceName = 'index=windows sourcetype=WinEventLog:Security'
      query = lines(
        `index=windows sourcetype=WinEventLog:Security${st ? ' ' + st : ''}`,
        '| search EventCode=4720 OR EventCode=4728',
        '| table _time host event_code target_user actor',
        '| sort - _time',
      )
      break

    default:
      sourceName = 'index=windows'
      query = lines(
        `index=windows${st ? ' ' + st : ''}`,
        '| table _time host event_id user activity',
        '| sort - _time',
      )
  }

  return { platform: 'splunk', language: 'SPL', query, sourceName, explanation: `Splunk / SPL — ${plan.explanation}` }
}

// ── Elastic / ES|QL adapter ───────────────────────────────────────────────────

function renderElastic(plan: QueryPlan): RenderedQuery {
  const dur = esqlDuration(plan.timeRange.value)
  const tf = dur ? `| WHERE @timestamp > NOW() - ${dur}` : ''
  const user = ent(plan, 'user')
  const host = ent(plan, 'host')
  const ip   = ent(plan, 'ip')

  let query = ''
  let sourceName = 'security-events'

  const lines = (...parts: (string | false | null | undefined)[]) =>
    parts.filter(Boolean).join('\n')

  switch (plan.intent) {
    case 'failed_logins':
      sourceName = 'signin-logs'
      query = lines(
        'FROM signin-logs',
        tf,
        '| WHERE result.type != 0',
        user && `| WHERE user.email == "${user}"`,
        '| KEEP @timestamp, user.email, source.ip, source.geo.country_name, result.type, event.outcome',
        '| SORT @timestamp DESC',
      )
      break

    case 'user_activity':
      sourceName = 'endpoint-events'
      query = lines(
        'FROM endpoint-events',
        tf,
        user && `| WHERE user.name == "${user}" OR user.email == "${user}"`,
        '| KEEP @timestamp, host.name, user.name, event.action, event.code',
        '| SORT @timestamp DESC',
      )
      break

    case 'host_activity':
      sourceName = 'endpoint-events'
      query = lines(
        'FROM endpoint-events',
        tf,
        host && `| WHERE host.name == "${host}"`,
        '| KEEP @timestamp, host.name, user.name, event.action, event.code',
        '| SORT @timestamp DESC',
      )
      break

    case 'ip_activity':
      sourceName = 'network-events'
      query = lines(
        'FROM network-events',
        tf,
        ip
          ? `| WHERE destination.ip == "${ip}" OR source.ip == "${ip}"`
          : '| WHERE network.direction == "outbound"',
        '| KEEP @timestamp, host.name, source.ip, destination.ip, destination.port, network.protocol, network.bytes',
        '| SORT @timestamp DESC',
      )
      break

    case 'process_activity':
      sourceName = 'endpoint-events'
      query = lines(
        'FROM endpoint-events',
        tf,
        host && `| WHERE host.name == "${host}"`,
        user && `| WHERE user.name == "${user}"`,
        '| KEEP @timestamp, host.name, user.name, process.name, process.command_line, process.hash.sha256',
        '| SORT @timestamp DESC',
      )
      break

    case 'suspicious_powershell':
      sourceName = 'endpoint-events'
      query = lines(
        'FROM endpoint-events',
        tf,
        host && `| WHERE host.name == "${host}"`,
        '| WHERE process.name == "powershell.exe"',
        '| WHERE process.command_line LIKE "*-EncodedCommand*" OR process.command_line LIKE "*Bypass*"',
        '| KEEP @timestamp, host.name, user.name, process.name, process.command_line',
        '| SORT @timestamp DESC',
      )
      break

    case 'outbound_connections':
      sourceName = 'network-events'
      query = lines(
        'FROM network-events',
        tf,
        '| WHERE network.direction == "outbound"',
        host && `| WHERE host.name == "${host}"`,
        '| KEEP @timestamp, host.name, destination.ip, destination.port, network.protocol, network.bytes',
        '| SORT network.bytes DESC',
      )
      break

    case 'user_host_relationships':
      sourceName = 'endpoint-events'
      query = lines(
        'FROM endpoint-events',
        tf,
        '| WHERE event.action == "logged-in"',
        user && `| WHERE user.name == "${user}"`,
        host && `| WHERE host.name == "${host}"`,
        '| KEEP @timestamp, user.name, host.name, event.action, network.protocol',
        '| SORT @timestamp DESC',
      )
      break

    case 'identity_inventory':
      sourceName = 'identity-info'
      query = 'FROM identity-info\n| KEEP user.email, user.name, user.group, user.title, user.roles, status.enabled'
      break

    case 'observed_users':
      sourceName = 'signin-logs'
      query = lines(
        'FROM signin-logs',
        tf,
        '| STATS max(@timestamp) AS last_seen, count(*) AS sign_ins BY user.email',
        '| SORT last_seen DESC',
      )
      break

    case 'host_inventory':
      sourceName = 'security-events'
      query = lines(
        'FROM security-events',
        tf,
        '| STATS max(@timestamp) AS last_seen, count(*) AS events, count_distinct(user.name) AS unique_users BY host.name',
        '| SORT last_seen DESC',
      )
      break

    case 'ip_inventory':
      sourceName = 'network-events'
      query = lines(
        'FROM network-events',
        tf,
        '| WHERE network.direction == "outbound"',
        '| STATS count(*) AS connections, count_distinct(host.name) AS unique_hosts BY destination.ip',
        '| SORT connections DESC',
      )
      break

    case 'process_inventory':
      sourceName = 'endpoint-events'
      query = lines(
        'FROM endpoint-events',
        tf,
        '| STATS count(*) AS executions, count_distinct(host.name) AS unique_hosts, count_distinct(user.name) AS unique_users, min(@timestamp) AS first_seen BY process.name',
        '| SORT executions DESC',
      )
      break

    case 'local_admin_creation':
      sourceName = 'security-events'
      query = lines(
        'FROM security-events',
        tf,
        '| WHERE event.code IN ("4720", "4728")',
        '| KEEP @timestamp, host.name, event.code, user.target.name, user.name',
        '| SORT @timestamp DESC',
      )
      break

    default:
      sourceName = 'security-events'
      query = lines(
        'FROM security-events',
        tf,
        '| KEEP @timestamp, host.name, event.code, user.name, event.action',
        '| SORT @timestamp DESC',
      )
  }

  return { platform: 'elastic', language: 'ESQL', query, sourceName, explanation: `Elastic / ES|QL — ${plan.explanation}` }
}

// ── Adapter registry ──────────────────────────────────────────────────────────

export const PLATFORM_NAMES: Record<SiemPlatform, string> = {
  sentinel: 'Microsoft Sentinel',
  splunk:   'Splunk',
  elastic:  'Elastic',
}

export const PLATFORM_LANGUAGES: Record<SiemPlatform, string> = {
  sentinel: 'KQL',
  splunk:   'SPL',
  elastic:  'ES|QL',
}

const SENTINEL_ADAPTER: SiemAdapter = {
  id: 'sentinel',
  name: 'Microsoft Sentinel',
  queryLanguage: 'KQL',
  renderQuery: renderSentinel,
  getFieldMappings: (): FieldMapping[] => [
    { neutral: 'timestamp', platformField: 'TimeGenerated' },
    { neutral: 'user',      platformField: 'Account / UserPrincipalName' },
    { neutral: 'host',      platformField: 'Computer / DeviceName' },
    { neutral: 'ip',        platformField: 'IPAddress / RemoteIP' },
    { neutral: 'process',   platformField: 'FileName' },
  ],
  getSupportedSources: (): SourceDefinition[] => [
    { neutralName: 'sign-in-logs',    platformSource: 'SigninLogs' },
    { neutralName: 'process-events',  platformSource: 'DeviceProcessEvents' },
    { neutralName: 'network-events',  platformSource: 'DeviceNetworkEvents' },
    { neutralName: 'logon-events',    platformSource: 'DeviceLogonEvents' },
    { neutralName: 'security-events', platformSource: 'SecurityEvent' },
    { neutralName: 'identity-info',   platformSource: 'IdentityInfo' },
  ],
}

const SPLUNK_ADAPTER: SiemAdapter = {
  id: 'splunk',
  name: 'Splunk',
  queryLanguage: 'SPL',
  renderQuery: renderSplunk,
  getFieldMappings: (): FieldMapping[] => [
    { neutral: 'timestamp', platformField: '_time' },
    { neutral: 'user',      platformField: 'user' },
    { neutral: 'host',      platformField: 'host / src_host' },
    { neutral: 'ip',        platformField: 'src_ip / dest_ip' },
    { neutral: 'process',   platformField: 'process' },
  ],
  getSupportedSources: (): SourceDefinition[] => [
    { neutralName: 'sign-in-logs',    platformSource: 'index=identity sourcetype=azure:signin' },
    { neutralName: 'process-events',  platformSource: 'index=edr' },
    { neutralName: 'network-events',  platformSource: 'index=network' },
    { neutralName: 'security-events', platformSource: 'index=windows sourcetype=WinEventLog:Security' },
    { neutralName: 'identity-info',   platformSource: 'identity lookup' },
  ],
}

const ELASTIC_ADAPTER: SiemAdapter = {
  id: 'elastic',
  name: 'Elastic',
  queryLanguage: 'ESQL',
  renderQuery: renderElastic,
  getFieldMappings: (): FieldMapping[] => [
    { neutral: 'timestamp', platformField: '@timestamp' },
    { neutral: 'user',      platformField: 'user.name / user.email' },
    { neutral: 'host',      platformField: 'host.name' },
    { neutral: 'ip',        platformField: 'source.ip / destination.ip' },
    { neutral: 'process',   platformField: 'process.name' },
  ],
  getSupportedSources: (): SourceDefinition[] => [
    { neutralName: 'sign-in-logs',    platformSource: 'signin-logs' },
    { neutralName: 'process-events',  platformSource: 'endpoint-events' },
    { neutralName: 'network-events',  platformSource: 'network-events' },
    { neutralName: 'security-events', platformSource: 'security-events' },
    { neutralName: 'identity-info',   platformSource: 'identity-info' },
  ],
}

const ADAPTERS: Record<SiemPlatform, SiemAdapter> = {
  sentinel: SENTINEL_ADAPTER,
  splunk:   SPLUNK_ADAPTER,
  elastic:  ELASTIC_ADAPTER,
}

export function getAdapter(platform: SiemPlatform): SiemAdapter {
  return ADAPTERS[platform]
}

export function renderQuery(plan: QueryPlan, platform: SiemPlatform): RenderedQuery {
  return ADAPTERS[platform].renderQuery(plan)
}
