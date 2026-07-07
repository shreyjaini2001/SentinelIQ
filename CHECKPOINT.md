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
| v0.9.0 | 2026-05-26 | Vendor-Agnostic Query Plan and SIEM Adapter Foundation — neutral QueryPlan, Sentinel/Splunk/Elastic adapters, platform selector (see below) |
| v0.9.1 | 2026-05-26 | QueryPlan Explainability, Adapter Validation, and QueryPlan-Native Mock Execution (see below) |
| v1.0.0 | 2026-05-27 | AI Orchestration and Privacy-Aware Context Builder — context assembly, PII redaction, mock orchestrator, execution trace, save actions (see below) |

### v0.9.0 — Vendor-Agnostic Query Plan and SIEM Adapter Foundation

**What changed:**

| File | Change |
|------|--------|
| `apps/web/src/types/queryPlan.ts` | **New** — `QueryPlan`, `RenderedQuery`, `SiemPlatform` (`'sentinel' \| 'splunk' \| 'elastic'`), `QueryLanguage` (`'KQL' \| 'SPL' \| 'ESQL'`), `SiemAdapter`, `QueryPlanIntent` (15 intents), `QueryPlanEntity`, `FieldMapping`, `SourceDefinition` |
| `apps/web/src/utils/siemAdapters.ts` | **New** — `deriveQueryPlanFromKql(kql)` maps KQL scope to neutral `QueryPlan`; `renderQuery(plan, platform)` dispatches to Sentinel/Splunk/Elastic adapters; `PLATFORM_NAMES`, `PLATFORM_LANGUAGES` constants; full adapter implementations for all 15 intents |
| `apps/web/src/components/query/PlatformSelector.tsx` | **New** — 3-button platform selector (Sentinel / Splunk / Elastic); reads/sets `useLogsStore.selectedPlatform` |
| `apps/web/src/stores/logsStore.ts` | Added `selectedPlatform: SiemPlatform` (default `'sentinel'`), `setSelectedPlatform` action; persisted via Zustand `partialize` |
| `apps/web/src/utils/mockResults.ts` | Added optional `sourcePlatform?`, `queryLanguage?`, `renderedQuery?` to `MockQueryResult` — populated at save time, not during generation |
| `apps/web/src/types/evidence.ts` | Added `sourcePlatform?` and `queryLanguage?` to `EvidenceRelationship` |
| `apps/web/src/utils/evidenceGraph.ts` | Extended `QueryResultData` with `sourcePlatform?`/`queryLanguage?`; passes them through `RelProvenance` into derived relationships |
| `apps/web/src/components/SearchBar/QueryPreviewCard.tsx` | Platform-aware query display — KQL highlighted for Sentinel, plain mono for SPL/ESQL; `PlatformSelector` in header; scope strip shows `sourceName` from rendered adapter; "Save to Case" / "Save Result" include `sourcePlatform`, `queryLanguage`, `renderedQuery`; mock results always use internal KQL for routing |
| `apps/web/src/pages/LogsPage.tsx` | Header shows `Query console · {platform}`; `PlatformSelector` in header; editor toolbar shows language badge; textarea placeholder is platform-aware; "Save to Case" stores platform metadata; Templates section labeled `(Sentinel/KQL)` |
| `apps/web/src/components/investigation/EvidenceGraph.tsx` | Relationship provenance panel now shows Platform + Language rows when present |
| `apps/web/src/App.tsx` | Version bumped to v0.9.0 |

**Neutral QueryPlan:**
- Separates analyst intent from query language
- 15 intents: `failed_logins`, `user_activity`, `host_activity`, `ip_activity`, `process_activity`, `suspicious_powershell`, `outbound_connections`, `user_host_relationships`, `identity_inventory`, `observed_users`, `host_inventory`, `ip_inventory`, `process_inventory`, `local_admin_creation`, `generic`
- Entities, time range, data goal all SIEM-neutral
- Derived from any KQL via `deriveQueryPlanFromKql(kql)`

**Adapter interface:**
- `SiemAdapter.renderQuery(plan)` → `RenderedQuery { platform, language, query, sourceName, explanation }`
- All adapters fully implement all 15 intents
- Entity scope flows through: user/host/IP filters preserved across platforms
- Time range converted: KQL `ago(24h)` → SPL `earliest=-24h` → ES|QL `NOW() - 24 HOURS`

**Microsoft Sentinel / KQL adapter:**
- Preserves all v0.7.6–v0.8.x KQL behavior
- Canonical table names: SigninLogs, DeviceProcessEvents, DeviceNetworkEvents, SecurityEvent, DeviceLogonEvents, IdentityInfo
- Entity-scoped filters: `Account has "user"`, `DeviceName =~ "host"`, `RemoteIP == "ip"`

**Splunk / SPL adapter:**
- Representative mock SPL for all 15 intents
- Uses `index=identity`, `index=windows`, `index=network`, `index=edr` source namespaces
- Entity scope: `| search user="..."`, `host="..."`, `dest_ip="..."`
- Time range: `earliest=-Nh` / `earliest=-Nd` SPL syntax
- Inventory: `stats`, `dc()`, `values()` aggregations

**Elastic / ES|QL adapter:**
- Uses ES|QL-style `FROM ... | WHERE | KEEP | SORT` pipeline syntax
- Source indices: `signin-logs`, `endpoint-events`, `network-events`, `security-events`, `identity-info`
- ECS field schema: `user.name`, `host.name`, `source.ip`, `destination.ip`, `process.name`, `@timestamp`
- Time range: `@timestamp > NOW() - N HOURS/DAYS/MINUTES`

**Platform selector:**
- Global — stored in persisted `logsStore.selectedPlatform`
- Appears in: Logs page header, QueryPreviewCard header
- Switching platform re-renders the same QueryPlan into the selected language
- Entity scope and time range preserved across platform switches
- Default: Microsoft Sentinel (backward compatible)

**Mock result behavior (unchanged):**
- `generateMockResults(kql)` still routes on KQL table keywords — no change
- Platform metadata (`sourcePlatform`, `queryLanguage`, `renderedQuery`) attached at save time
- Mock rows remain normalized and deterministic regardless of platform

**Artifact storage:**
- Query and query_result artifacts now include: `sourcePlatform`, `queryLanguage`, `renderedQuery`
- Artifact titles remain clean: `Query — ...`, `Query Result — ...`
- Evidence provenance reads platform/language from artifact data

**Evidence provenance:**
- `EvidenceRelationship.sourcePlatform` and `queryLanguage` populated when artifact was saved with platform metadata
- RelationshipRow expanded panel shows Platform + Language rows when available
- Evidence remains internally vendor-neutral: entity types unchanged

**Manual workflow preserved:**
- Logs page textarea: analyst can type any query manually
- Run button always runs `generateMockResults(kql)` — mock routing unchanged
- Save to Case records platform context alongside result

**AI-assisted workflow preserved:**
- AI bar still accepts all natural-language prompts
- QueryPreviewCard appears with selected platform rendering
- No API credits consumed — all mock, all deterministic

**v0.7.6 KQL behavior preserved:**
- Sentinel adapter's `renderQuery` for all intents produces equivalent KQL to what the backend currently generates
- `parseKqlScope` / `queryPlanner.ts` unchanged — still used for scope strip display

**Known limitations (forward to Phase 4):**
- SPL and ES|QL templates not yet wired into the Logs page template panel (templates remain Sentinel/KQL)
- Platform field mappings are representative, not production-validated against real Splunk/Elastic deployments
- No real connector integration — all mock

---

### v1.0.0 — AI Orchestration and Privacy-Aware Context Builder

**What changed:**

| File | Change |
|------|--------|
| `apps/web/src/types/aiOrchestration.ts` | New: `AiRedactionPolicy`, `AiContextItem`, `AiContextBundle`, `AiPrivacyFinding`, `AiTraceStep`, `AiExecutionTrace`, `AiOrchestrationResult`, `AiModelProvider` |
| `apps/web/src/utils/contextBuilder.ts` | New: `buildContextBundle(inv, taskType, policy)` — assembles minimum context per task type from turns/artifacts/notes/findings/entities; `HANDLER_CONTEXT_POLICY` map at module scope |
| `apps/web/src/utils/privacyRedaction.ts` | New: `applyRedactionToBundle(bundle)` — detects and replaces emails, IPs, hostnames, SHA256 hashes, encoded command lines; `redact_sensitive` policy only, `local_only`/`allow_full_context` pass through |
| `apps/web/src/utils/mockModelProvider.ts` | New: `AiModelProvider` interface + `MockModelProvider` (deterministic, intent-keyed); TODO stubs for `ClaudeProvider` and `LocalModelProvider` |
| `apps/web/src/utils/aiOrchestrator.ts` | New: `buildOrchestrationForAction(handler, prompt)` — synchronous; reads `useInvestigationStore.getState()` (Zustand non-React accessor); 6-step trace: classify → select investigation → load context → apply redaction → generate mock → await save |
| `apps/web/src/components/ai/ModelModeBadge.tsx` | New: three pill badges — model name (purple), redaction policy (amber), "External: Off" (gray) |
| `apps/web/src/components/ai/ContextUsedPanel.tsx` | New: collapsible — investigation title, per-kind item counts, redaction count, privacy mode, model mode |
| `apps/web/src/components/ai/ExecutionTrace.tsx` | New: collapsible numbered step list with label + detail per step |
| `apps/web/src/components/ai/SaveAiOutputActions.tsx` | New: Save as Note (`addNote`), Pin as Finding (`addPinnedFinding`), Copy (clipboard), Dismiss (`sessionStore.clear()`); disabled when `!hasActiveInvestigation` |
| `apps/web/src/pages/OverviewPage.tsx` | `buildOrchestrationForAction` called at render when `actionData` present; `ModelModeBadge` in AI Result header; `ContextUsedPanel` + `ExecutionTrace` in OrchestrationMeta below MainPanel; `SaveAiOutputActions` in OrchestrationMeta for non-documentation/handoff handlers; `orchestration` passed to `DocumentationPanel` + `HandoffBriefingPanel` |
| `apps/web/src/pages/ReportsPage.tsx` | `ModelModeBadge` in Generate with AI header; `buildContextBundle` for report context preview showing per-kind item counts and redaction policy |
| `apps/web/src/components/panels/DocumentationPanel.tsx` | Added `orchestration?: AiOrchestrationResult` prop; when present: `ContextUsedPanel` replaces raw contextMeta text; `SaveAiOutputActions` replaces disabled "Export PDF / Copy Markdown / Send to ITSM" buttons |
| `apps/web/src/components/panels/HandoffBriefingPanel.tsx` | Added `orchestration?: AiOrchestrationResult` prop; `ContextUsedPanel` + `SaveAiOutputActions` shown at bottom when present |
| `apps/web/src/App.tsx` | Version bumped to v1.0.0 |

**Architecture:**
- `buildOrchestrationForAction` is synchronous — no async, no network calls, deterministic per call
- Uses `useInvestigationStore.getState()` (not React hook) to read store state from a plain utility function
- `HANDLER_CONTEXT_POLICY` controls which context item kinds are relevant per task type — documentation/handoff get all kinds, query gets only turns + entities
- Redaction applies only under `redact_sensitive` policy; `local_only` and `allow_full_context` pass through without modification
- MockModelProvider is a singleton with deterministic output keyed to intent string
- `PANEL_INTEGRATED_HANDLERS = Set(['documentation', 'handoff'])` — these panels embed their own save actions, so OverviewPage skips the OrchestrationMeta `SaveAiOutputActions` for them

**Privacy model:**
- `local_only` — no redaction, data stays in browser, no external API calls (mock mode)
- `redact_sensitive` — PII patterns detected and replaced before context use: `[EMAIL]`, `[IP]`, `[HASH]`, `[HOST]`, `[ENCODED_CMD]`
- `allow_full_context` — no redaction; reserved for future real-API mode with explicit analyst consent

**Save behavior:**
- All saves are explicit — no auto-save
- "Save as Note" calls `addNote()` with `[intent] content.slice(0,500)`
- "Pin as Finding" calls `addPinnedFinding()` with first sentence of content
- "Copy" writes raw content/intent to clipboard
- "Dismiss" calls `sessionStore.clear()` which clears `actionData`, `currentResult`, and `chips`
- All save buttons disabled when `!hasActiveInvestigation`

**All prior behaviors preserved:**
- v0.9 QueryPlan / adapter layer unchanged
- v0.8 Evidence workspace unchanged
- Logs / query workflow unchanged
- No new npm packages installed
- No backend changes

---

## v1.0.1 — Orchestration Routing, AI Output Rendering, Save Actions, Timestamp Consistency, and Report Detail Navigation

**Date:** 2026-05-27  
**Status:** Complete — 100 modules, zero TS errors, 145/145 pytest passing

### Summary

Fixed the raw JSON output bug for evidence actions, routed all evidence/relationship prompts through the v1.0 AI orchestration layer, added a unified AI output renderer, made report rows clickable with inline detail view, added a deterministic mock timestamp helper, and added compact indicators to the query planner strip.

### Changed Files

| File | Change |
|------|--------|
| `apps/web/src/utils/mockClock.ts` | New: `MOCK_NOW = '2026-05-10T08:45:00Z'`, `mockTs()`, `mockFmtDate(iso?)` — single source of truth for fixture timestamps |
| `apps/web/src/utils/evidenceActionGenerator.ts` | New: `detectEvidenceAction(text)` — regex pattern matching for summarize/investigate prompts; `generateEvidenceSummary(entity)` — pulls from active investigation store + fixture lines; `generateRelationshipInvestigation(from, to)` — fixture-based relationship evidence; `EvidenceSummaryResult` + `RelationshipInvestigationResult` types |
| `apps/web/src/utils/aiOrchestrator.ts` | Added `evidence_summary` + `relationship_investigation` to `HANDLER_INTENT` and `HANDLER_LABEL` maps |
| `apps/web/src/utils/contextBuilder.ts` | Added `evidence_summary` + `relationship_investigation` to `HANDLER_CONTEXT_POLICY` (evidence: turn/artifact/finding/entity; relationship: turn/artifact/entity) |
| `apps/web/src/components/ai/AiOutputPanel.tsx` | New: unified AI output renderer — title, ModelModeBadge in header, summary, evidence lines list, recommended actions list, ContextUsedPanel + ExecutionTrace + SaveAiOutputActions at bottom |
| `apps/web/src/components/reports/ReportDetailPanel.tsx` | New: deterministic mock report detail — 4 variants (executive/technical/handoff/regulatory) with fixture sections; Copy Markdown + Back button |
| `apps/web/src/components/SearchBar/ActionOutput.tsx` | Added `isRawJson()` guard — detects `{`/`[` prefix + JSON.parse test; shows "Result available in Overview panel" fallback instead of raw JSON |
| `apps/web/src/components/SearchBar/SearchBar.tsx` | Added `evidence_summary` + `relationship_investigation` to `hasDedicatedPanel` list |
| `apps/web/src/components/SearchBar/QueryPreviewCard.tsx` | Added compact `Mock Query Planner · External: Off` indicator to scope strip (right-aligned, gray-700 font-mono) |
| `apps/web/src/hooks/useSearchBar.ts` | Added client-side intercept block before `api.streamAction()`: calls `detectEvidenceAction()`, generates result locally, calls `setActionData`/`setActionOutput`, records turn+artifact in investigation store, returns without hitting backend; added `evidence_summary`/`relationship_investigation` to `HANDLER_TO_ARTIFACT_TYPE`, `buildArtifactTitle`, `buildResultSummary` |
| `apps/web/src/pages/OverviewPage.tsx` | Added `AiOutputPanel` import + `EvidenceSummaryResult`/`RelationshipInvestigationResult` types; added `evidence_summary` + `relationship_investigation` cases in `MainPanel`; added both to `PANEL_INTEGRATED_HANDLERS` |
| `apps/web/src/pages/ReportsPage.tsx` | Removed `setPendingQuery` dependency; generate buttons use `submitCommand` with `report_button` source; report rows changed from `div` to `button` with `onClick → setSelectedReportId`; `ReportDetailPanel` rendered inline when a report is selected; `→` arrow indicator on each row |
| `apps/web/src/App.tsx` | Version bumped to v1.0.1 |

### Root Cause Fixed

Evidence actions ("Summarize evidence for jsmith@corp.com", "Investigate relationship between X and Y") routed to the backend generic mock handler which returned `{"result":"Mock response","note":"Mock LLM active..."}`. This JSON was passed as `actionOutput` string, and because neither `evidence_summary` nor `relationship_investigation` were in `hasDedicatedPanel`, `ActionOutput.tsx` rendered raw JSON as text.

Fix: client-side intercept in `useSearchBar.ts` matches evidence prompts before calling `api.streamAction()` and generates rich results from the investigation store + fixture data. Both handlers added to `hasDedicatedPanel`. `ActionOutput.tsx` has a secondary JSON guard as safety net.

### Architecture

- `detectEvidenceAction()` uses regex: `/^summarize evidence for (.+)$/i`, `/^investigate relationship between (.+?) and (.+?)$/i`, plus variants — no fuzzy matching
- `generateEvidenceSummary()` reads `useInvestigationStore.getState()` (non-React Zustand accessor) and augments fixture lines with investigation-derived counts
- `buildOrchestrationForAction()` is called in OverviewPage at render time (same as v1.0.0) — evidence handlers now have intent/label so the trace shows correct labels
- `AiOutputPanel` is self-contained: includes its own ContextUsedPanel, ExecutionTrace, SaveAiOutputActions — marked as PANEL_INTEGRATED_HANDLER so OverviewPage's OrchestrationMeta doesn't duplicate them

**Test status:** 145/145 pytest, 100 modules, 439KB bundle (vite v6)

---

## v1.0.2 — Orchestration Metadata Deduplication and Single Source of Truth Cleanup

**Date:** 2026-05-27  
**Status:** Complete — 100 modules, zero TS errors, 145/145 pytest passing

### Root Cause

`OverviewPage.tsx` rendered an `OrchestrationMeta` block (ContextUsedPanel + ExecutionTrace ± SaveAiOutputActions) for every AI action result. For handlers in `PANEL_INTEGRATED_HANDLERS` (documentation, handoff, evidence_summary, relationship_investigation), the `SaveAiOutputActions` was correctly suppressed — but `ContextUsedPanel` and `ExecutionTrace` were still rendered unconditionally. Meanwhile those same panels (AiOutputPanel, DocumentationPanel, HandoffBriefingPanel) also rendered their own `ContextUsedPanel`. Result: `ContextUsedPanel` shown twice, with the risk of inconsistent item counts if the orchestration object were ever recomputed.

Additionally, `DocumentationPanel` and `HandoffBriefingPanel` embedded `ContextUsedPanel + SaveAiOutputActions` but **not** `ExecutionTrace` — so the 6-step trace was only visible via the parent block, meaning suppressing the parent would have hidden it.

### Fix

Three targeted changes, no architectural redesign:

1. **`OverviewPage.tsx`**: Changed the OrchestrationMeta block condition from `{orchestration && ...}` to `{orchestration && actionData && !PANEL_INTEGRATED_HANDLERS.has(actionData.handler) && ...}` — the entire block (ContextUsedPanel + ExecutionTrace + SaveAiOutputActions) is now skipped for any handler that owns its own metadata. The now-redundant inner `!PANEL_INTEGRATED_HANDLERS` guard on `SaveAiOutputActions` was removed (outer guard makes it dead code).

2. **`DocumentationPanel.tsx`**: Added `ExecutionTrace` import and rendering alongside `ContextUsedPanel + SaveAiOutputActions`. The panel now owns all three orchestration components and is self-contained.

3. **`HandoffBriefingPanel.tsx`**: Same — added `ExecutionTrace` to the existing `ContextUsedPanel + SaveAiOutputActions` block.

### Rendering contract post-fix

| Handler | Owns metadata in panel | Parent OrchestrationMeta |
|---------|----------------------|--------------------------|
| evidence_summary | AiOutputPanel (ContextUsedPanel + ExecutionTrace + SaveAiOutputActions + ModelModeBadge) | Suppressed |
| relationship_investigation | AiOutputPanel (same) | Suppressed |
| documentation | DocumentationPanel (ContextUsedPanel + ExecutionTrace + SaveAiOutputActions) | Suppressed |
| handoff | HandoffBriefingPanel (ContextUsedPanel + ExecutionTrace + SaveAiOutputActions) | Suppressed |
| triage / hunt / timeline / blast_radius / comparative / rule_suggestion / runbook / noise_coaching | None | Rendered once |

### Same orchestration object

All panels receive the same `orchestration` object prop (computed once in `OverviewPage` via `buildOrchestrationForAction`). No recomputation — counts are always consistent.

### Known limitations

None. All 10 action handlers verified to show metadata exactly once.

**Test status:** 145/145 pytest, 100 modules, 439KB bundle (vite v6)

---

## v1.1.0 — Unified Mock SOC Data Layer, Alert Operations, and Triage Scope Correctness

**Date:** 2026-05-27  
**Status:** Complete — 104 modules, zero TS errors, 145/145 pytest passing

### Summary

Replaced the 12-alert hardcoded fixture with a deterministic 190-alert mock dataset. Built a reactive alert store, scope-aware client-side triage engine, and full AlertsPage rewrite with status tabs, selection, and Load More pagination. Triage prompts now intercept client-side (same pattern as evidence actions) and produce a `ClientTriageResult` with real alert data routed through the new `TriageResultPanel`.

### Changed Files

| File | Change |
|------|--------|
| `apps/web/src/types/alerts.ts` | **New** — `MockAlert`, `AlertSeverity`, `AlertStatus`, `AlertEntityType`, `AlertTriageScopeType`, `TriageDisposition`, `AlertStats`, `AlertTriageScope`, `EnrichedTriageVerdict`, `ClientTriageResult` |
| `apps/web/src/data/mockSocData.ts` | **New** — 12 anchor alerts (ALT-001–ALT-012, matching existing investigationStore fixture IDs) + 178 synthetically generated from 10 rule templates cycling 16 entities; sorted newest-first; `ALERT_BY_ID` lookup map |
| `apps/web/src/stores/alertStore.ts` | **New** — Zustand store: `alerts`, `filters`, `visibleCount`, `selectedIds`; computed selectors: `filteredAlerts()`, `visibleAlerts()`, `stats()`, `openCount()`, `hasMore()`, `getTriageAlerts(scope)`; mutations: `setStatusFilter`, `setSeverityFilter`, `loadMore`, `toggleSelection`, `selectAll`, `clearSelection`, `applyStatusChange` |
| `apps/web/src/utils/alertTriageEngine.ts` | **New** — `detectTriageScope(text)` regex intercept; `triageAlerts(alerts, scope)` deterministic scoring from 13 detection rule patterns; `buildStatusChanges(result)` for batch status application; `EnrichedTriageVerdict` with `tp_probability`, `fp_probability`, `confidence`, `reasoning`, `influencing_fields`, `suggestedStatus` |
| `apps/web/src/components/alerts/TriageResultPanel.tsx` | **New** — `ClientTriageResult` renderer; scope badge in header; TP/Uncertain/FP stat row; per-alert verdict rows with alert name + entity (not UUID); per-row Mark Investigating / Mark FP / Close buttons; "Apply Triage Decisions" batch footer button; Load more for >15 verdicts |
| `apps/web/src/pages/AlertsPage.tsx` | **Rewritten** — uses `alertStore`; status tabs (All/Open/Investigating/Acknowledged/Closed/FP) with live counts; severity filter pills; checkbox selection with Select visible / Clear N selected controls; Detection Rule column (hidden on small screens); Load More pagination; Triage visible / Triage all open / Triage N selected header buttons using `submitCommand` |
| `apps/web/src/pages/OverviewPage.tsx` | Removed static `ALERT_QUEUE` array; added `useAlertStore` — stat cards and alert queue widget derive from `alertStats`; `MainPanel` triage routing: `'scope' in d` → `TriageResultPanel`, else `AlertTriagePanel` (backend fallback) |
| `apps/web/src/components/AppShell/Sidebar.tsx` | `NAV_MAIN` moved to `NAV_MAIN_BASE` (no badge); `openCount` from `useAlertStore` injected at render time as alert badge; updates reactively when triage decisions are applied |
| `apps/web/src/hooks/useSearchBar.ts` | Added triage client-side intercept block after evidence intercept: `detectTriageScope(text)` → `getTriageAlerts(scope)` → `triageAlerts(alerts, scope)` → `setActionData`; records turn+artifact in active investigation; returns before `api.streamAction()` |
| `apps/web/src/App.tsx` | Version bumped to v1.1.0 |

### Architecture

**Client-side triage intercept (same pattern as v1.0.1 evidence intercept):**
- `detectTriageScope(text)` returns `'visible_open' | 'all_open' | 'selected'` or `null`
- Scope routing: "selected" → `selectedIds`; "visible" → `visibleAlerts()` filtered to open; else → all open
- No backend round-trip; `api.streamAction()` never called for triage prompts
- Result type is `ClientTriageResult` which has `scope` field — discriminant from backend `TriageResult`
- `OverviewPage.MainPanel` distinguishes: `'scope' in d` routes to `TriageResultPanel`, else falls back to old `AlertTriagePanel`

**Alert lifecycle:**
- `applyStatusChange(ids, status)` in alertStore mutates alert statuses in-memory
- Sidebar badge recalculates `openCount()` after apply — decrements as TPs become Investigating
- Per-row individual overrides also call `applyStatusChange` immediately

**190-alert dataset:**
- ALT-001–ALT-012: anchor alerts with `linkedInvestigationId` matching `INV-001`/`INV-002` in investigationStore
- ALT-013–ALT-190: 10 rule templates × cycling USER_ENTITIES (8) + HOST_ENTITIES (8); status from `STATUS_CYCLE` array (predominantly open, with occasional investigating/acknowledged/fp/closed); timestamps spread over 72h window before MOCK_NOW; risk/confidence derived from template base + index variance

**Scoring rules (13 patterns):**
- impossible/travel → 90% TP (high confidence)
- credential/dump/lsass → 88% TP (high)
- c2/beacon/outbound → 82% TP (high)
- lateral/smb → 79% TP (high)
- privesc/token → 76% TP (high)
- encoded/powershell → 68% TP (medium)
- geo/anomaly/country → 65% TP (medium)
- mfa/spray → 42% TP (medium)
- oauth/consent → 38% TP (medium)
- new service account → 30% TP (medium)
- password/reset → 22% TP → likely_fp (high)
- suspicious/signin → 28% TP → likely_fp (low)
- port/nonstandard → 20% TP → likely_fp (low)
- fallback → 45% TP (low)

**suggestedStatus logic:**
- `status === 'open' && tp ≥ 70` → `'investigating'`
- `status === 'open' && fp ≥ 70` → `'false_positive'`
- else → unchanged

### Preserved behaviors

- v0.7 Logs/query workflow unchanged
- v0.8 Evidence workspace unchanged
- v0.9 QueryPlan/adapters unchanged
- v1.0 AI orchestration/context panels unchanged
- Backend `AlertTriagePanel` (backend TriageResult fallback) preserved and tested
- Backend `triage_handler.py` unchanged — 145/145 pytest still passing

**Test status:** 145/145 pytest, 104 modules, 464KB bundle (vite v6)

---

### v0.9.1 — QueryPlan Explainability, Adapter Validation, and QueryPlan-Native Mock Execution

**What changed:**

| File | Change |
|------|--------|
| `apps/web/src/types/queryPlan.ts` | Added `ValidationCheck { name, passed, detail? }` and `ValidationResult { passed, warnings, checks }` |
| `apps/web/src/utils/mockResults.ts` | Exported `ALL_SIGNIN_ROWS`, `ALL_PROCESS_ROWS`, `ALL_NETWORK_ROWS`, `ALL_SECURITYEVENT_ROWS`, `signinEntities`, `processEntities`, `networkEntities`, `securityEventEntities`, `matchesFilter`; added `queryPlan?: QueryPlan` to `MockQueryResult` |
| `apps/web/src/utils/queryPlanValidator.ts` | **New** — `validateRenderedQuery(plan, rendered): ValidationResult`; checks: entity scope, time range, source selected, intent-specific conditions (failed_logins/suspicious_powershell/local_admin_creation/identity_inventory); non-blocking |
| `apps/web/src/utils/queryPlanResults.ts` | **New** — `generateResultsFromPlan(plan, rendered): MockQueryResult`; routes on `plan.intent` + `plan.entities` (not KQL text); attaches `sourcePlatform`, `queryLanguage`, `renderedQuery`, `queryPlan` metadata; all 15 intents covered |
| `apps/web/src/components/query/QueryPlanInspector.tsx` | **New** — compact expandable "Plan" section in QueryPreviewCard; shows intent, platform, language, source, time, entities, explanation, validation checks; warning badge in header when validation fails |
| `apps/web/src/components/query/AdapterCapabilities.tsx` | **New** — Source Catalog panel in Logs sidebar; lists each platform's language + source name mappings |
| `apps/web/src/components/SearchBar/QueryPreviewCard.tsx` | Switched `handleRun` to `generateResultsFromPlan(plan, rendered)`; added `queryPlan: plan` to both query and query_result save payloads; added `QueryPlanInspector` before Explanation; added validation warning badge in header |
| `apps/web/src/pages/LogsPage.tsx` | Added `AdapterCapabilities` to left sidebar |
| `apps/web/src/types/evidence.ts` | Added `queryPlanIntent?: string` to `EvidenceRelationship` |
| `apps/web/src/utils/evidenceGraph.ts` | Extended `QueryResultData` with `queryPlan?`; passes `queryPlanIntent` through `RelProvenance` into derived relationships |
| `apps/web/src/components/investigation/EvidenceGraph.tsx` | Relationship provenance panel now shows Intent row when `queryPlanIntent` present |
| `apps/web/src/App.tsx` | Version bumped to v0.9.1 |

**QueryPlan-native mock execution:**
- `generateResultsFromPlan` replaces `generateMockResults` in QueryPreviewCard's Run action
- Routes on `plan.intent` switch over all 15 intents — no KQL text parsing
- Entity filters applied directly from `plan.entities` array
- `sourceTable` kept as canonical Sentinel table name for evidence routing compatibility
- Result shape unchanged (`MockQueryResult`) with `queryPlan` attached

**Adapter validation:**
- `validateRenderedQuery(plan, rendered)` produces up to 4 checks
- Non-blocking: warning badge shown but execution not prevented
- Intent-specific checks: `failed_logins` → failure filter, `suspicious_powershell` → powershell keyword, `local_admin_creation` → event IDs 4720/4728, `identity_inventory` → identity source

**QueryPlan inspector:**
- Collapsed by default — zero visual noise on normal flow
- Expands to show: intent, platform, language, source, time range, entities, explanation, per-check validation status
- Warning badge in QueryPreviewCard header propagates validation failures up

**Source Catalog (AdapterCapabilities):**
- Shows all three adapters' source name mappings in the Logs left sidebar
- Neutral name → platform source (e.g. `sign-in-logs → SigninLogs` / `index=identity sourcetype=azure:signin` / `signin-logs`)

**Evidence provenance:**
- `EvidenceRelationship.queryPlanIntent` set from `queryPlan.intent` at artifact save time
- RelationshipRow expanded panel now shows Platform, Language, and Intent when all available

**All prior behaviors preserved:**
- Manual Logs workflow unchanged (`generateMockResults` still available; LogsPage uses it)
- AI-assisted workflow unchanged
- v0.8 Evidence workspace unchanged
- v0.9.0 adapter/platform-selector behavior unchanged

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
