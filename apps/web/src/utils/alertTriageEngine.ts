import type {
  MockAlert,
  AlertStatus,
  AlertTriageScope,
  AlertTriageScopeType,
  EnrichedTriageVerdict,
  ClientTriageResult,
  TriageDisposition,
} from '../types/alerts'
import { MOCK_NOW } from './mockClock'

// ──────────────────────────────────────────────────────────
// Scoring rules keyed on detection rule name patterns
// ──────────────────────────────────────────────────────────

interface RuleScore {
  tp: number
  fp: number
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  influencing: string[]
}

function scoreByRule(rule: string, alert: MockAlert): RuleScore {
  const r = rule.toLowerCase()

  if (r.includes('impossible') || r.includes('travel')) {
    return {
      tp: 90, fp: 5, confidence: 'high',
      reasoning: `Impossible travel alerts have a very high true-positive rate. ${alert.entity} logged in from two distant locations within an implausible timeframe.`,
      influencing: ['detectionRule', 'entity', 'riskScore'],
    }
  }
  if (r.includes('credential') || r.includes('dump') || r.includes('lsass')) {
    return {
      tp: 88, fp: 7, confidence: 'high',
      reasoning: `LSASS access or credential dumping behavior detected on ${alert.entity}. High specificity rule with low false-positive rate.`,
      influencing: ['detectionRule', 'sourceTable', 'riskScore'],
    }
  }
  if (r.includes('c2') || r.includes('beacon') || r.includes('outbound')) {
    return {
      tp: 82, fp: 10, confidence: 'high',
      reasoning: `Outbound C2 beacon pattern on ${alert.entity}. Periodic beaconing interval matched known C2 profiles.`,
      influencing: ['detectionRule', 'entity', 'techniques'],
    }
  }
  if (r.includes('lateral') || r.includes('smb')) {
    return {
      tp: 79, fp: 14, confidence: 'high',
      reasoning: `Lateral movement via SMB from ${alert.entity}. Rare in legitimate workflows; corroborated by related alerts.`,
      influencing: ['detectionRule', 'relatedEntities', 'tactics'],
    }
  }
  if (r.includes('privesc') || r.includes('priv') || r.includes('token') || r.includes('privilege')) {
    return {
      tp: 76, fp: 16, confidence: 'high',
      reasoning: `Privilege escalation behavior detected. ${alert.entity} acquired elevated token privileges outside normal maintenance windows.`,
      influencing: ['detectionRule', 'sourceTable', 'tactics'],
    }
  }
  if (r.includes('encoded') || r.includes('powershell')) {
    return {
      tp: 68, fp: 22, confidence: 'medium',
      reasoning: `Base64-encoded PowerShell on ${alert.entity}. Legitimate scripts exist but this pattern warrants review.`,
      influencing: ['detectionRule', 'sourceTable'],
    }
  }
  if (r.includes('geo') || r.includes('anomaly') || r.includes('country')) {
    return {
      tp: 65, fp: 28, confidence: 'medium',
      reasoning: `Login from an unusual geography for ${alert.entity}. Could be VPN or travel — correlate with user's calendar.`,
      influencing: ['detectionRule', 'entity', 'confidence'],
    }
  }
  if (r.includes('mfa') || r.includes('spray')) {
    return {
      tp: 42, fp: 48, confidence: 'medium',
      reasoning: `MFA failures on ${alert.entity}. Could be a forgotten password or a spray attempt — severity is medium.`,
      influencing: ['detectionRule', 'entity'],
    }
  }
  if (r.includes('oauth') || r.includes('consent')) {
    return {
      tp: 38, fp: 52, confidence: 'medium',
      reasoning: `OAuth consent grant by ${alert.entity}. Legitimate app onboarding is common; review app reputation.`,
      influencing: ['detectionRule', 'entity', 'tactics'],
    }
  }
  if (r.includes('new') && (r.includes('service') || r.includes('account'))) {
    return {
      tp: 30, fp: 62, confidence: 'medium',
      reasoning: `New service account created. Verify this was authorized change-managed work.`,
      influencing: ['detectionRule', 'entity'],
    }
  }
  if (r.includes('password') || r.includes('reset')) {
    return {
      tp: 22, fp: 72, confidence: 'high',
      reasoning: `Password reset anomaly — ${alert.entity}. Usually benign; only escalate if combined with other indicators.`,
      influencing: ['detectionRule', 'confidence'],
    }
  }
  if (r.includes('suspicious') || r.includes('signin')) {
    return {
      tp: 28, fp: 65, confidence: 'low',
      reasoning: `Suspicious sign-in from ${alert.entity}. Low-fidelity catch-all rule; requires corroboration before escalating.`,
      influencing: ['detectionRule', 'riskScore'],
    }
  }
  if (r.includes('port') || r.includes('nonstandard')) {
    return {
      tp: 20, fp: 72, confidence: 'low',
      reasoning: `Non-standard port usage on ${alert.entity}. Often legitimate software (e.g. custom apps, game clients); low priority.`,
      influencing: ['detectionRule', 'sourceTable'],
    }
  }

  // Default fallback
  return {
    tp: 45, fp: 45, confidence: 'low',
    reasoning: `Generic indicator from ${alert.entity}. No strong scoring signal — review manually.`,
    influencing: ['detectionRule'],
  }
}

function disposition(tp: number, fp: number): TriageDisposition {
  if (tp >= 70) return 'likely_tp'
  if (fp >= 70) return 'likely_fp'
  return 'uncertain'
}

function suggestStatus(alert: MockAlert, tp: number, fp: number): AlertStatus {
  if (alert.status !== 'open') return alert.status
  if (tp >= 70) return 'investigating'
  if (fp >= 70) return 'false_positive'
  return 'open'
}

function recommendAction(disp: TriageDisposition, status: AlertStatus): string {
  if (status !== 'open') return 'Already actioned — no change recommended.'
  switch (disp) {
    case 'likely_tp':  return 'Escalate to investigation and assign an analyst.'
    case 'likely_fp':  return 'Suppress or tune the detection rule to reduce noise.'
    case 'uncertain':
    default:           return 'Manual review — gather more context before deciding.'
  }
}

/**
 * Ordered investigation-guidance suggestions per disposition. These are recommendations
 * for the analyst — nothing here auto-runs, and nothing auto-closes/suppresses. Triage
 * classifies and routes; remediation stays a separate, explicit analyst decision.
 */
function recommendedNextActions(alert: MockAlert, disp: TriageDisposition): string[] {
  const e = alert.entity
  if (disp === 'likely_tp') {
    return [
      `Build a timeline for ${e}`,
      `Map the blast radius for ${e}`,
      `Run a scoped query for ${e} activity`,
      'Link to the active case (or open a new investigation)',
      'Assign an owner and mark Investigating',
      'Save the key indicator as a pinned finding',
    ]
  }
  if (disp === 'likely_fp') {
    return [
      'Mark False Positive (after a quick sanity check)',
      `Suppress similar ${alert.detectionRule} alerts`,
      'Tune the detection rule threshold',
      'Add a note explaining the rationale',
      'Do not close automatically — requires analyst approval',
    ]
  }
  // uncertain
  return [
    `Run an enrichment query for ${e}`,
    'Check related entities for corroborating activity',
    'Compare against baseline behavior',
    'Review similar recent alerts',
    'Keep open or mark Investigating pending review',
  ]
}

// ──────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────

export function detectTriageScope(text: string): AlertTriageScopeType | null {
  const t = text.toLowerCase().trim()
  if (!t.includes('triage')) return null
  if (t.includes('selected')) return 'selected'
  if (t.includes('visible')) return 'visible_open'
  return 'all_open'
}

export function triageAlerts(
  alerts: MockAlert[],
  scopeType: AlertTriageScopeType,
): ClientTriageResult {
  const start = Date.now()

  const scopeLabel: Record<AlertTriageScopeType, string> = {
    all_open: 'All Open Alerts',
    visible_open: 'Visible Open Alerts',
    selected: 'Selected Alerts',
  }

  const verdicts: EnrichedTriageVerdict[] = alerts
    .map((alert) => {
      const score = scoreByRule(alert.detectionRule, alert)
      const disp = disposition(score.tp, score.fp)
      return {
        alert_id: alert.id,
        alertName: alert.name,
        severity: alert.severity,
        entity: alert.entity,
        entityType: alert.entityType,
        currentStatus: alert.status,
        tp_probability: score.tp,
        fp_probability: score.fp,
        confidence: score.confidence,
        reasoning: score.reasoning,
        influencing_fields: score.influencing,
        suggestedStatus: suggestStatus(alert, score.tp, score.fp),
        triageDisposition: disp,
        recommendedAction: recommendAction(disp, alert.status),
        recommendedNextActions: recommendedNextActions(alert, disp),
      }
    })
    // Rank by risk (true-positive probability) descending so the top of the list is
    // the highest-priority work — panels show "top N by risk" from this ordering.
    .sort((a, b) => b.tp_probability - a.tp_probability)

  const likely_tp = verdicts.filter((v) => v.triageDisposition === 'likely_tp').length
  const likely_fp = verdicts.filter((v) => v.triageDisposition === 'likely_fp').length
  const uncertain = verdicts.filter((v) => v.triageDisposition === 'uncertain').length

  const scope: AlertTriageScope = {
    scope: scopeType,
    scopeLabel: scopeLabel[scopeType],
    totalInScope: alerts.length,
    processedCount: verdicts.length,
    isMockMode: true,
  }

  return {
    handler: 'triage',
    scope,
    verdicts,
    total_alerts: verdicts.length,
    likely_tp,
    likely_fp,
    uncertain,
    duration_ms: Date.now() - start || 42,
  }
}

// ──────────────────────────────────────────────────────────
// Apply triage decisions to the alert store
// Returns map of alert_id → new status for applyStatusChange
// ──────────────────────────────────────────────────────────
export function buildStatusChanges(
  result: ClientTriageResult,
): { investigating: string[]; false_positive: string[] } {
  const investigating: string[] = []
  const false_positive: string[] = []
  for (const v of result.verdicts) {
    if (v.suggestedStatus === 'investigating') investigating.push(v.alert_id)
    else if (v.suggestedStatus === 'false_positive') false_positive.push(v.alert_id)
  }
  return { investigating, false_positive }
}

// Unused export — keeps the mock timestamp import visible to bundler
export { MOCK_NOW as _ENGINE_MOCK_NOW }
