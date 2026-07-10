import type { MockAlert } from '../types/alerts'

/**
 * Alert-type-specific recommended investigation steps for the single-alert detail view.
 *
 * These are richer and more concrete than the disposition-based next actions the batch
 * engine produces — they key on the detection rule / entity to guide "what do I do next".
 * Nothing here auto-runs; every item is a suggestion the analyst chooses to act on.
 */
export function getAlertNextActions(alert: MockAlert): string[] {
  const r = alert.detectionRule.toLowerCase()
  const name = alert.name.toLowerCase()
  const e = alert.entity
  const k = `${r} ${name}`

  if (k.includes('impossible') || k.includes('travel')) {
    return [
      'Link to active case or create a new investigation',
      `Run failed sign-ins for ${e}`,
      'Review MFA / conditional access status',
      `Build a user timeline for ${e}`,
      `Map the blast radius for ${e}`,
      'Save as a pinned finding',
    ]
  }
  if (k.includes('credential') || k.includes('dump') || k.includes('lsass')) {
    return [
      'Link to or open a case',
      `Run process activity query on ${e}`,
      'Hunt LSASS access / credential dumping',
      'Isolate the host if confirmed (containment — separate from triage)',
      `Build a host timeline for ${e}`,
      'Save as a pinned finding',
    ]
  }
  if (k.includes('encoded') || k.includes('powershell')) {
    return [
      `Run process activity query on ${e}`,
      'Review the full command line',
      'Check the parent process',
      'Hunt related script execution across hosts',
      'Create a detection rule if the pattern repeats',
    ]
  }
  if (k.includes('oauth') || k.includes('consent')) {
    return [
      'Review the app consent grant',
      'Check the app publisher / reputation',
      `Verify ${e} actually approved the app`,
      'Revoke the app if malicious',
      'Tune the rule if benign',
    ]
  }
  if (k.includes('lateral') || k.includes('smb')) {
    return [
      'Link to or open a case',
      `Run logon/SMB session query for ${e}`,
      'Identify source and destination hosts',
      `Build a host timeline for ${e}`,
      'Map the blast radius across reachable hosts',
    ]
  }
  if (k.includes('c2') || k.includes('beacon') || k.includes('outbound')) {
    return [
      `Run outbound network query for ${e}`,
      'Check the remote IP / domain reputation',
      'Identify the beaconing process',
      'Block the destination if malicious (containment — separate from triage)',
      'Hunt the same indicator across the fleet',
    ]
  }
  if (k.includes('privesc') || k.includes('priv') || k.includes('token') || k.includes('privilege')) {
    return [
      `Review privilege/token events for ${e}`,
      'Check for new admin group membership',
      `Build a host timeline for ${e}`,
      'Verify against change-management records',
      'Save as a pinned finding',
    ]
  }
  if (k.includes('geo') || k.includes('anomaly') || k.includes('country')) {
    return [
      `Run recent sign-ins for ${e}`,
      'Correlate with the user’s travel / calendar',
      'Check whether a VPN or proxy explains the geography',
      'Review MFA status',
      'Keep open or mark Investigating pending review',
    ]
  }
  if (k.includes('mfa') || k.includes('spray')) {
    return [
      `Run failed authentication query for ${e}`,
      'Check the source IPs for spray patterns',
      'Confirm whether MFA ultimately succeeded',
      'Advise a password reset if suspicious',
      'Tune the rule if this is a known noisy source',
    ]
  }
  if ((k.includes('new') && (k.includes('service') || k.includes('account'))) || k.includes('account created')) {
    return [
      'Verify the account was authorized / change-managed',
      'Check who created it and from where',
      'Review the permissions granted',
      'Disable the account if unauthorized (containment — separate from triage)',
      'Add a note with the rationale',
    ]
  }
  if (k.includes('password') || k.includes('reset')) {
    return [
      `Confirm ${e} initiated the reset`,
      'Check for other indicators around the same time',
      'Mark False Positive if benign',
      'Add a note explaining the rationale',
    ]
  }
  if (k.includes('port') || k.includes('nonstandard')) {
    return [
      `Identify the process using the non-standard port on ${e}`,
      'Check the destination reputation',
      'Confirm whether it is known legitimate software',
      'Suppress or tune if benign',
    ]
  }
  if (k.includes('suspicious') || k.includes('signin')) {
    return [
      `Run recent sign-ins for ${e}`,
      'Corroborate with related entities',
      'Compare against baseline behavior',
      'Keep open or mark Investigating pending review',
    ]
  }

  // Default
  return [
    `Run a scoped query for ${e} activity`,
    'Check related entities for corroborating activity',
    'Compare against baseline behavior',
    'Link to a case if this warrants investigation',
    'Add a note with your assessment',
  ]
}
