import { useState } from 'react'

interface ReportRow {
  id: string
  title: string
  variant: string
  generated: string
  pages: number
  status: string
}

interface Props {
  report: ReportRow
  onBack: () => void
}

const VARIANT_CONFIG: Record<string, { color: string; accent: string; label: string }> = {
  executive:  { color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',       accent: 'bg-cyan-500/70',   label: 'Executive' },
  technical:  { color: 'text-blue-400 border-blue-500/40 bg-blue-500/10',       accent: 'bg-blue-500/70',   label: 'Technical' },
  handoff:    { color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',    accent: 'bg-amber-500/70',  label: 'Handoff' },
  regulatory: { color: 'text-purple-400 border-purple-500/40 bg-purple-500/10', accent: 'bg-purple-500/70', label: 'Regulatory' },
}

const MOCK_SECTIONS: Record<string, Array<{ heading: string; body: string }>> = {
  executive: [
    {
      heading: 'Executive Summary',
      body: `On May 10, 2026, the Security Operations Center identified a high-confidence account compromise of jsmith@corp.com. The attacker leveraged stolen credentials obtained via phishing to establish initial access, escalated privileges on two endpoints, and attempted lateral movement toward the finance domain controller.\n\nAll malicious activity was contained within 4 hours of initial detection. No data exfiltration was confirmed.`,
    },
    {
      heading: 'Business Impact',
      body: `• 2 endpoints isolated for forensic imaging\n• 1 user account suspended and password reset\n• Finance domain controller access attempt was blocked\n• Estimated containment cost: 6 analyst-hours\n• No customer data or regulatory data was accessed`,
    },
    {
      heading: 'Recommended Actions',
      body: `1. Enforce MFA on all privileged accounts by 2026-05-17\n2. Deploy conditional access policy blocking logins from high-risk geolocations\n3. Schedule quarterly tabletop exercise for lateral movement scenarios`,
    },
  ],
  technical: [
    {
      heading: 'Indicators of Compromise',
      body: `User: jsmith@corp.com\nHosts: DESKTOP-001, DESKTOP-042\nIPs: 185.220.101.45 (C2, AS12345 DigitalOcean RU)\nHashes: d3b07384d113edec49eaa6238ad5ff00 (lsass.dmp)\nTechniques: T1078 (Valid Accounts), T1003.001 (LSASS Memory), T1550.002 (Pass-the-Hash), T1021.002 (SMB/Windows Admin Shares)`,
    },
    {
      heading: 'Attack Chain',
      body: `T+0:00 — jsmith@corp.com credential phished via spearphishing link\nT+0:15 — Initial login from 185.220.101.45 (RU) to Azure AD\nT+1:22 — Privilege escalation on DESKTOP-001 (EventID 4672)\nT+1:37 — lsass.exe CreateRemoteThread — credential dump\nT+2:10 — Pass-the-hash lateral movement attempt toward DC-01\nT+4:00 — DESKTOP-001 and DESKTOP-042 isolated\nT+4:05 — jsmith@corp.com account suspended`,
    },
    {
      heading: 'Detection Gaps',
      body: `1. No alert fired on impossible travel (US→RU in 29 minutes) — rule existed but was suppressed as noisy\n2. lsass CreateRemoteThread generated a low-fidelity alert rated P3 — should be P1\n3. No alert for Pass-the-Hash pattern (T1550.002) — detection rule missing`,
    },
    {
      heading: 'Remediation',
      body: `• Reset jsmith@corp.com credentials and revoke all active sessions ✓\n• Isolate DESKTOP-001 for forensic imaging ✓\n• Patch KB5023696 missing on DESKTOP-042 — scheduled 2026-05-12\n• Deploy Attack Surface Reduction rule blocking lsass process memory reads\n• Create detection rule for T1550.002 (Pass-the-Hash via SMB)`,
    },
  ],
  handoff: [
    {
      heading: 'Shift Summary',
      body: `Shift: May 10 Morning (06:00–14:00)\nAnalyst: SOC-L2\nAlerts processed: 47\nIncidents created: 1 (INV-2026-0142 — jsmith account compromise)\nEscalations: 0`,
    },
    {
      heading: 'Open Items',
      body: `[CRITICAL] INV-2026-0142 — jsmith@corp.com account compromise\n  → DESKTOP-001 isolation complete; forensic imaging in progress\n  → Awaiting memory image from DESKTOP-042\n\n[HIGH] Alert storm: GeoAnomalyLogin fired 312 times in 4h\n  → Suppression rule in place, noise coaching session scheduled`,
    },
    {
      heading: 'Watch List',
      body: `• DC-01 — monitor for any additional authentication from jsmith credentials\n• 185.220.101.45 — C2 IP, watch for new outbound connections from other hosts\n• jsmith@corp.com — account suspended; watch for reset attempts`,
    },
  ],
  regulatory: [
    {
      heading: 'Scope',
      body: `Reporting period: Q1 2026 (2026-01-01 to 2026-03-31)\nFramework: SOC 2 Type II, NIST CSF\nReviewed by: SOC Lead, Legal\nAudit trail: All log retention policies compliant with 90-day minimum`,
    },
    {
      heading: 'Control Status',
      body: `CC6.1 — Logical Access Controls: COMPLIANT\nCC6.2 — User Registration and Deprovisioning: COMPLIANT\nCC6.7 — Transmission Integrity: COMPLIANT\nCC7.2 — System Monitoring: PARTIAL — see Finding RF-001\nCC8.1 — Change Management: COMPLIANT`,
    },
    {
      heading: 'Findings',
      body: `RF-001 (Medium): GeoAnomalyLogin detection rule suppressed for 47 days without documented justification. Remediated 2026-04-02.\n\nRF-002 (Low): 3 service accounts had passwords older than 180 days at time of review. All rotated 2026-01-15.`,
    },
    {
      heading: 'Attestation',
      body: `All controls listed above were tested and evaluated for the period 2026-01-01 to 2026-03-31. No material weaknesses were identified. Two findings (RF-001, RF-002) were remediated within the reporting period.`,
    },
  ],
}

export function ReportDetailPanel({ report, onBack }: Props) {
  const [copied, setCopied] = useState(false)
  const cfg = VARIANT_CONFIG[report.variant] ?? VARIANT_CONFIG.technical
  const sections = MOCK_SECTIONS[report.variant] ?? MOCK_SECTIONS.technical

  const fullText = sections.map((s) => `## ${s.heading}\n\n${s.body}`).join('\n\n---\n\n')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div data-testid="report-detail-panel" className="rounded-xl border border-gray-700/60 bg-gray-900/70 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700/50 bg-gray-900/60 flex-wrap gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors shrink-0"
          >
            ← Reports
          </button>
          <span className="text-gray-700 text-[11px]">·</span>
          <div className={`w-1.5 h-5 rounded-full ${cfg.accent} shrink-0`} />
          <span className="text-sm font-semibold text-white tracking-tight truncate">{report.title}</span>
          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-mono shrink-0 ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-gray-600 font-mono">{report.id}</span>
          <span className="text-gray-700 text-[10px]">·</span>
          <span className="text-[10px] text-gray-500">{report.generated}</span>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {sections.map((section, i) => (
          <div key={i} className="rounded-lg bg-gray-800/30 border border-gray-700/40 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-700/40 bg-gray-800/50 flex items-center gap-2">
              <div className={`w-0.5 h-3.5 rounded-full ${cfg.accent}`} />
              <h4 className="text-sm font-semibold text-gray-200">{section.heading}</h4>
            </div>
            <div className="px-4 py-3.5">
              <pre className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
                {section.body}
              </pre>
            </div>
          </div>
        ))}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-800/60">
          <button
            onClick={handleCopy}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-700/60 text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors"
          >
            {copied ? 'Copied ✓' : 'Copy Markdown'}
          </button>
          <button
            onClick={onBack}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-700/60 text-gray-600 hover:text-gray-400 transition-colors"
          >
            ← Back to list
          </button>
        </div>
      </div>
    </div>
  )
}
