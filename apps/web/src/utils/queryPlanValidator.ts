import type { QueryPlan, QueryPlanIntent, RenderedQuery, ValidationCheck, ValidationResult } from '../types/queryPlan'

function checkIntentConditions(intent: QueryPlanIntent, rendered: RenderedQuery): ValidationCheck {
  const q = rendered.query
  const name = 'Intent conditions'
  switch (intent) {
    case 'failed_logins': {
      const ok = /ResultType\s*!=\s*0|result_type!=0|result\.type\s*!=\s*0/i.test(q)
      return { name, passed: ok, detail: ok ? 'Failure filter present' : 'Missing failure result filter' }
    }
    case 'suspicious_powershell': {
      const ok = /powershell/i.test(q)
      return { name, passed: ok, detail: ok ? 'PowerShell filter present' : 'Missing PowerShell filter' }
    }
    case 'local_admin_creation': {
      const ok = /4720|4728/.test(q)
      return { name, passed: ok, detail: ok ? 'Event IDs 4720/4728 present' : 'Missing event ID 4720 or 4728' }
    }
    case 'identity_inventory': {
      const ok = /IdentityInfo|user_inventory|identity-info/i.test(q)
      return { name, passed: ok, detail: ok ? 'Identity source present' : 'Missing identity data source' }
    }
    default:
      return { name, passed: true, detail: 'No specific conditions required' }
  }
}

export function validateRenderedQuery(plan: QueryPlan, rendered: RenderedQuery): ValidationResult {
  const checks: ValidationCheck[] = []

  // Entity scope preserved
  const entityCheck: ValidationCheck = { name: 'Entity scope', passed: true, detail: 'No entities to scope' }
  if (plan.entities.length > 0) {
    const missing = plan.entities.filter(
      (e) => !rendered.query.toLowerCase().includes(e.value.toLowerCase()),
    )
    entityCheck.passed = missing.length === 0
    entityCheck.detail = missing.length === 0
      ? `${plan.entities.length} entity/entities included`
      : `Missing: ${missing.map((e) => e.value).join(', ')}`
  }
  checks.push(entityCheck)

  // Time range preserved
  const timeCheck: ValidationCheck = { name: 'Time range', passed: true, detail: 'No time filter' }
  if (plan.timeRange.value !== 'all') {
    const n = plan.timeRange.value.replace(/[a-z]/gi, '')
    const ok = rendered.query.includes(n)
    timeCheck.passed = ok
    timeCheck.detail = ok ? plan.timeRange.display : `Time range (${plan.timeRange.display}) not found in query`
  }
  checks.push(timeCheck)

  // Source selected
  const sourceCheck: ValidationCheck = {
    name: 'Source selected',
    passed: rendered.sourceName.length > 0,
    detail: rendered.sourceName || 'No source specified',
  }
  checks.push(sourceCheck)

  // Intent-specific conditions
  checks.push(checkIntentConditions(plan.intent, rendered))

  const warnings = checks.filter((c) => !c.passed).map((c) => c.detail ?? c.name)
  return { passed: warnings.length === 0, warnings, checks }
}
