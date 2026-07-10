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

## v1.1.1 — Command Palette Overlay, Search Result Layout Stability, and Alert Triage UX Polish

**Date:** 2026-07-07  
**Status:** Complete — 106 modules, zero TS errors, 145/145 pytest passing

### Root cause fixed

Command-bar results (`QueryPreviewCard`, chips, breadcrumbs, progress, disambiguation, text output) rendered in normal document flow **inside the sticky header** (`SearchBar`'s below-bar block). When a result appeared the header grew taller, pushing the entire page body down and leaving a large blank gap — the UI felt unstable. Additionally, `App.tsx` auto-navigated to Overview on every `actionData`, and `OverviewPage` swapped its whole body to a full-page result canvas, compounding the layout churn.

### Fix — floating command-palette overlay

Command results now render in a floating overlay anchored under the command bar; they never participate in document flow, so the header never grows and the page never shifts.

| File | Change |
|------|--------|
| `apps/web/src/components/SearchBar/CommandResultOverlay.tsx` | **New** — floating container: `absolute top-full mt-2 z-50` relative to the SearchBar's `relative` root, so it floats over page content without affecting layout. `max-h-[calc(100vh-140px)]` with internal `overflow-y-auto`; header strip with close (✕) button; Escape-to-close and outside-click-close (clicks on `[data-command-bar]` are ignored so the bar stays interactive). Lightweight console overlay — not a blocking modal, no backdrop that traps focus. |
| `apps/web/src/components/SearchBar/CommandResultBody.tsx` | **New** — shared result renderer extracted from `OverviewPage.MainPanel`. Renders the query preview card OR the rich action panels (triage/hunt/timeline/blast_radius/documentation/comparative/rule_suggestion/handoff/runbook/noise_coaching/evidence_summary/relationship_investigation) plus the AI orchestration meta (intent + `ModelModeBadge`, `ContextUsedPanel`, `ExecutionTrace`, `SaveAiOutputActions`) for non-panel-integrated handlers. Returns null for unrecognized handlers so the text fallback still applies. |
| `apps/web/src/components/SearchBar/SearchBar.tsx` | Below-bar content moved into `CommandResultOverlay` (opens only for an active/in-flight result — `currentResult \|\| actionData \|\| actionOutput \|\| isActionRunning \|\| actionProgress \|\| showDisambiguation` — never for lingering chips/breadcrumbs alone). Overlay `onClose` = `sessionStore.clear()`. Added `data-command-bar` to the root so outside-click ignores the bar. Ask button `disabled` no longer depends on `!sessionId` — only empty input or an in-flight command. |
| `apps/web/src/pages/OverviewPage.tsx` | Removed the full-page result canvas + `MainPanel` + `PANEL_INTEGRATED_HANDLERS` + all panel/orchestration imports and `useSessionStore`. Always renders the dashboard (the stable underlying page). Right column shows `WelcomeState` directly. Kept the v1.1.0 stable `alerts`-selector + `useMemo` stats (no getSnapshot loop). |
| `apps/web/src/App.tsx` | Removed the auto-navigate-to-Overview-on-`actionData` effect — results now float over whatever page the analyst is on (e.g. triage from Alerts stays on Alerts). Version label → **v1.1.1**. |
| `apps/web/src/hooks/useSearchBar.ts` | Client-side triage + evidence intercepts now run **before** the backend `classify` call (Step 0). They are deterministic and offline-capable, so those commands always route as actions (never KQL) and keep working when the backend is down — and Alerts-page buttons submit directly with no second Ask click. |
| `apps/web/src/hooks/useSession.ts` | On `createSession` failure, fall back to a non-persisted `local-<ts>` session id so the command bar stays usable (Ask enabled, client-side actions work); a real id is minted once the API returns. |
| `apps/web/src/types/alerts.ts` | `EnrichedTriageVerdict` gains `recommendedAction: string`. |
| `apps/web/src/utils/alertTriageEngine.ts` | Verdicts sorted by `tp_probability` (risk) descending; new `recommendAction(disp, status)` sets a per-verdict recommended action. |
| `apps/web/src/components/alerts/TriageResultPanel.tsx` | Scope summary sentence ("Triaged N open alerts. Showing top 12 by risk." / "…N selected alert(s)." / "…N visible open alerts from the current page."); shows top 12 by risk with Show-all / Show-top toggles; per-verdict "Rec" recommended-action line always visible. |

### How it behaves

- **No layout shift** — the overlay is `absolute`/out-of-flow, so the sticky header keeps its height and the dashboard/Alerts page underneath stays exactly where it was.
- **QueryPreviewCard** — renders inside the overlay with full platform selector, QueryPlan inspector, validation, run, save-to-case, open-in-Logs, explanation, and mock-planner indicator intact.
- **AI action output** — rich panels render in the overlay with model/privacy badge, Context Used, Execution Trace, Save as Note / Pin as Finding / Copy / Dismiss.
- **Session history** — breadcrumbs live inside the overlay (no page push, no blank region); the overlay closes fully on dismiss.
- **Triage direct-submit** — Triage selected / visible / all-open buttons on the Alerts page dispatch through `submitCommand` → client-side intercept → result overlay, with no second Ask click. Ask stays enabled when the bar is populated.
- **Triage scope wording** — every triage result states scope processed, count in scope, count processed, and count shown.
- **Backend-unavailable resilience** — fallback local session id keeps Ask enabled; classify/query/action failures are caught and degrade gracefully; client-side triage/evidence work fully offline.
- **Zustand safety** — no unstable selectors reintroduced; `OverviewPage` still selects the primitive `alerts` array and derives stats via `useMemo`. No getSnapshot warning, no maximum-update-depth loop.

### Keyboard / focus

- Escape closes the overlay (and the autocomplete dropdown).
- Enter submits; Shift+Enter inserts a newline (unchanged).
- The command bar is never covered — the analyst can immediately type another command.

### Known limitations

- The overlay is width-aligned to the command bar (`max-w-3xl`); very wide panels render in a slightly narrower column than the old full-page canvas.
- Session-history breadcrumbs are only visible while the overlay is open (alongside an active result), not as a standalone always-on dropdown.
- If the command bar is expanded to 3 rows, the overlay anchors just under the actual bar (via `top-full`) — no fixed-offset overlap.

**Test status:** 145/145 pytest, 106 modules, 467KB bundle (vite v6). Safe to commit as **v1.1.1-command-overlay-triage-ux**.

---

## v1.1.2 — Shell Navigation, Scratch Mode, and Command Overlay Stability

**Date:** 2026-07-07  
**Status:** Complete — 107 modules, zero TS errors, 145/145 pytest passing. Stabilization patch (no new features).

### Issues fixed

1. SentinelIQ logo was not a home button.
2. Logs case-target dropdown could not stay on "None (scratch only)" — it reverted to the active investigation.
3. Command overlay could open after Ask and immediately close.
4. Overlay outside-click was too aggressive; native select interactions could be read as outside clicks.

### Changed / new files

| File | Change |
|------|--------|
| `apps/web/src/utils/overlayGuards.ts` | **New** — `OVERLAY_OPEN_GRACE_MS = 300` and `isInsideOverlaySafeZone(target, ...roots)`. Centralizes the "is this a genuine outside click?" test: ignores the overlay panel, `[data-command-bar]`, `[data-command-overlay]`, and `[data-overlay-ignore]` subtrees. |
| `apps/web/src/components/SearchBar/CommandResultOverlay.tsx` | Root marked `data-command-overlay`. Outside-click handler now (a) ignores any click within `OVERLAY_OPEN_GRACE_MS` of open via an `openedAtRef` captured at construction — this absorbs the opening click and StrictMode re-mount races — and (b) uses `isInsideOverlaySafeZone`. Removed the fragile `setTimeout(0)` listener-attach. Escape closes reliably. Minimal `console.debug('[SentinelIQ] overlay:…')` diagnostics (open / unmount / close reason). |
| `apps/web/src/App.tsx` | Logo/brand is now a `<button onClick={goHome}>` ("Return to SOC home"). `goHome()` calls `sessionStore.clear()` (closes overlay + clears transient command result) then navigates to Overview — it does **not** reload or touch persisted stores, so active case, alerts, logs editor, saved/recent queries, and evidence all survive. If already on Overview it just clears the transient result. Version label → **v1.1.2**. |
| `apps/web/src/stores/logsStore.ts` | Exported `SCRATCH_CASE_TARGET = 'scratch'` sentinel. `caseTargetId` now has three meanings: `null` (unset → default to active case), a real id, or `'scratch'` (explicitly no case). |
| `apps/web/src/pages/LogsPage.tsx` | `isScratch = caseTargetId === SCRATCH_CASE_TARGET`; `effectiveCaseTargetId = isScratch ? null : (caseTargetId ?? activeInvestigationId)`. Select `value` and `onChange` use the sentinel (no empty-string coercion). In scratch mode Save-to-Case / Pin / Save-as-Note are hidden and a "Scratch mode — select a case to save" chip is shown; Run Query still works and results stay scratch. The case-target row is marked `data-overlay-ignore` so changing the target never dismisses an open command overlay. |

### Why the overlay was closing immediately

The previous handler attached a `mousedown` listener via `setTimeout(0)` and relied on a `querySelector('[data-command-bar]')` contains-check. Under React StrictMode (dev) the mount → cleanup → mount cycle plus the click/pointer sequence that opened the overlay could race, so the very click that triggered the result was occasionally treated as an "outside click," closing the overlay a fraction of a second after it appeared.

**Fix:** capture `openedAtRef` at construction and unconditionally ignore any outside click within a 300 ms grace window, then apply the shared safe-zone test. The overlay now cannot close within that window, and only closes on a true outside click, the ✕ button, Escape, or explicit dismiss.

### Overlay close rules (v1.1.2)

- **Closes on:** ✕ button, Escape, genuine outside click (after grace window), explicit Dismiss, and intentional navigations ("Open in Logs", logo Home).
- **Stays open during:** typing a new command, viewing/expanding QueryPreviewCard (Plan, Explanation, Context Used, Execution Trace), switching platform, running a query in the preview, saving to case, changing the Logs case target (`data-overlay-ignore`), and interacting with the Alerts page.
- Clicking Ask, the command bar, or anything inside the overlay never closes it.

### Preserved (no regressions)

- **No layout shift** — overlay is still `absolute top-full` out of flow; header never grows, page never moves, internal scroll intact.
- **Ask resilience** — `disabled` depends only on empty input or an in-flight command (no `!sessionId`); `useSession` still falls back to a `local-<ts>` id when the backend is down.
- **Triage direct-submit** — Alerts Triage selected/visible/all-open still dispatch through `submitCommand` → client-side intercept → overlay, no second Ask click.
- **Zustand safety** — no unstable selectors reintroduced.
- v1.1.0 alerts, v1.0 orchestration panels, v0.9 QueryPlan/adapters, v0.8 Evidence, v0.7 Logs all unchanged.

### Known limitations

- The 300 ms open-grace window means an intentional outside-click to dismiss within the first 300 ms of opening is ignored (click again).
- Scratch selection persists to `localStorage` (`sentinel-iq-logs-v1`), so "None (scratch only)" survives refresh by design.
- Native `<select>` dropdowns are marked safe only where explicitly needed (Logs case target); other native selects outside the overlay still count as outside clicks.

**Test status:** 145/145 pytest, 107 modules, 468KB bundle (vite v6). Safe to commit as **v1.1.2-shell-overlay-stability**.

### v1.1.2 (part 2) — Global Command Bar Reliability

Follow-up hardening of the command-bar state machine so the primary AI entrypoint is deterministic and resilient. No new features.

**Root cause of the flakiness:** the command flow gated on `sessionId` in two places — the Ask `disabled` prop (fixed in v1.1.1) and, still, the `submit()` early-return (`if (!submittedText || !sessionId) return`). Because `useSession` created the session **asynchronously** (and only fell back to a local id inside the `catch` after the network attempt), there was a window — right after a refresh, and the whole time the backend was down — where `sessionId` was `null`, so `submit()` silently returned and nothing happened. Combined with query failures that produced no visible feedback, the bar felt "dead."

**Fixes:**

| File | Change |
|------|--------|
| `apps/web/src/hooks/useSession.ts` | Sets an **immediate** `local-<ts>` session id synchronously on mount (no network wait), then best-effort upgrades to a real backend session in the background. `sessionId` is therefore never `null` after first render — Ask and client-side actions work instantly after a refresh and while the backend is down. |
| `apps/web/src/hooks/useSearchBar.ts` | `submit()` early-return relaxed to `if (!submittedText) return` — client-side intercepts (triage/evidence) no longer require a session and run fully offline. A defensive `if (!sessionId)` guard sits only in front of the backend classify/query/stream path (shows a non-blocking "Session initializing" note, never disables Ask). Query failures now surface a formatted `Error:` in the overlay (previously swallowed) and always reset `isLoading` in `finally`. Concise `[command] submit start / blocked / result set` diagnostics. |
| `apps/web/src/components/SearchBar/SearchBar.tsx` | Ask now uses a single derived `canSubmit = text.trim().length > 0 && !isRunning` (`isRunning = isLoading || isActionRunning`). It depends only on visible text + running state — never sessionId, autocomplete health, past errors, overlay state, or stale classification. |
| `apps/web/src/utils/commandRunner.ts` | `submitCommand` trims and no-ops on empty prompt, dispatches the explicit prompt (never depends on React state landing first), and logs `[command] submit start / complete / failed / blocked`. Added `alerts_triage` to `CommandSource`. |
| `apps/web/src/pages/AlertsPage.tsx` | Triage buttons submit via `submitCommand(prompt, { source: 'alerts_triage' })` — direct-submit, no second Ask click. |

**Reliability contract (v1.1.2 final):**
- **Ask enabled** ⇔ non-empty trimmed text AND no command running. Nothing else can disable it.
- **submitCommand is authoritative**: one entry, explicit prompt, clears stale errors, sets/*resets* running, routes intercept-first then backend, opens the overlay.
- **Backend outage**: `/session` and `/autocomplete` failures are non-blocking; `/action` and `/query` failures show a formatted error and reset running; the next command works; client-side mock triage/evidence keep working offline; a real session is minted automatically when the API returns.
- **Overlay** (from v1.1.2 part 1): opens on result/preview/action output; closes only on ✕, Escape, genuine outside-click (after a 300 ms open-grace window), Dismiss, or intentional navigation. Grace window + `[data-command-bar]`/`[data-command-overlay]`/`[data-overlay-ignore]` safe zones prevent the open-then-immediately-close race.
- **No** raw JSON output (isRawJson guard + panel routing), **no** getSnapshot warning / update-depth loop (stable `alerts` selector + `useMemo`), **no** RealSIEMProvider calls in mock mode (backend unchanged, 145/145 green).

**Known limitations:**
- During the sub-second window before the background `/session` upgrade lands, a live backend may receive a `local-<ts>` id on the very first command; classify falls back to query mode if the backend rejects it, and the id is replaced moments later. No user-visible impact in mock mode.
- The 300 ms overlay open-grace window still applies (an intentional dismiss-click within 300 ms of opening is ignored).

**Test status:** 145/145 pytest, 107 modules, 468KB bundle (vite v6). Safe to accept as **v1.1.2-global-command-bar-reliability**.

---

## v1.1.3 — In-Page Alert Triage Workspace, Alert Lifecycle Actions, and Scratch Context UX

**Date:** 2026-07-07  
**Status:** Complete — 113 modules, zero TS errors, 145/145 pytest passing.

Makes alert triage a first-class **in-page** SOC workflow (distinct from the global command overlay), adds a full alert lifecycle with an auditable trail, an alert detail panel, investigation-guidance next actions, case-aware linking, and a clearer Scratch (no active case) mode.

### New files

| File | Purpose |
|------|---------|
| `apps/web/src/components/alerts/AlertTriageWorkspace.tsx` | In-page triage workspace. Per-alert decision rows (disposition, confidence, current→recommended status, reason, evidence used, recommended action, recommended next actions), stageable manual decisions (Keep Open / Investigating / False Positive / Close / Suppress), case-linking control, a live "Will apply: …" preview, an **Apply Triage Decisions** action, and an after-apply confirmation summary ("No alerts were removed from the system"). |
| `apps/web/src/components/alerts/AlertDetailPanel.tsx` | Full alert detail: all fields, related entities, linked investigation, triage rationale (when triaged), audit trail, and manual lifecycle + link/save actions. |
| `apps/web/src/components/alerts/AlertStatusActions.tsx` | Reusable manual lifecycle buttons (Investigating / False Positive / Close / Suppress / optional Keep Open). Every action is an explicit analyst decision — nothing auto-closes/suppresses. |
| `apps/web/src/components/alerts/AlertAuditTrail.tsx` | Read-only append-only lifecycle history (timestamp · prev→new · reason · actor). |
| `apps/web/src/components/alerts/alertStyles.ts` | Shared severity/status style + label maps and `RESOLVED_STATUSES`. |
| `apps/web/src/components/common/ActiveCaseSelector.tsx` | Reusable case destination picker with an explicit "No case (scratch)" option. |

### Changed files

| File | Change |
|------|--------|
| `apps/web/src/types/alerts.ts` | Added `AlertAuditEvent` and `MockAlert.auditTrail?`; added `entityType` + `recommendedNextActions` to `EnrichedTriageVerdict`. |
| `apps/web/src/stores/alertStore.ts` | `applyStatusChange(ids, status, reason?)` now appends an audit event per alert and no longer clears selection; new `linkAlertsToCase(ids, caseId, caseTitle)` (audit event, no status change) and `getAlertById(id)`. |
| `apps/web/src/utils/alertTriageEngine.ts` | Verdicts now carry `entityType` and `recommendedNextActions` — disposition-specific investigation guidance (TP: timeline/blast-radius/link-to-case/assign; Uncertain: enrichment/baseline/similar; FP: mark-FP/suppress/tune/note, never auto-close). |
| `apps/web/src/pages/AlertsPage.tsx` | Triage buttons now compute triage **locally** (`triageAlerts(getTriageAlerts(scope), scope)`) into page-local state and render `AlertTriageWorkspace` in-page — they no longer go through `submitCommand`/the global overlay. Rows are clickable → `AlertDetailPanel`. |
| `apps/web/src/components/AppShell/Sidebar.tsx` | Scratch card now reads "No Active Case · Scratch Mode" with a one-line explanation that new activity won't attach to a case and save/pin/link will ask for a destination. |
| `apps/web/src/App.tsx` | Version label → **v1.1.3**. |

### How it works

- **In-page vs global separation** — Alerts-page buttons (Triage selected/visible/all-open) run the deterministic engine locally and render the workspace inside the Alerts page. Typing "Triage my open alerts" in the **global command bar** still routes through the `useSearchBar` intercept → command overlay (`TriageResultPanel`), unchanged. Two clearly separate surfaces.
- **Decision visibility before apply** — each row shows alert ID, name, entity, severity, AI disposition, confidence, current→recommended status, reason, evidence used, recommended action, and recommended next actions. The analyst can override any decision; a live preview shows exactly how many will move to each status and how many will link to the case.
- **Apply feedback** — Apply groups decisions by target status, calls `applyStatusChange(..., 'triage decision')`, optionally links TP alerts to the chosen case, and shows a confirmation summary. Resolved alerts (Closed / False Positive / Suppressed) drop out of the Open tab automatically (status filter) but remain under All and their status filter — nothing is deleted.
- **Per-alert manual actions & detail** — every triage row and the detail panel expose manual lifecycle actions plus Open Alert / Link to case / Save as Finding (case-gated). AI never auto-closes/suppresses.
- **Audit trail** — status changes and case links append `AlertAuditEvent`s (timestamp, prev→new, actor `analyst_1`, reason), shown in the detail panel.
- **Scratch mode & case-aware linking** — active-case card clearly shows Scratch/No-active-case; triage linking uses the active case when present or prompts "No active case — create or select a case"; the `ActiveCaseSelector` lets the analyst pick any destination or scratch. No auto-save; investigation data is never erased.
- **Triage guides investigation, not remediation** — the workspace states plainly that marking an alert Investigating routes it for analysis and does **not** remediate/clear the account or system; only Close / False Positive / Suppress resolve an alert.
- **Count consistency** — all counts (sidebar badge, Alerts header, status tabs, Overview cards) derive from `alertStore` and update reactively after lifecycle actions.

### Preserved (no regressions)

- Global command overlay, QueryPreviewCard, AI summaries, evidence summary, and command-bar reliability (v1.1.2) unchanged.
- No layout shift; stable Zustand selectors (no getSnapshot loop); no raw JSON; backend untouched (145/145).

### Known limitations

- The in-page workspace lists the top 25 verdicts by risk with a show-all toggle (large all-open triage stays readable).
- "Save as Finding" targets the **active** case; linking to a non-active case sets the alert's `linkedInvestigationId` but does not switch the active investigation.
- Alert state (statuses, audit trail) is in-memory in `alertStore` and resets on refresh — persistence is a Phase 3 item.

**Test status:** 145/145 pytest, 113 modules, 492KB bundle (vite v6). Safe to commit as **v1.1.3-alert-triage-workspace**.

---

## v1.1.4 — Alert Detail Triage Actions, Decision Reversal, and Case Routing Polish

**Date:** 2026-07-08  
**Status:** Complete — 116 modules, zero TS errors, 145/145 pytest passing.

Rounds out the SOC triage loop: **single alert → detail-panel actions**, **multiple alerts → batch workspace**, **global command → overlay summary**. Adds direct single-alert triage (no checkbox), alert-type-specific next actions, prominent case routing, state-aware lifecycle actions with Reopen/Undo, and cleaner "no pending change" apply behavior.

### New files

| File | Purpose |
|------|---------|
| `apps/web/src/utils/alertNextActions.ts` | `getAlertNextActions(alert)` — concrete, alert-type-specific investigation steps keyed on detection rule / entity (Impossible Travel, Credential Dump, Encoded PowerShell, OAuth Consent, lateral movement, C2, priv-esc, geo, MFA spray, new account, password reset, port, suspicious sign-in, + default). Advisory only. |
| `apps/web/src/components/alerts/AlertTriageRecommendation.tsx` | Reusable single-alert recommendation block — disposition badge, TP/FP/confidence, reason, evidence used, recommended action, recommended next actions. |
| `apps/web/src/components/alerts/AlertCaseActions.tsx` | Prominent case routing: link to active case, link to existing case (dropdown), create new investigation from alert, keep scratch. Suggests the active case only on entity/evidence overlap. Never auto-links. |

### Changed files

| File | Change |
|------|--------|
| `apps/web/src/components/alerts/AlertDetailPanel.tsx` | Now a full single-alert triage surface (no checkbox needed): computes a triage verdict on the fly when none passed in (`triageAlerts([alert], 'selected')`), renders `AlertTriageRecommendation` with `getAlertNextActions`, `AlertCaseActions`, state-aware `AlertStatusActions` (immediate), an **Undo last action** button, per-status lifecycle feedback messages, and the audit trail. |
| `apps/web/src/components/alerts/AlertStatusActions.tsx` | Added `variant='immediate'` — state-aware transitions per current status (Open / Investigating / Acknowledged / Closed / False Positive / Suppressed / Escalated) incl. Reopen, Acknowledge, Unsuppress. `variant='stage'` (batch decision staging) unchanged. |
| `apps/web/src/stores/alertStore.ts` | Added `undoLastAction(id)` — reverts to the previous status from the latest status-change audit event and appends an "undo last action" event (append-only, nothing deleted). Reopen is `applyStatusChange(id, 'open', 'manual reopen')`. |
| `apps/web/src/components/alerts/AlertTriageWorkspace.tsx` | Apply button disabled when there are no staged changes ("No pending triage changes."); rows already in a resolved status show "already {Status}, no change recommended"; no more all-zeros applied summary. |
| `apps/web/src/App.tsx` | Version label → **v1.1.4**. |

### How it works

- **Single-alert triage** — clicking any alert row opens `AlertDetailPanel`, which shows the full AI triage recommendation for that one alert (computed on the fly) plus case routing and lifecycle actions. No checkbox / batch workspace needed for single alerts.
- **Recommended next actions** — `getAlertNextActions` returns concrete, rule-specific steps (e.g. Impossible Travel → run failed sign-ins, review MFA/CA, build timeline, map blast radius, save finding).
- **Case actions** — link to active case, link to an existing case via dropdown, create a new investigation from the alert (auto-titled + linked), or keep scratch; active case is only *suggested* on entity/evidence overlap; scratch shows "No active case — create or select a case."
- **State-aware actions** — the detail panel shows only sensible transitions for the current status; resolved alerts expose Reopen (and Unsuppress for suppressed).
- **Reopen / Undo** — Reopen returns an alert to Open with a "manual reopen" audit event; Undo reverts the last status change (audit-driven) and records the reversal.
- **No-change apply** — the batch Apply button disables with "No pending triage changes." when nothing is staged, so the analyst never sees a confusing all-zeros summary; resolved rows read "already {Status}, no change recommended."
- **Lifecycle feedback** — status changes surface an inline confirmation, e.g. "Alert ALT-013 marked Investigating. This routes it for analysis; it does not remediate the host/account." / "…closed. It remains available under All and Closed." / "…marked False Positive. Consider tuning the detection if repeated."
- **Counts & filters** — all counts (sidebar badge, header, tabs, Overview) derive from `alertStore`; resolved alerts leave the Open view but remain under All and their status filter; nothing is deleted.

### Preserved (no regressions)

- Batch triage (Triage selected / visible / all-open) and the in-page workspace unchanged aside from the apply-button polish.
- Global command "Triage my open alerts" → command overlay summary; command-bar + overlay reliability unchanged.
- Evidence / investigation workflows, stable Zustand selectors (no getSnapshot loop), backend untouched (145/145).

### Known limitations

- Vite reports the JS bundle just over 500 KB (advisory only, not a build failure) — code-splitting is deferred.
- "Undo last action" reverts only the most recent status-change event (single-level undo), not a full multi-step timeline rewind.
- Alert state (statuses, audit trail, links) is in-memory in `alertStore` and resets on refresh — persistence remains a Phase 3 item.

**Test status:** 145/145 pytest, 116 modules, 502KB bundle (vite v6). Safe to commit as **v1.1.4-alert-detail-triage-actions**.

---

## v1.1.5 — Scratch-First Landing, Case Workspace Memory, and Per-Workspace State Restore

**Date:** 2026-07-10  
**Status:** Complete — 120 modules, zero TS errors, 145/145 pytest passing. Workflow-continuity patch (no new major phase, no DB).

Two parts. **(a) Workspace switcher + memory:** the active-case card is a real workspace switcher with an explicit **Scratch Mode / No Active Case** option and per-workspace memory of where the analyst left off; the active case is a **context lens + default save target**, never an auto-save destination. **(b) Scratch-first landing + per-workspace Logs:** the app now boots into **Scratch Mode** (no case hardcoded active), and Logs editor state is snapshotted/restored per workspace.

### Scratch-first landing (part b)

- `investigationStore` default `activeInvestigationId` changed from `'INV-001'` → **`null`**. Fresh launch shows "No Active Case · Scratch Mode"; jsmith/LAPSUS$ fixtures still exist and are selectable. `investigationStore` is **not persisted**, so there is no stale `INV-001` to migrate — the change alone fixes the landing.
- `App.tsx` runs a one-time launch guard: if there is no active case on load, `restoreWorkspaceLogs('scratch')` resets the Logs editor to a fresh scratch state so a previously-persisted case target / query can't leak into Scratch.

### Per-workspace Logs (part b)

- `utils/workspaceMemory.ts` adds `snapshotWorkspaceLogs(id)` / `restoreWorkspaceLogs(id)`. On a workspace switch, `Sidebar.switchWorkspace` snapshots the outgoing case's Logs editor (kql, platform, case target — **not** results) into its checkpoint, then restores the incoming workspace: a case restores its saved editor (or an empty editor targeting that case); **Scratch is always reset fresh** (empty kql, scratch target, results cleared). This makes Logs feel workspace-scoped without rewriting the global `logsStore`.
- `InvestigationWorkspacePage` restores the last investigation **tab** from the case checkpoint on mount and records it on change (so re-opening jsmith returns to e.g. the Evidence tab).

### New files

| File | Purpose |
|------|---------|
| `apps/web/src/types/workspace.ts` | `CaseWorkspaceState` (lightweight per-workspace UI memory: lastPage, lastInvestigationTab, selected entity/alert/artifact/report, logs/alerts/reports sub-state), `SCRATCH_WORKSPACE_ID`, `WORKSPACE_SCHEMA_VERSION`, `emptyWorkspace()`. UI-state only — never investigation memory. |
| `apps/web/src/stores/workspaceStore.ts` | Zustand + `persist` (versioned key `sentinel-iq-workspace-v1`, `version` + `migrate` that drops any unknown/older blob instead of trusting it). `getWorkspace` (non-reactive), `patchWorkspace`, `setLastPage`, `setInvestigationTab`. Documented as the `LocalWorkspaceMemoryProvider` for a future v1.2 backend provider. |
| `apps/web/src/utils/workspaceMemory.ts` | `workspaceIdFor(activeInvestigationId)` (`null` → `'scratch'`), `isScratchWorkspace()`, `snapshotWorkspaceLogs`/`restoreWorkspaceLogs`, and the v1.2 provider boundaries (`LocalWorkspaceMemoryProvider`, `FutureDatabaseWorkspaceMemoryProvider`, `FutureSiemWorkspaceContextProvider`). |
| `apps/web/src/components/common/WorkspaceModeBadge.tsx` | Context indicator — "Scratch Mode" or "Case: {title}". |

### Changed files

| File | Change |
|------|--------|
| `apps/web/src/stores/investigationStore.ts` | Default `activeInvestigationId` `'INV-001'` → **`null`** (scratch-first landing). |
| `apps/web/src/components/AppShell/Sidebar.tsx` | Case-switcher dropdown now includes an explicit **"○ Scratch Mode / No Active Case"** option. New `switchWorkspace(targetId)` no-ops on same-workspace; otherwise saves the outgoing workspace's last page, **snapshots its Logs editor**, closes the command overlay (`sessionStore.clear()`), sets the active case (or Scratch), **restores the incoming workspace's Logs** (Scratch reset fresh), then navigates to the incoming workspace's last page (default: case → investigation-workspace, scratch → overview). The × control and the scratch-mode `<select>` route through it too. |
| `apps/web/src/pages/InvestigationWorkspacePage.tsx` | Restores/records the active tab per case via the workspace checkpoint. |
| `apps/web/src/App.tsx` | Records `lastPage` per workspace on navigation; one-time scratch-launch Logs reset; version label → **v1.1.5**. |
| `apps/web/src/pages/OverviewPage.tsx` | Adds a workspace lens row: `WorkspaceModeBadge` + a scratch/case context line ("Neutral SOC workspace — work stays scratch until you save or link it to a case." vs "Working in {case} — AI actions default to this case; saves still need explicit approval.") and an "Open case workspace →" shortcut when a case is active. |
| `apps/web/src/pages/ReportsPage.tsx` | Report context selector reads "— No report context (choose a case) —"; when none is selected it shows an amber note that Scratch Mode does not auto-use the last case. |

### How it works

- **Scratch Mode** — selecting Scratch (or clearing the active case) sets `activeInvestigationId = null`. The command bar/AI already read the live active id, so nothing silently uses INV-001/jsmith; save/pin/link actions already require an explicit destination (Logs case target, `AlertCaseActions`, Reports context). Investigation data is untouched; no hard refresh.
- **Active case as context lens** — an active case is the *default* context and suggested save target only. It never auto-saves queries, auto-links alerts, or auto-pins AI output — every write still goes through an explicit analyst action (Save to Case / Pin Finding / Link Alert / Save as Note / Save Report / Create Artifact).
- **Per-case workspace memory** — `workspaceStore` remembers each workspace's `lastPage` (and has slots for last investigation tab, selected entity/alert/artifact/report, and logs/alerts/reports sub-state, recorded for v1.2). Switching cases restores the last page; the model is structured so v1.2 can restore the finer-grained selections.
- **Switching cases** — `switchWorkspace` persists the outgoing workspace's page, closes any transient overlay, flips the active case, and navigates to the incoming workspace's remembered page. Command overlays deliberately close on switch (not restored).
- **Evidence** — already case-scoped: the investigation workspace shows "No investigation selected" in Scratch, so no stale jsmith evidence appears.
- **Reports** — context defaults to the active case, but in Scratch it starts with no context and prompts the analyst to choose one.
- **Logs / Alerts** — unchanged working behavior: Logs scratch/case target (v1.1.2) and `AlertCaseActions` (v1.1.4) already require explicit case selection to save/link; both remain fully usable in Scratch.
- **Soft home** — the logo `goHome` (v1.1.2) still navigates to Overview, closes overlays, clears the transient result, and preserves the active-case/Scratch selection and all stores.
- **Stale-state safety** — the persisted workspace blob is guarded by a versioned key + `migrate` that discards unknown/older shapes; `getWorkspace` always returns a safe default; missing fields are optional.
- **v1.2 prep** — `workspaceStore` = `LocalWorkspaceMemoryProvider`; `workspaceMemory.ts` documents the `FutureDatabaseWorkspaceMemoryProvider` surface so persistence can be swapped in without touching UI callers.

### Preserved (no regressions)

- Command overlay + search-bar reliability, QueryPreviewCard/QueryPlan/adapters, Evidence graph, Context Used/Execution Trace, Save/Pin, Reports detail, Handoff, noise coaching, alert triage workspace/detail/lifecycle — all unchanged. Stable Zustand selectors (workspace reads are non-reactive `getState()` in handlers/effects — no getSnapshot loop). Backend untouched (145/145).

### Known limitations

- Restored on switch today: `lastPage`, last **investigation tab**, and case **Logs editor** (kql/platform/target). Finer selections (selected entity/alert/artifact/report, Alerts filters) are modeled in `CaseWorkspaceState` and can be recorded but are not yet force-restored (deferred to v1.2 to avoid fighting existing per-page stores). Logs query **results** are never snapshotted (re-run cheaply).
- Scratch is treated as ephemeral: switching into Scratch (and fresh launch) resets the Logs editor; an unsaved scratch query is not preserved across a workspace switch.
- Workspace memory persists to localStorage; investigation/alert content is still in-memory and resets on refresh.
- Vite bundle ~505 KB (advisory only, not a failure) — code-splitting deferred.

### Next recommended phase

**v1.2 — Persistence / local database foundation:** back `investigationStore`, `alertStore`, and `workspaceStore` with a persistent local store (implement `FutureDatabaseWorkspaceMemoryProvider`; wire `FutureSiemWorkspaceContextProvider`), and restore the finer-grained per-case workspace selections.

**Test status:** 145/145 pytest, 120 modules, 505KB bundle (vite v6). Safe to commit as **v1.1.5-scratch-case-workspace-memory**.

---

## v1.1.6 — Workspace Memory Coverage for Alerts, Evidence, Reports, Hunts, and Selected Case State

**Date:** 2026-07-10  
**Status:** Complete — 121 modules, zero TS errors, 145/145 pytest passing. Workspace-continuity coverage patch (still frontend/local memory — no DB).

Extends v1.1.5's per-workspace memory (which covered only `lastPage`, investigation tab, and Logs editor) to the remaining main SOC surfaces: **Alerts** filters/selection/detail, **Evidence** node/relationship selection, **Reports** context/selected report, and **Hunts** template/recent-hunt selection. Scratch stays ephemeral everywhere. The active case remains a context lens + default save target — nothing auto-saves/links/pins.

### Audit of v1.1.5 `CaseWorkspaceState` (starting point)

| Field | Was |
|-------|-----|
| `lastPage` | ✅ working (App + Sidebar) |
| `lastInvestigationTab` | ✅ working (InvestigationWorkspacePage) |
| `logsState` (kql/platform/caseTarget) | ✅ working (snapshot/restore); `lastResultId` unused |
| `selectedEntityId` / `selectedAlertId` / `selectedArtifactId` / `selectedReportId` (top-level) | ❌ defined, never written/read |
| `alertsState` / `reportsState` | ❌ defined, never written/read |
| Hunts / Rules page state | ❌ fully static (no selection state) |

### Two mechanisms (by state ownership)

1. **Global-store-backed surfaces → centralized snapshot/restore** (`utils/workspaceMemory.ts`), called on workspace switch (Sidebar) + launch (App):
   - **Logs editor** (`snapshotWorkspaceLogs`/`restoreWorkspaceLogs`, from v1.1.5).
   - **Alerts UI state** (`snapshotWorkspaceAlerts`/`restoreWorkspaceAlerts`, new): status filter, severity filter, Load-More `visibleCount`, and selected alert ids — all held in the global `alertStore`. Alert *data* (statuses, audit trail, links) is global SOC state and is **never** workspace-scoped.
   - Unified entry points: **`snapshotCurrentWorkspace(id)`** and **`restoreWorkspace(id)`** compose the above. Scratch → reset to fresh defaults.
2. **Page-local ephemeral selections → owned by the page** (read checkpoint on mount, validated; record on change; skip persistence in Scratch):
   - **Alerts** open detail panel (`AlertsPage`, `alertsState.detailAlertId`).
   - **Evidence** selected node + expanded relationship (`EvidenceGraph`, new `evidenceState`).
   - **Reports** context + selected report (`ReportsPage`, `reportsState`).
   - **Hunts** selected template + recent hunt (`HuntsPage`, new `huntsState`).

### New files

| File | Purpose |
|------|---------|
| `apps/web/src/utils/workspaceRestoreGuards.ts` | Restore-validation guards — `isValidAlertId`, `isValidInvestigationId`, `filterValidAlertIds`, `coerceStatusFilter`, `coerceSeverityFilter`. Non-reactive `getState()` reads, safe in `useState` initializers/effects. A stale/removed id or bad enum is dropped so restore can never crash a page or show a dangling detail panel. |

### Changed files

| File | Change |
|------|--------|
| `apps/web/src/types/workspace.ts` | Extended `CaseWorkspaceAlertsState` (`visibleCount`, `detailAlertId`); `reportsState` ids made nullable; added `CaseWorkspaceEvidenceState` (`selectedEntityNodeId`, `expandedRelId`) + `CaseWorkspaceHuntsState` (`selectedHuntPrompt`, `selectedHuntId`) and wired both onto `CaseWorkspaceState`. |
| `apps/web/src/stores/workspaceStore.ts` | Added nested shallow-merge setters `patchAlertsState` / `patchReportsState` / `patchEvidenceState` / `patchHuntsState` so partial sub-state updates never clobber siblings. |
| `apps/web/src/stores/alertStore.ts` | Added `hydrateUi({status,severity,visibleCount,selectedIds})` and `resetUi()` — UI-only hydration/reset (never touches alert data). |
| `apps/web/src/utils/workspaceMemory.ts` | Added `snapshotWorkspaceAlerts`/`restoreWorkspaceAlerts` + unified `snapshotCurrentWorkspace`/`restoreWorkspace`. |
| `apps/web/src/components/AppShell/Sidebar.tsx` | `switchWorkspace` now calls `snapshotCurrentWorkspace(outgoing)` / `restoreWorkspace(incoming)` (was Logs-only). |
| `apps/web/src/App.tsx` | Launch guard resets the whole scratch workspace (`restoreWorkspace('scratch')`); version label → **v1.1.6**. |
| `apps/web/src/pages/AlertsPage.tsx` | Detail panel (`detailAlertId`) restored per case (validated) and recorded on change; Scratch starts with no detail. |
| `apps/web/src/components/investigation/EvidenceGraph.tsx` | Selected node + expanded relationship restored from the case checkpoint (existing node-existence effect validates a stale id) and recorded on change. |
| `apps/web/src/pages/ReportsPage.tsx` | Report context + selected report restored per workspace (context validated; unset defaults to active case; Scratch → none) and recorded on change. |
| `apps/web/src/pages/HuntsPage.tsx` | Added lightweight `selectedHuntPrompt`/`selectedHuntId` selection with highlight; restored per case and recorded on change; Scratch → neutral templates. |

### How each surface behaves

- **Alerts** — filters (status/severity), Load-More count, and selection restore on entering a case; the open detail panel restores too (validated — a removed alert is ignored). Entering Scratch resets filters to default and clears selection/detail. Alert lifecycle decisions and audit trail remain in `alertStore` (global), not workspace memory; in-progress triage workspace is **not** auto-restored.
- **Evidence** — reopening a case reopens the previously selected entity (e.g. DESKTOP-42) and expanded relationship if still valid. Evidence is inherently case-scoped: Scratch has no active case, so the investigation workspace shows "No investigation selected" — no stale jsmith evidence.
- **Reports** — reopening a case restores its report context and open report detail. Scratch shows "— No report context (choose a case) —" and does not auto-use the last case; generating a case-specific report still requires selecting one.
- **Hunts** — reopening a case restores the selected hunt template / recent hunt (highlighted). Scratch resets to neutral templates with no case-specific hunt. Only lightweight prompt/template + recent-hunt id are stored — **no** hunt result payloads (saved hunt outputs become investigation artifacts through the normal action flow).

### Rules — deferred (documented)

`RulesPage` is a static fixture table whose only interactions are "Tune →" prompts routed to the AI bar via `setPendingQuery`. There is no selected-rule detail view or noise-coaching result surface to remember, so per-workspace Rules memory would store nothing meaningful. **Deferred** until Rules gains a selectable rule detail / noise-coaching result (candidate for a later patch).

### Scratch stays ephemeral

Switching into Scratch (and fresh launch) runs `restoreWorkspace('scratch')` → resets the Logs editor (empty, scratch target) and Alerts filters/selection to defaults. All page-local persisters **skip writes when the workspace is Scratch**, and all restore initializers return defaults for Scratch — so no case-selected alert detail, evidence node, report context, or hunt selection ever appears in Scratch, and Scratch never restores a prior scratch checkpoint.

### Intentionally NOT restored (transient)

Command-palette overlay open state, autocomplete suggestions, running/loading state, unsaved AI output panels, query preview overlays, and backend error messages — all transient and closed on workspace switch (`sessionStore.clear()`), never persisted. Logs query **results** and hunt **result payloads** are also never snapshotted (heavy / re-run cheaply).

### Restore validation (no stale crashes)

Every restored id is validated before use: alert ids via `isValidAlertId`/`filterValidAlertIds` (alert store), investigation/report-context ids via `isValidInvestigationId`, report ids against the report fixture, evidence node ids against derived nodes (existing cleanup effect), and persisted filter values coerced via `coerceStatusFilter`/`coerceSeverityFilter`. Invalid values are dropped and the page falls back to its default view.

### Preserved (no regressions)

- Scratch-first landing, per-workspace Logs restore, alert triage workspace/detail/lifecycle, command overlay reliability, Evidence graph, QueryPlan/adapters, and AI orchestration panels — all unchanged. Workspace reads stay non-reactive `getState()` in effects/initializers (no getSnapshot loop). Backend untouched (145/145).

### Known limitations

- Alerts filters/selection are restored via the global `alertStore` on switch; the open detail panel restores when the analyst navigates back to the Alerts page (page-local). In-progress triage workspace results are not restored by design.
- Hunts/Reports/Evidence selections restore on re-entering their page within a case, not eagerly at switch time.
- Workspace memory persists to localStorage; investigation/alert content is still in-memory and resets on refresh.
- Vite bundle ~508 KB (advisory only, not a failure) — code-splitting deferred.

### Next recommended phase

**v1.1.7 — README / deployment readiness** (document run/build/test + workspace-memory model), then **v1.2 — persistence / local database foundation** (implement `FutureDatabaseWorkspaceMemoryProvider`; back `investigationStore`/`alertStore`/`workspaceStore` with a durable store; wire `FutureSiemWorkspaceContextProvider`).

**Test status:** 145/145 pytest, 121 modules, 508KB bundle (vite v6). Safe to commit as **v1.1.6-workspace-memory-coverage**.

---

## v1.1.7 — Portfolio README, GitHub Presentation, and Mock Demo Deployment Readiness

**Date:** 2026-07-10  
**Status:** Complete — 122 modules, zero TS errors, 145/145 pytest passing. Docs + deployment-readiness patch (minimal deployment config code; no product features).

Makes SentinelIQ presentable on GitHub, in interviews, and in a live mock demo. Full README rewrite (honest mock-first framing), deployment + security docs, env examples, a screenshots placeholder, and the minimal code needed to deploy the frontend and backend to different origins.

### Deployment-config code changes (why version bumped to v1.1.7)

| File | Change |
|------|--------|
| `apps/web/src/utils/apiBase.ts` | **New** — `API_BASE` resolves from `VITE_API_BASE_URL` (deployed) or falls back to `'/api/v1'` (local Vite proxy). Single source for the API origin. |
| `apps/web/src/vite-env.d.ts` | **New** — self-contained typing for `import.meta.env.VITE_API_BASE_URL` (no `vite/client` dependency, so `tsc -b` can't fail on it). |
| `apps/web/src/api/client.ts` | Replaced the hard-coded `const BASE = '/api/v1'` with `import { API_BASE as BASE } from '../utils/apiBase'`. No other logic changed; local dev behavior identical. |
| `apps/api/config.py` | Added `cors_origins` setting (comma-separated, localhost default) + `cors_origin_list` property. |
| `apps/api/main.py` | CORS middleware now reads `settings.cors_origin_list` instead of a hard-coded localhost list (default preserves local dev). |
| `apps/web/src/App.tsx` | Version label → **v1.1.7**. |

Local dev is unchanged: `VITE_API_BASE_URL` unset → dev proxy; `CORS_ORIGINS` unset → localhost default.

### New documentation / config files

| File | Purpose |
|------|---------|
| `README.md` | **Rewritten** for portfolio/GitHub — pitch, problem, is/is-not, honest mock-first status, features table, screenshots section, Demo Flow, architecture (flow + layers), "how it sits on top of SIEMs", Sentinel/Security Copilot comparison, tech stack, local setup, mock mode, roadmap, limitations, security notes, interview talking points, status/license. |
| `DEPLOYMENT.md` | **New** — mock-only demo deployment: frontend (Vercel/Netlify/static) + backend (Render/Railway/Fly), env vars (`VITE_API_BASE_URL`, `MOCK_LLM`, `APP_ENV`, `CORS_ORIGINS`), why GitHub Pages alone isn't ideal (needs the FastAPI backend), step-by-step, CORS troubleshooting, ephemeral-state note. |
| `SECURITY.md` | **New** — no committed `.env`/keys, mock-data-only demo, don't upload real SOC logs, external AI off, future-integration privacy/redaction/least-context, `RealSIEMProvider` future work, reporting. |
| `.env.example` | **Updated** (root, backend) — added `CORS_ORIGINS`, clarified `.env` root location. |
| `apps/web/.env.example` | **New** — frontend `VITE_API_BASE_URL` (build-time). |
| `apps/api/.env.example` | **New** — backend var reference (notes the effective file is the project-root `.env`). |
| `docs/assets/README.md` | **New** — screenshots placeholder + capture guidance; lists `overview.png`, `alerts-triage.png`, `logs-query-console.png`, `queryplan-adapters.png`, `evidence-workspace.png`, `reports-handoff.png`, `context-used-trace.png` with an "add screenshots before public sharing" note. No fake screenshots created. |

### README sections added

Title · one-line pitch · summary · problem statement · what it is / is not · **honest current-status disclosure** (mock data, no external AI, no real connectors) · key-features table · screenshots · Demo Flow (14 steps) · architecture (flow diagram + layers table) · how it sits on top of SIEMs ("the SIEM stores and searches the data; SentinelIQ remembers and drives the investigation") · Sentinel / Security Copilot comparison (honest, non-superiority) · tech stack · run locally (prereqs + backend venv + frontend + validate) · mock mode · roadmap (near/medium/long) · current limitations · security notes · portfolio/interview talking points · status & license · text status badges (mock-first / AI off / 145 tests / build passing).

### Honesty framing (as required)

README states plainly that SentinelIQ is a mock-first prototype: deterministic mock SOC data only, **no** real customer data, **no** Claude/OpenAI/external AI calls, **no** Sentinel/Splunk/Elastic connection — the current value is workflow architecture, investigation memory, evidence graph, query planning, and mock AI orchestration. No superiority claim over Microsoft products; positioned as a future layer that could sit above them.

### Deployment-related code summary

The only app-code touched is deployment config: a frontend API-base helper (`VITE_API_BASE_URL`) and env-driven backend CORS (`CORS_ORIGINS`). Both default to current local-dev behavior, so nothing breaks locally. The frontend can now be built for a static host pointing at a separately hosted backend.

### Preserved (no regressions)

- All v1.1.6 workspace-memory behavior, scratch-first landing, alert triage, evidence graph, QueryPlan/adapters, and AI orchestration panels unchanged. Backend untouched except env-driven CORS (145/145). No new npm/pip packages.

### Next recommended phase

**v1.2 — persistence / local database foundation:** back `investigationStore` / `alertStore` / `workspaceStore` with durable storage (implement `FutureDatabaseWorkspaceMemoryProvider`), durable alert lifecycle + audit trail, then real SIEM connector + local/hybrid AI provider abstractions.

**Test status:** 145/145 pytest, 122 modules, 508KB bundle (vite v6). Safe to commit as **v1.1.7-readme-demo-deployment-readiness**.

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
