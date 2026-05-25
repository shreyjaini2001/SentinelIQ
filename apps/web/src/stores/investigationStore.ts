import { create } from 'zustand'
import type { Investigation, Turn, Artifact, Note } from '../types/investigation'

const FIXTURE: Investigation[] = [
  {
    id: 'INV-001',
    title: 'jsmith Account Compromise',
    status: 'active',
    severity: 'critical',
    owner: 'analyst_1',
    created_at: '2026-05-10T08:23:00Z',
    updated_at: '2026-05-10T08:45:00Z',
    entities: ['jsmith@corp.com', '185.220.101.5', 'DESKTOP-42', 'SERVER-DC01'],
    alerts: ['ALT-001', 'ALT-002', 'ALT-003', 'ALT-004'],
    reviewedEntityNodeIds: [],
    turns: [
      {
        id: 'TRN-001',
        user_text: 'Show me failed logins for jsmith in the last 24 hours',
        mode: 'query',
        created_at: '2026-05-10T08:23:00Z',
        result_summary: 'KQL: SigninLogs | where UserPrincipalName == "jsmith@corp.com"',
        artifact_ids: ['ART-001'],
      },
      {
        id: 'TRN-002',
        user_text: 'Build a timeline for jsmith@corp.com',
        mode: 'action',
        created_at: '2026-05-10T08:30:00Z',
        result_summary: 'Timeline: 12 events across 4 kill-chain stages',
        artifact_ids: ['ART-002'],
      },
      {
        id: 'TRN-003',
        user_text: 'What is the blast radius if jsmith is compromised?',
        mode: 'action',
        created_at: '2026-05-10T08:40:00Z',
        result_summary: 'Blast radius: 18 assets reachable, risk score 8.4/10',
        artifact_ids: ['ART-003'],
      },
    ],
    artifacts: [
      {
        id: 'ART-001',
        type: 'query',
        title: 'SigninLogs — jsmith failed logins',
        created_at: '2026-05-10T08:23:00Z',
        data: { kql: 'SigninLogs | where UserPrincipalName == "jsmith@corp.com" | where ResultType != 0' },
        pinned: true,
      },
      {
        id: 'ART-002',
        type: 'timeline',
        title: 'jsmith account timeline',
        created_at: '2026-05-10T08:30:00Z',
        data: { timeline_id: 'TML-mock-001', total_events: 12, seed_entity: 'jsmith@corp.com' },
        pinned: true,
      },
      {
        id: 'ART-003',
        type: 'blast_radius',
        title: 'Blast radius — jsmith@corp.com',
        created_at: '2026-05-10T08:40:00Z',
        data: { blast_id: 'BLR-mock-001', risk_score: 8.4, total_reachable_assets: 18 },
        pinned: false,
      },
      {
        id: 'ART-005',
        type: 'query_result',
        title: 'Query Result — SigninLogs jsmith failed logins',
        created_at: '2026-05-10T08:23:30Z',
        data: {
          columns: ['TimeGenerated', 'UserPrincipalName', 'IPAddress', 'Location', 'ResultType', 'AppDisplayName'],
          rows: [
            ['2026-05-10 08:23', 'jsmith@corp.com', '185.220.101.5', 'RU / Moscow', '50126', 'Microsoft 365'],
            ['2026-05-10 08:21', 'jsmith@corp.com', '185.220.101.5', 'RU / Moscow', '50126', 'Azure Portal'],
            ['2026-05-10 08:19', 'jsmith@corp.com', '185.220.101.5', 'RU / Moscow', '50053', 'Microsoft 365'],
          ],
          rowCount: 3,
          queryTimeMs: 342,
          sourceTable: 'SigninLogs',
          extractedEntities: [
            { type: 'user', value: 'jsmith@corp.com' },
            { type: 'ip', value: '185.220.101.5' },
            { type: 'country', value: 'Russia' },
          ],
        },
        pinned: true,
      },
      {
        id: 'ART-006',
        type: 'query_result',
        title: 'Query Result — DeviceNetworkEvents lateral movement',
        created_at: '2026-05-10T08:45:00Z',
        data: {
          columns: ['TimeGenerated', 'DeviceName', 'RemoteIP', 'RemotePort', 'Protocol', 'BytesSent', 'ActionType'],
          rows: [
            ['2026-05-10 06:58', 'SERVER-DC01',   '185.220.101.5', '80',   'TCP', '2108000', 'ConnectionSuccess'],
            ['2026-05-10 04:30', 'DESKTOP-42',    '203.0.113.42',  '4444', 'TCP', '88000',   'ConnectionSuccess'],
          ],
          rowCount: 2,
          queryTimeMs: 198,
          sourceTable: 'DeviceNetworkEvents',
          extractedEntities: [
            { type: 'host', value: 'SERVER-DC01' },
            { type: 'host', value: 'DESKTOP-42' },
            { type: 'ip', value: '185.220.101.5' },
            { type: 'ip', value: '203.0.113.42' },
          ],
        },
        pinned: false,
      },
      {
        id: 'ART-007',
        type: 'query_result',
        title: 'Query Result — DeviceProcessEvents DESKTOP-42 & SERVER-DC01',
        created_at: '2026-05-10T08:52:00Z',
        data: {
          columns: ['TimeGenerated', 'DeviceName', 'AccountName', 'FileName', 'ProcessCommandLine', 'SHA256'],
          rows: [
            ['2026-05-10 06:12', 'DESKTOP-42',  'jsmith',    'powershell.exe', '-EncodedCommand aQBmACAoAC...',            'a1b2c3d4e5f6...'],
            ['2026-05-10 05:45', 'DESKTOP-42',  'jsmith',    'cmd.exe',        '/c whoami && net user',                   'e5f6a7b8c9d0...'],
            ['2026-05-10 04:31', 'SERVER-DC01', 'admin-svc', 'powershell.exe', '-ExecutionPolicy Bypass -File run.ps1',   'c9d0e1f2a3b4...'],
          ],
          rowCount: 3,
          queryTimeMs: 265,
          sourceTable: 'DeviceProcessEvents',
          extractedEntities: [
            { type: 'host',    value: 'DESKTOP-42'     },
            { type: 'host',    value: 'SERVER-DC01'    },
            { type: 'user',    value: 'jsmith'         },
            { type: 'user',    value: 'admin-svc'      },
            { type: 'process', value: 'powershell.exe' },
            { type: 'process', value: 'cmd.exe'        },
          ],
        },
        pinned: true,
      },
    ],
    pinned_findings: [
      'jsmith signed in from Moscow (185.220.101.5) 3× in 4 minutes — impossible travel confirmed',
      'Credential stuffing pattern: 50126 errors → successful sign-in at 08:23',
      'Lateral movement: DESKTOP-42 → SERVER-DC01 via SMB within 45 minutes of initial auth',
    ],
    notes: [
      {
        id: 'NOT-001',
        content: 'Called jsmith — confirmed no travel to Russia. Account is likely compromised. Escalating to Tier 2.',
        created_at: '2026-05-10T08:50:00Z',
        author: 'analyst_1',
      },
    ],
    generated_reports: [],
  },
  {
    id: 'INV-002',
    title: 'LAPSUS$ TTP Hunt — May 2026',
    status: 'active',
    severity: 'high',
    owner: 'analyst_2',
    created_at: '2026-05-09T14:30:00Z',
    updated_at: '2026-05-09T17:15:00Z',
    entities: ['admin-svc', 'SERVER-DC01', 'WORKSTATION-07'],
    alerts: ['ALT-005', 'ALT-006', 'ALT-007', 'ALT-008', 'ALT-009', 'ALT-010', 'ALT-011'],
    reviewedEntityNodeIds: [],
    turns: [
      {
        id: 'TRN-004',
        user_text: 'Hunt for LAPSUS$ TTPs in the last 7 days',
        mode: 'action',
        created_at: '2026-05-09T14:30:00Z',
        result_summary: 'Hunt: 4/7 LAPSUS$ techniques with evidence',
        artifact_ids: ['ART-004'],
      },
    ],
    artifacts: [
      {
        id: 'ART-004',
        type: 'hunt',
        title: 'LAPSUS$ hunt — 7-day window',
        created_at: '2026-05-09T14:30:00Z',
        data: { hunt_id: 'HNT-mock-001', techniques_with_evidence: 4, techniques_queried: 7 },
        pinned: false,
      },
    ],
    pinned_findings: [
      'T1078 (Valid Accounts) confirmed — admin-svc used from unexpected host',
    ],
    notes: [],
    generated_reports: [],
  },
]

interface InvestigationState {
  investigations: Investigation[]
  activeInvestigationId: string | null

  createInvestigation: (title: string, severity: Investigation['severity']) => string
  openInvestigation: (id: string) => void
  closeActiveInvestigation: () => void
  addTurn: (turn: Omit<Turn, 'id' | 'created_at'>) => void
  addArtifact: (artifact: Omit<Artifact, 'id' | 'created_at' | 'pinned'>) => string
  togglePin: (artifactId: string) => void
  addNote: (content: string) => void
  addPinnedFinding: (finding: string) => void
  removePinnedFindingFrom: (invId: string, finding: string) => void
  toggleReviewedEntity: (invId: string, nodeId: string) => void
}

export const useInvestigationStore = create<InvestigationState>((set, get) => ({
  investigations: FIXTURE,
  activeInvestigationId: 'INV-001',

  createInvestigation: (title, severity) => {
    const id = `INV-${Date.now()}`
    const now = new Date().toISOString()
    const inv: Investigation = {
      id, title, severity, status: 'active', owner: 'analyst_1',
      created_at: now, updated_at: now,
      entities: [], alerts: [], turns: [], artifacts: [],
      pinned_findings: [], notes: [], generated_reports: [],
      reviewedEntityNodeIds: [],
    }
    set((s) => ({ investigations: [inv, ...s.investigations], activeInvestigationId: id }))
    return id
  },

  openInvestigation: (id) => set({ activeInvestigationId: id }),

  closeActiveInvestigation: () => set({ activeInvestigationId: null }),

  addTurn: (turn) => {
    const id = get().activeInvestigationId
    if (!id) return
    const t: Turn = { ...turn, id: crypto.randomUUID(), created_at: new Date().toISOString() }
    set((s) => ({
      investigations: s.investigations.map((inv) =>
        inv.id === id
          ? { ...inv, turns: [...inv.turns, t], updated_at: new Date().toISOString() }
          : inv
      ),
    }))
  },

  addArtifact: (artifact) => {
    const id = get().activeInvestigationId
    if (!id) return ''
    // If an artifact with the same type + title already exists, update it in-place
    // (prevents duplicate documentation/handoff artifacts from re-running the same prompt)
    const inv = get().investigations.find((i) => i.id === id)
    const existing = inv?.artifacts.find((a) => a.type === artifact.type && a.title === artifact.title)
    if (existing) {
      set((s) => ({
        investigations: s.investigations.map((i) =>
          i.id === id
            ? {
                ...i,
                artifacts: i.artifacts.map((a) =>
                  a.id === existing.id
                    ? { ...a, data: artifact.data, created_at: new Date().toISOString() }
                    : a
                ),
                updated_at: new Date().toISOString(),
              }
            : i
        ),
      }))
      return existing.id
    }
    const artId = crypto.randomUUID()
    const a: Artifact = { ...artifact, id: artId, created_at: new Date().toISOString(), pinned: false }
    set((s) => ({
      investigations: s.investigations.map((i) =>
        i.id === id
          ? { ...i, artifacts: [...i.artifacts, a], updated_at: new Date().toISOString() }
          : i
      ),
    }))
    return artId
  },

  togglePin: (artifactId) => {
    const id = get().activeInvestigationId
    if (!id) return
    set((s) => ({
      investigations: s.investigations.map((inv) =>
        inv.id === id
          ? { ...inv, artifacts: inv.artifacts.map((a) => a.id === artifactId ? { ...a, pinned: !a.pinned } : a) }
          : inv
      ),
    }))
  },

  addNote: (content) => {
    const id = get().activeInvestigationId
    if (!id) return
    const note: Note = {
      id: crypto.randomUUID(), content,
      created_at: new Date().toISOString(), author: 'analyst_1',
    }
    set((s) => ({
      investigations: s.investigations.map((inv) =>
        inv.id === id
          ? { ...inv, notes: [...inv.notes, note], updated_at: new Date().toISOString() }
          : inv
      ),
    }))
  },

  addPinnedFinding: (finding) => {
    const id = get().activeInvestigationId
    if (!id) return
    set((s) => ({
      investigations: s.investigations.map((inv) =>
        inv.id === id
          ? { ...inv, pinned_findings: [...inv.pinned_findings, finding] }
          : inv
      ),
    }))
  },

  removePinnedFindingFrom: (invId, finding) => {
    set((s) => ({
      investigations: s.investigations.map((inv) =>
        inv.id === invId
          ? { ...inv, pinned_findings: inv.pinned_findings.filter((f) => f !== finding) }
          : inv
      ),
    }))
  },

  toggleReviewedEntity: (invId, nodeId) => {
    set((s) => ({
      investigations: s.investigations.map((inv) => {
        if (inv.id !== invId) return inv
        const current = inv.reviewedEntityNodeIds ?? []
        return {
          ...inv,
          reviewedEntityNodeIds: current.includes(nodeId)
            ? current.filter((id) => id !== nodeId)
            : [...current, nodeId],
        }
      }),
    }))
  },
}))
