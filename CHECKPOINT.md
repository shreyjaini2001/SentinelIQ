# SentinelIQ — Checkpoint v0.1.0-mock-phase1

**Date:** 2026-05-04  
**Status:** Phase 0 complete, Phase 1 complete in mock mode. Safe for GitHub push.

---

## What Is Complete

### Phase 0 — Foundation

| Capability | Status | Notes |
|------------|--------|-------|
| Intent classification (query / action / refine) | ✅ | 100% on 185-item benchmark |
| NLQ → KQL generation with clause-level explanation | ✅ | Mock: keyword templates; Real: claude-sonnet-4-6 |
| Refine mode (context-aware query narrowing) | ✅ | Prior query passed as session context |
| Session persistence (SQLite) | ✅ | 8h TTL, shared session IDs |
| Autocomplete with recency scoring | ✅ | Query history + team pool |
| Suggestion chips | ✅ | Context-adaptive, 5 chips per result |
| Classifier benchmark exit gate | ✅ | 100.0% (185/185), threshold 85% |

### Phase 1 — AI Capabilities (all fixture-backed, zero API credits needed)

| Capability | Status | Notes |
|------------|--------|-------|
| Alert triage with TP/FP scoring | ✅ | 10 fixture alerts, confidence + reasoning |
| Threat hunt by actor / TTP | ✅ | 13 ATT&CK techniques, actor mapping |
| Attack timeline reconstruction | ✅ | Entity-based, 8-stage kill chain |
| Investigation summarization | ✅ | Markdown output |
| Detection rule generation | ✅ | KQL rule + MITRE mapping |
| SSE streaming for all action handlers | ✅ | progress → result event pattern |
| AlertTriagePanel | ✅ | TP/FP verdicts, influencing fields |
| HuntResultPanel | ✅ | ATT&CK heatmap, technique results |
| TimelinePanel | ✅ | Kill-chain stages, event list |
| Welcome screen quick-launch buttons | ✅ | 4 example prompts, auto-submit |

### Infrastructure

- Provider abstraction layer (`LLMProvider`, `DataProvider`) — swap mock ↔ real with one env var
- 12 fixture JSON files covering realistic jsmith@corp.com compromise scenario
- 47 pytest tests — 100% pass, no server needed, no API credits
- Frontend TypeScript build — zero errors, 177KB bundle
- `.gitignore` covering secrets, node_modules, dist, pycache, SQLite DB files
- `.env.example` with safe placeholder values

---

## How to Run

### Prerequisites
- Python 3.11+
- Node 18+

### Setup (one-time)

```powershell
# Copy env file — no changes needed for mock mode
cp .env.example .env

# Install Python dependencies
cd apps/api
pip install -r requirements.txt

# Install Node dependencies
cd ../web
npm install
```

### Start (two terminals)

```powershell
# Terminal 1 — API
cd apps/api
uvicorn main:app --reload --port 8000

# Terminal 2 — Web
cd apps/web
npm run dev
```

| Service | URL |
|---------|-----|
| Web app | http://localhost:5173 |
| API | http://localhost:8000 |
| Swagger docs | http://localhost:8000/docs |

---

## How to Test

### Backend unit tests (no server needed)

```powershell
cd apps/api
pytest
# Expected: 47 passed in ~1s
```

### Classifier benchmark (requires running API server)

```powershell
# With uvicorn running on port 8000:
python scripts/run_classifier_benchmark.py
# Expected: 100.0% (185/185), PASS
```

### Frontend production build

```powershell
cd apps/web
npm run build
# Expected: ✓ built in ~14s, zero TypeScript errors
```

---

## Demo Prompts That Work

### Query mode — generates KQL

```
Show me failed logins from unusual geolocations in the last 6 hours
Find all PowerShell executions with encoded commands this week
What outbound connections did SERVER-DC01 make yesterday?
Show me privilege escalation events in the last 24 hours
Find lateral movement patterns using SMB in the last 3 days
Which users logged in from multiple countries today?
Find LSASS memory reads in the last 24 hours
Show me new local admin accounts created this week
```

### Action mode — runs AI capabilities (SSE streaming)

```
Triage my open alerts                          → AlertTriagePanel with TP/FP scores
Hunt for LAPSUS$ TTPs                          → HuntResultPanel with ATT&CK heatmap
Hunt for credential dumping                    → targeted T1003/T1078/T1021
Show timeline for jsmith@corp.com              → TimelinePanel, 8 kill-chain stages
Reconstruct attack chain for SERVER-DC01       → host-based timeline
Summarize this investigation                   → executive summary text
Create a detection rule for this query         → KQL rule with MITRE mapping
```

### Refine mode — context-aware narrowing

```
(after a query) Now filter to just finance users
(after a query) Only show successful logins
(after a query) Limit to the last 2 hours
(after a query) Add a count by country column
(after a query) Exclude known good IPs from the results
```

### Welcome screen quick-launch buttons

Click any of the four buttons on the welcome screen:
- **Failed logins last 24h**
- **Triage my open alerts**
- **Hunt for LAPSUS$ TTPs**
- **Timeline for jsmith@corp.com**

---

## Milestones Since v0.1.0

| Version | Date | Summary |
|---------|------|---------|
| v0.5.0 | 2026-05-10 | App shell, sidebar navigation, browser history back/forward |
| v0.6.0 | 2026-05-15 | Investigation memory — sessions, turns, artifacts, notes, pinned findings |
| v0.7.0 | 2026-05-19 | Logs page, KQL query console, result artifacts, pivot suggestions |
| v0.7.2 | 2026-05-21 | NLQ pipeline stability — mock_client routing fix, pydantic-settings migration |
| v0.7.4 | 2026-05-22 | Entity-grounded query planner — entity scoped KQL, scope strip in QueryPreviewCard |
| v0.7.5 | 2026-05-23 | Query intent precision — 5 inventory intents, IdentityInfo/DeviceProcess/etc KQL branches |
| v0.7.6 | 2026-05-23 | Fallback cleanup — `_REQUIRED_TABLES` fix, `_NO_TIME_FILTER_TABLES`, inventory-aware fallback |
| v0.8.0 | 2026-05-25 | Investigation Evidence Graph and Entity Timeline (see below) |
| v0.8.1 | 2026-05-25 | Evidence Derivation Depth, Relationship Provenance, and Manual Evidence Actions (see below) |
| v0.8.2 | 2026-05-25 | Evidence Workspace Completion — process evidence, count clarity, gap cleanup, source artifact nav (see below) |
| v0.8.3 | 2026-05-25 | Evidence Manual Actions Finalization — entity note format + confirmation, relationship note composer (see below) |

### v0.8.3 — Evidence Manual Actions Finalization

**What changed:**

| File | Change |
|------|--------|
| `apps/web/src/components/investigation/EvidenceGraph.tsx` | EntityDetailPanel: corrected note body format to `Entity note — {type} {value}:\n{text}`; added `noteSaved` state with "✓ Note added to {inv.title}" confirmation after save; RelationshipRow: added `invTitle?` prop; added inline relationship note composer with context header `Relationship note — {from} {verb} {to} ({table}):`, textarea, Save/Cancel, and "✓ Note added to {invTitle}" confirmation; passed `invTitle={inv.title}` at call site |
| `apps/web/src/App.tsx` | Version bumped to v0.8.3 |

**Entity note format corrected:**
- Body format: `Entity note — ${type} ${value}:\n${text}` (previously used a different format)
- Save confirmation: "✓ Note added to {inv.title}" rendered below Analyst Actions for 2.5s after save
- Note form shows context prefix as read-only monospace header before the textarea
- Cancel clears draft and closes form without saving

**Relationship note composer (new):**
- "Add note" button added to RelationshipRow expanded action row alongside existing "Open in Logs →", "Investigate →", "Open artifact →"
- Inline composer opens inside the expanded panel with context header: `Relationship note — {from.value} {verb} {to.value} ({sourceTable}):` (table suffix omitted if absent)
- Body format: `Relationship note — ${from} ${verb} ${to}${table ? ` (${table})` : ''}:\n${text}`
- Calls `addNote()` from investigationStore directly
- Save button disabled when draft is empty
- "✓ Note added to {invTitle}" confirmation shown for 2.5s after save
- `invTitle` prop passed from EvidenceGraph main component: `invTitle={inv.title}`

**All v0.8.3 manual actions confirmed functional:**
- Copy value: ✓ (clipboard write + transient confirmation)
- Open in Logs →: ✓ (scoped query via submitCommand)
- Add note (entity): ✓ (store-backed, correct format, confirmation)
- Mark reviewed: ✓ (store-persisted reviewedEntityNodeIds, strikethrough + emerald badge)
- Add note (relationship): ✓ (new in v0.8.3, store-backed, inline composer, confirmation)
- Investigate →: ✓ (submitCommand)
- Open artifact →: ✓ (tab switch + highlight ring)

**v0.8 series closure:**
- v0.8.3 completes the Evidence Manual Actions track — all manual SOC workflow actions are implemented and store-backed
- Investigation memory always: notes persist in Zustand investigation state for the session, reviewedEntityNodeIds survive tab navigation

**Known limitations (forward to Phase 3):**
- Note content is not persisted across browser refresh (Zustand in-memory; no localStorage integration)
- `reviewedEntityNodeIds` same limitation

### v0.8.2 — Evidence Workspace Completion

**What changed:**

| File | Change |
|------|--------|
| `apps/web/src/types/investigation.ts` | Added `reviewedEntityNodeIds?: string[]` to `Investigation` — reviewed entity state persists across tab navigation |
| `apps/web/src/types/evidence.ts` | Added `prompt?: string` to `InvestigationGap` — separates display label from submitted command |
| `apps/web/src/stores/investigationStore.ts` | Added ART-007 (DeviceProcessEvents, 3 rows) to INV-001 fixture; added `toggleReviewedEntity(invId, nodeId)` action; added `reviewedEntityNodeIds: []` to all fixture investigations and `createInvestigation` |
| `apps/web/src/utils/evidenceGraph.ts` | Tightened gap clearing: process/network gaps now only clear if a `query_result` artifact for that SIEM table exists with rows (removed loose KQL text/turn text fallbacks); added `prompt` field to all actionable gaps |
| `apps/web/src/components/investigation/EvidenceGraph.tsx` | Store-backed reviewed entity state; renamed "Entities" sidebar label to "Evidence Nodes (N) / case entities: N"; added "Open in Logs" as explicit analyst action in EntityDetailPanel; added "Open artifact →" button in source artifacts list and in RelationshipRow expanded panel; improved relationship display in detail panel (shows from/to entity chips); gap action buttons now submit `gap.prompt` (clean command), non-actionable gaps are informational only; added Evidence Sources section; `useEffect` guard for selected node cleanup |
| `apps/web/src/pages/InvestigationWorkspacePage.tsx` | Renamed header stat "Entities" → "Case Entities"; added `handleNavigateToArtifact` callback passed to EvidenceGraph; added `highlightedArtifactId` state with `useEffect` cleanup; ArtifactsTab accepts and renders highlight ring on the source artifact |
| `apps/web/src/App.tsx` | Version bumped to v0.8.2 |

**Entity count mismatch resolved:**
- Header stat pill now shows "Case Entities: 4" (`inv.entities.length` — the investigation seed entities)
- Evidence sidebar header shows "Evidence Nodes (N)" with a secondary "case entities: M" label
- Analyst can clearly distinguish: case entities = analyst-tagged entities; evidence nodes = all derived entities including process, country nodes extracted from query_result artifacts

**Process evidence rendering:**
- ART-007 (DeviceProcessEvents, 3 rows: powershell.exe × 2 + cmd.exe × 1) added to INV-001 fixture
- `deriveNodes()` extracts `powershell.exe`, `cmd.exe`, `admin-svc` as process/user nodes from ART-007 `extractedEntities` and FileName column
- `deriveRelationships()` produces: `DESKTOP-42 → executed process → powershell.exe`, `DESKTOP-42 → executed process → cmd.exe`, `SERVER-DC01 → executed process → powershell.exe`, `jsmith → launched process → powershell.exe`, `jsmith → launched process → cmd.exe`, `admin-svc → launched process → powershell.exe`
- Process section appears under Evidence Nodes sidebar; clicking any process node opens detail panel with relationships and AI actions

**Gap action prompt cleanup:**
- `InvestigationGap.prompt` is the clean command submitted on click; `suggestedAction` is the display label
- Example: displays "Query process activity — e.g. \"Show PowerShell execution for DESKTOP-42\"", submits "Show PowerShell execution for DESKTOP-42"
- Notes gap (no meaningful AI command) shows `suggestedAction` as italic non-clickable text

**Gap clearing evidence-based:**
- Process gap: clears only if a `query_result` artifact with `sourceTable === 'DeviceProcessEvents'` AND `rows.length > 0` exists
- Network gap: clears only if a `query_result` artifact with `sourceTable === 'DeviceNetworkEvents'` AND `rows.length > 0` exists
- Removed loose fallbacks: KQL text scan and turn text keyword scan removed entirely

**Source artifact navigation:**
- "Open →" button on each source artifact in EntityDetailPanel calls `onNavigateToArtifact(artifactId)`
- "Open artifact →" button in RelationshipRow expanded panel calls `onNavigateToArtifact(rel.artifactId)`
- InvestigationWorkspacePage switches to Artifacts tab and renders a highlight ring (blue border + ring) on the target artifact
- Highlight auto-clears when navigating to any other tab

**Open in Logs from Evidence:**
- Each entity detail panel's Analyst Actions now includes "Open in Logs →" as a dedicated button
- Submits a scoped query matching entity type: user → sign-in activity, host → process+network activity, IP → network events, process → execution history, country → sign-ins
- Uses `submitCommand()` through the shared command runner (same path as the AI bar)

**Reviewed entity persistence:**
- `reviewedEntityNodeIds` stored in investigation Zustand state (not component state)
- Survives tab navigation within the investigation workspace
- Node IDs are deterministic (`node:${value.toLowerCase()}`) so they survive re-derivation

**Evidence Sources section:**
- Compact pill section at the bottom of the Evidence tab showing counts: query results, pinned findings, notes, reports
- Only shown when at least one source type is present

**Known limitations:**
- `reviewedEntityNodeIds` is not persisted across browser refresh (Zustand in-memory store; no localStorage integration yet)
- Relationship extraction uses fixed column-index positions per SIEM table — fragile if columns arrive in different order
- No cross-investigation entity linking

### v0.8.1 — Evidence Derivation Depth, Relationship Provenance, and Manual Evidence Actions

**What changed:**

| File | Change |
|------|--------|
| `apps/web/src/types/evidence.ts` | Extended `EvidenceRelationship` with `provenanceType`, `sourceTable`, `artifactTitle`, `artifactId`, `rowCount`, `timestamp`; added `ProvenanceType` union |
| `apps/web/src/utils/evidenceGraph.ts` | Rewrote to parse `query_result` artifact rows per SIEM table (SigninLogs, DeviceNetworkEvents, DeviceProcessEvents, SecurityEvent, DeviceLogonEvents); LOCATION_RE + PROCESS_RE classification; full provenance on all relationships; `hasQueryResultForTable()` for gap clearing |
| `apps/web/src/components/investigation/EvidenceGraph.tsx` | `RelationshipRow` now collapsible with provenance detail panel (table, artifact, row count, timestamp, type badge, deep-link actions); `EntityDetailPanel` now has analyst actions (Copy, Add note, Mark reviewed) alongside AI quick actions; reviewed entities shown with strikethrough + emerald badge |
| `apps/web/src/stores/investigationStore.ts` | Added ART-005 (SigninLogs, 3 rows) and ART-006 (DeviceNetworkEvents, 2 rows) fixture `query_result` artifacts to INV-001 |
| `apps/api/src/llm/mock_client.py` | Fixed Branch F: host-scoped network queries generate row-level KQL (not summarize); `sum(BytesSent)` not `sum(AdditionalFields.BytesSent)` |
| `apps/web/src/utils/queryPlanner.ts` | Inventory intent detection (IP/Host/Process/User inventory) now gated by `entityType === null` — prevents entity-scoped host/IP queries from being mislabeled as inventory scans |
| `apps/web/src/App.tsx` | Version bumped to v0.8.1 |

**Evidence derivation — query_result parsing:**
- `deriveNodes()` processes `extractedEntities` from each `query_result` artifact, then does column-based row extraction per SIEM table to surface additional entities (Location column → country node, FileName → process node)
- `deriveRelationships()` maps SIEM table + column positions to typed relationship verbs:
  - SigninLogs: `user → "signed in from" → IP`, `user → "associated with location" → country`
  - DeviceNetworkEvents: `host → "connected to" → IP`
  - DeviceProcessEvents: `host → "executed process" → process`, `user → "launched process" → process`
  - SecurityEvent: `user → "logged onto" → host`, `host → "generated event" → event_id`
  - DeviceLogonEvents: `user → "logged onto" → host`, `host → "laterally moved to" → remote_host`
- Relationships deduplicated via `seen: Set<string>` with key `fromId|verb|toId`
- All relationships carry: `provenanceType`, `sourceTable`, `artifactTitle`, `artifactId`, `rowCount`, `timestamp`

**New entity types exposed:**
- `country` — classified from "XX / City" location strings via `LOCATION_RE`
- `process` — classified from `.exe`, `.dll`, `.ps1`, `.bat`, `.sh` file extensions via `PROCESS_RE`

**Relationship detail / expand:**
- Click any relationship row in the Evidence tab → inline provenance detail expands below the row
- Detail shows: source artifact title, SIEM table, row count, timestamp, provenance type badge
- "Open in Logs →" action replays a query for that table; "Investigate →" action investigates the relationship entity

**Manual entity actions (EntityDetailPanel):**
- **Copy** — `navigator.clipboard.writeText(node.value)` with transient ✓ confirmation
- **Add note** — inline textarea form; on submit calls `addNote()` from investigationStore, pre-populated with entity value context
- **Mark reviewed** — toggles a `reviewedNodeIds: Set<string>` in parent state; reviewed entities rendered with strikethrough text, grayed opacity, emerald ✓ badge

**KQL schema fix (mock_client.py):**
- Generic network summarize branch previously used `sum(AdditionalFields.BytesSent)` — mock schema has `BytesSent` as a direct column, not nested in AdditionalFields
- Host-scoped network queries now generate row-level KQL (not a summarize), preventing the inventory-intent false positive

**Gap clearing improvement:**
- `detectGaps()` now uses `hasQueryResultForTable(table)` which checks `art.type === 'query_result' && art.data.sourceTable === table` — a much stronger signal than scanning KQL text for table names

**Known limitations (still Phase 3):**
- Relationship parsing for pinned findings remains regex-based; complex natural language may miss extractions
- Row-based entity extraction uses fixed column index positions per table — fragile if SIEM returns columns in different order
- No cross-investigation entity linking

### v0.8.0 — Investigation Evidence Graph and Entity Timeline

**What changed:**

| File | Change |
|------|--------|
| `apps/web/src/types/evidence.ts` | New: `EvidenceNode`, `EvidenceRelationship`, `InvestigationGap`, `EvidenceTimelineEntry`, `DerivedEvidence` types |
| `apps/web/src/utils/evidenceGraph.ts` | New: `classifyEntityString()`, `deriveNodes()`, `deriveRelationships()`, `detectGaps()`, `deriveTimeline()`, `deriveEvidence()` |
| `apps/web/src/components/investigation/EvidenceGraph.tsx` | New: entity sidebar + relationship view + entity detail panel + investigation gaps — all derived from investigation memory |
| `apps/web/src/components/investigation/EvidenceTimeline.tsx` | New: chronological timeline of turns, notes, and pinned findings derived from investigation store |
| `apps/web/src/pages/InvestigationWorkspacePage.tsx` | Added `evidence` tab (EvidenceGraph) + replaced `TimelineTab` with `EvidenceTimeline` + replaced all `setPendingQuery` with `submitCommand` |
| `apps/web/src/App.tsx` | Version bumped to v0.8.0 |

**Architecture:**
- Frontend-only derivation — no backend changes, no new npm packages
- `deriveEvidence(inv)` is the single entry point; called with a memoized `useMemo` in each component
- Entity classification: email → user, IP regex → ip, HOST_RE → host, COUNTRY_RE → country, short username → user
- Relationship parsing: regex patterns on pinned finding text ("X → Y via Z", "X signed in from Y (IP)")
- Gap detection: deterministic checklist (timeline artifact, process query, network query if IP present, blast_radius, handoff/docs, notes if findings exist)
- All quick-action chips in entity detail panel use `submitCommand(prompt, { source: 'investigation_quick_action' })`

**Known limitations (Phase 3):**
- Relationship parsing is regex-based; complex natural language findings may not extract relationships
- Timeline entries for pinned findings use `investigation.created_at` as timestamp (findings have no individual timestamps)
- No cross-investigation entity linking

---

## Remaining Gaps

### Phase 2 — Real SIEM Integration (not started)

| Item | What's needed |
|------|--------------|
| `RealSIEMProvider` | Currently raises `NotImplementedError` on all methods. Wire to Azure Sentinel / KQL execution API. |
| Live KQL execution | Execute generated queries against a real workspace, return actual results |
| Real alert ingestion | Pull live alerts from Sentinel incidents API instead of fixture JSON |

### Phase 2 — UI / UX

| Item | What's needed |
|------|--------------|
| Session share link | Backend generates `share_token` but no "Share" button in UI |
| Query result table | Generated KQL is shown as text; no result table rendering yet |
| Export / copy buttons | No one-click copy for KQL or session export |

### Technical Debt

| Item | Priority |
|------|----------|
| Pydantic `utcnow()` deprecation warnings (32 instances) | Low — non-breaking |
| `RealSIEMProvider` stub | Phase 2 blocker |
| Session DB migration strategy | Needed before prod |

---

## Security Checklist (pre-push)

- [x] `.env` excluded by `.gitignore` — real API key never committed
- [x] `.env.example` has only placeholder values
- [x] `node_modules/`, `dist/`, `__pycache__/` excluded
- [x] SQLite DB files (`*.db`, `*.sqlite`) excluded
- [x] No hardcoded credentials in source code
- [x] Fixture data is synthetic (no real PII)
- [x] `PII scrubber` active on all outbound LLM calls in real mode

---

## Version

`v0.1.0-mock-phase1` — Phase 0 + Phase 1 complete in mock mode, benchmark passing at 100%.
