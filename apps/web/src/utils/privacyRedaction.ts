import type { AiContextBundle, AiContextItem, AiPrivacyFinding, AiRedactionPolicy } from '../types/aiOrchestration'

const EMAIL_RE    = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
const IP_RE       = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g
const HOSTNAME_RE = /\b(?:DESKTOP|SERVER|WORKSTATION|DC|LAPTOP|MOBILE)-[A-Z0-9]{2,}\b/gi
const HASH_RE     = /\b[0-9a-fA-F]{64}\b/g
const ENCODED_CMD_RE = /-EncodedCommand\s+[A-Za-z0-9+/=]{20,}/g

function detectAndRedact(
  text: string,
  policy: AiRedactionPolicy,
): { result: string; findings: AiPrivacyFinding[] } {
  if (policy !== 'redact_sensitive') return { result: text, findings: [] }

  const findings: AiPrivacyFinding[] = []
  let result = text

  result = result.replace(EMAIL_RE, (m) => {
    findings.push({ type: 'email', value: m, replacement: '[EMAIL]' })
    return '[EMAIL]'
  })

  result = result.replace(HASH_RE, (m) => {
    findings.push({ type: 'hash', value: m, replacement: '[HASH]' })
    return '[HASH]'
  })

  result = result.replace(ENCODED_CMD_RE, (m) => {
    findings.push({ type: 'command_line', value: m, replacement: '[ENCODED_CMD]' })
    return '[ENCODED_CMD]'
  })

  result = result.replace(IP_RE, (m) => {
    findings.push({ type: 'ip', value: m, replacement: '[IP]' })
    return '[IP]'
  })

  result = result.replace(HOSTNAME_RE, (m) => {
    findings.push({ type: 'hostname', value: m, replacement: '[HOST]' })
    return '[HOST]'
  })

  return { result, findings }
}

export function applyRedactionToBundle(
  bundle: AiContextBundle,
): { bundle: AiContextBundle; findings: AiPrivacyFinding[] } {
  if (bundle.policy !== 'redact_sensitive') return { bundle, findings: [] }

  const allFindings: AiPrivacyFinding[] = []
  const redactedItems: AiContextItem[] = bundle.items.map((item) => {
    const { result, findings } = detectAndRedact(item.summary, bundle.policy)
    allFindings.push(...findings)
    return { ...item, summary: result, redacted: findings.length > 0 }
  })

  return {
    bundle: { ...bundle, items: redactedItems, redactionCount: allFindings.length },
    findings: allFindings,
  }
}
