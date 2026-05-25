# SentinelIQ Product Context Update - v0.7.1

Prepared for: continuing SentinelIQ development  
Current baseline: v0.7.0-query-console-artifacts  
Next recommended patch: v0.7.1-navigation-state-mock-routing-fix  
Project identity: AI-native SOC investigation workspace / investigation copilot  

---

## 1. North Star

SentinelIQ is not simply a new SIEM dashboard.

SentinelIQ is an AI-assisted SOC investigation workspace where analysts can move from alerts to evidence-backed conclusions faster, while keeping every important action, query, result, entity, pivot, finding, note, and report inside persistent investigation memory.

The central product thesis is:

> SOC analysts do not just need answers. They need investigation continuity.

The core object in SentinelIQ is not a chat session and not a dashboard widget. The core object is the investigation.

Every useful workflow should strengthen the investigation:

- what happened
- who or what was affected
- what evidence supports the conclusion
- what was checked already
- what still needs to be checked
- what findings were pinned
- what reports or handoff notes were generated
- what context the AI used

---

## 2. What SentinelIQ Is

SentinelIQ is:

- an AI-native SOC investigation layer
- a memory-first analyst workspace
- a manual plus AI hybrid investigation environment
- a premium SOC workflow UX
- a future vendor-agnostic security investigation cockpit
- a privacy-preserving, hybrid/local-AI capable architecture direction

The AI acts as:

- investigation assistant
- workflow orchestrator
- query generator
- pivot recommender
- summarization engine
- documentation generator
- detection/rule explanation assistant
- memory-aware context layer

The UI acts as:

- the analyst workbench
- a durable investigation surface
- a manual SOC console
- a place where AI outputs become evidence-backed artifacts, not disconnected chat replies

---

## 3. What SentinelIQ Is Not

SentinelIQ should not be positioned as:

- just another SIEM dashboard
- a Microsoft Sentinel clone
- a KQL chatbot
- a generic AI side panel
- a stateless chat interface
- a full SIEM replacement in the near term

A full SIEM replacement would require ingestion, indexing, storage, detections, correlation, RBAC, connectors, retention, compliance, scaling, rule engines, and live telemetry at production scale.

SentinelIQ should instead be positioned as:

> an AI-native investigation layer that can sit on top of existing SIEMs and security tools.

---

## 4. Product Positioning

Recommended positioning:

> SentinelIQ is a memory-first SOC copilot for faster, explainable investigations.

Longer version:

> SentinelIQ is an AI-assisted SOC investigation workspace that combines manual SIEM workflows with AI-guided pivots, persistent investigation memory, explainable artifacts, and context-aware reporting. It is designed to eventually work across multiple SIEMs and security tools while supporting privacy-preserving hybrid/local AI.

Interview pitch:

> SentinelIQ is an AI-assisted SOC investigation workspace. I built it around the idea that analysts do not just need a chatbot or query generator; they need persistent investigation memory. The platform lets an analyst run manual SIEM-style workflows like KQL queries, alert triage, entity pivots, notes, pinned findings, and reports, while AI helps generate queries, suggest pivots, summarize results, and create documentation. The long-term design is vendor-agnostic and privacy-preserving, with local or hybrid AI routing so sensitive telemetry does not always need to leave the environment.

Resume bullet:

> Built SentinelIQ, an AI-native SOC investigation workspace using React, TypeScript, Zustand, and deterministic mock security telemetry. Designed a memory-first investigation model with turns, artifacts, notes, pinned findings, query results, entity pivots, and context-aware reporting to simulate analyst workflows across SIEM-style pages.

---

## 5. Why the SIEM-Like UI Exists

SentinelIQ uses SIEM-style pages because analysts still need familiar SOC workflows:

- Alerts
- Logs
- Investigations
- Hunts
- Rules
- Reports
- Assets
- Data Sources

However, these pages are not the unique product by themselves. They are the workbench where AI and investigation memory operate.

The product should not drift into building dashboard pages for their own sake.

Every page should pass this product-fit test:

> Does this improve investigation continuity, analyst decision-making, explainability, manual workflow, AI-assisted workflow, or evidence preservation?

If not, it is probably dashboard clutter.

---

## 6. Manual SOC Workflows Are First-Class

SentinelIQ must support both:

1. traditional/manual SOC workflows
2. AI-assisted workflows

The analyst should never feel trapped inside the AI flow.

Manual workflows must include:

- opening Logs manually
- writing or editing KQL manually
- running queries manually
- inspecting result tables manually
- saving or not saving results by choice
- pinning findings by choice
- opening investigations manually
- writing notes manually
- generating reports from selected investigation context

AI-assisted workflows should accelerate the analyst, not replace analyst control.

Correct model:

- Manual first-class workflow
- AI as acceleration layer
- Investigation memory always

---

## 7. Investigation-Memory-First Architecture

Investigation memory remains the most important architecture principle.

An investigation should preserve:

- turns
- artifacts
- query artifacts
- query_result artifacts
- notes
- pinned findings
- entities
- timelines
- reports
- summaries
- pivots
- context traces

The AI should use accumulated investigation context instead of acting statelessly.

Every AI-generated output should clearly show:

- which investigation it used
- what context was used
- what evidence supports it
- which artifacts or query results contributed
- whether the output was generated from demo/mock context or selected case context

---

## 8. Vendor-Agnostic Direction

SentinelIQ should not be limited to Microsoft Sentinel.

Long-term direction:

- Microsoft Sentinel / KQL
- Splunk / SPL
- Elastic / KQL or ES|QL
- QRadar / AQL
- Google Chronicle / UDM search
- Microsoft Defender
- CrowdStrike
- Okta
- AWS security logs
- Google Cloud logs
- firewall, IAM, EDR, email, and cloud connectors

Future architecture should include:

```text
Existing security tools
Sentinel / Splunk / Elastic / Defender / CrowdStrike / Okta / Cloud logs
        |
Connector + schema normalization layer
        |
Investigation memory layer
turns, artifacts, notes, findings, entities, timelines, query results
        |
AI orchestration layer
routing, tool selection, summarization, retrieval, privacy filtering
        |
SOC workspace UX
manual workflows + AI-assisted pivots + reports + handoff
```

The future differentiator is not one SIEM syntax. It is a vendor-agnostic investigation memory and workflow layer.

---

## 9. Hybrid / Local AI Direction

Security telemetry is sensitive.

SentinelIQ should be designed for privacy-preserving AI:

- local small models for classification, routing, summarization, retrieval, embeddings, and lightweight reasoning
- optional cloud models for advanced reasoning
- redaction before external model calls
- permission-aware context selection
- customer-controlled provider choice
- future air-gapped or on-prem mode

Mock mode exists now to perfect workflow, UX, state, and memory before real model orchestration is introduced.

Claude, GPT, Gemini, or local models should improve reasoning quality later, but they do not replace the need for strict product grounding.

A report should never be random AI text. It should always be generated from selected investigation context or clearly labeled demo context.

---

## 10. Current Baseline: v0.7.0

Current stable baseline as reported:

- v0.5 app shell and navigation exists
- v0.5.1 query preview edit/run/open-in-logs workflow exists
- v0.6 investigation sessions and memory exists
- active investigations exist
- AI actions and queries can create turns and artifacts
- documentation shows active investigation context used
- v0.7 Logs/KQL console and query result artifacts exist
- mock mode is active
- backend tests previously passed
- frontend build previously passed

v0.7 added:

- realistic Logs/KQL console
- query templates
- recent/saved query concepts
- shared QueryResultTable
- EntityChips
- PivotSuggestions
- deterministic mock query results
- extracted entities
- query summaries
- query and query_result artifacts
- Pin Result behavior
- QueryPreviewCard integration with result table

---

## 11. v0.7 Testing Findings

Testing revealed that v0.7 has the right direction but needs a stabilization patch.

Observed issues:

1. No back/forward navigation between pages or action-generated screens.
2. Logs page resets after leaving and returning.
3. Recent queries are not clearly visible or reliable after custom KQL runs.
4. Saved queries cannot be deleted.
5. Entity chips populate the AI bar, but Ask does not reliably run.
6. Pivot suggestion chips do not reliably submit commands.
7. AI bar can freeze or stop accepting input after provider errors.
8. Mock mode still routes some actions to unfinished RealSIEMProvider methods.
9. Manual Logs runs auto-save to INV-001 when active investigation exists.
10. "Saved to INV-001" is confusing and too automatic.
11. "Save summary as note" gives unclear destination feedback.
12. Pin Result has no Unpin option.
13. Reports/documentation generation feels template-like unless clearly context-bound.
14. "Write my handoff summary" does not reliably generate.
15. Version label still displays v0.6.0.
16. "Why does GeoAnomalyLogin fire so often?" routes to RealSIEMProvider.get_detection_rules and throws NotImplementedError in Mock mode.

These should be handled in v0.7.1 before moving to v0.8.

---

## 12. v0.7.1 Product Correction

v0.7.1 should not be a feature expansion. It should be a product and workflow correction patch.

Recommended name:

```text
v0.7.1-navigation-state-mock-routing-fix
```

Core goals:

- make navigation durable
- make Logs state persistent
- make manual Logs workflows scratch-first and explicit-save
- fix AI command routing
- prevent RealSIEMProvider errors in Mock mode
- make report generation context-bound
- make pins reversible
- make saved queries manageable
- restore confidence in the global command bar

---

## 13. Future Roadmap Direction

Do not rush to real AI until the workflow is durable.

Recommended path:

### v0.7.1 - Stability and Product Correction

- navigation history
- Logs persistence
- manual scratch mode
- explicit save-to-case
- pin/unpin
- mock routing fixes
- context-bound documentation
- AI bar reliability

### v0.8 - Investigation Graph and Timeline

- entity relationship graph
- timeline visualization
- blast radius map
- investigation story view
- evidence chain

### v0.9 - AI Orchestration Layer

- prompt routing
- tool calling
- retrieval over investigation memory
- model/provider abstraction
- privacy filtering
- deterministic fallback paths

### v1.0+ - Vendor-Agnostic Connectors

- Sentinel connector
- Splunk connector
- Elastic connector
- Defender/EDR connectors
- schema normalization
- permission-aware context layer
- hybrid/local deployment path

---

## 14. Reminder for Future Development

If development starts drifting into generic SIEM dashboard building, pause and return to the core thesis:

> SentinelIQ is a memory-first SOC investigation workspace where AI assists, but the analyst stays in control.

Use this decision rule:

> Manual SOC workflow first. AI-assisted acceleration second. Investigation memory always.

Avoid:

- cluttered dashboards
- modal overload
- disconnected AI responses
- stateless chat UX
- automatic case saving without analyst consent
- AI-only workflows where a manual path should exist
- random report generation without selected context
- building pages that do not improve investigation continuity

Prioritize:

- investigation continuity
- navigation clarity
- minimal friction
- premium SOC feel
- state persistence
- explainability
- contextual awareness
- reversible actions
- analyst control
- vendor-agnostic future architecture

---

# Updated v0.7.1 Implementation Prompt

```text
We are starting SentinelIQ v0.7.1: Navigation, State Persistence, Manual Logs Workflow, and Mock Routing Stabilization.

Before coding, read:
- SentinelIQ_Updated_Product_PRD_v0.5_plus.md
- SentinelIQ master context / development handoff
- Current v0.7 implementation files

Important product clarification:
SentinelIQ must support BOTH:
1. AI-assisted workflows
2. traditional/manual SOC workflows

The analyst should never feel trapped inside the AI flow.
Manual Logs/query/report workflows are first-class.
Investigation memory remains critical, but manual exploration must not auto-save into a case unless the analyst chooses that.

Current product identity:
SentinelIQ is not simply a new SIEM dashboard, a Microsoft Sentinel clone, or a KQL chatbot.
It is an AI-native SOC investigation workspace and future vendor-agnostic investigation layer.
The core moat is persistent investigation memory: turns, artifacts, notes, pinned findings, entities, query results, reports, context traces, and evidence-backed pivots.

Guiding rule:
Manual SOC workflow first. AI-assisted acceleration second. Investigation memory always.

If the implementation starts drifting into generic dashboard work, pause and return to the core thesis:
SentinelIQ is a memory-first SOC investigation workspace where AI assists, but the analyst stays in control.

Current v0.7 issues found during testing:
1. No back/forward navigation between pages/screens.
2. Logs page resets after leaving and returning.
3. Recent queries are not visible/reliable after custom KQL runs.
4. Saved queries cannot be deleted.
5. Entity chips populate the AI bar, but Ask does not run reliably.
6. Pivot suggestion clicks do not work reliably.
7. AI bar freezes or stops accepting new commands after provider errors.
8. Mock mode still routes some actions to RealSIEMProvider and throws NotImplementedError.
9. Manual Logs query runs auto-save to INV-001 when an active investigation exists.
10. "Saved to INV-001" is confusing and too automatic.
11. "Save summary as note" gives no clear destination feedback.
12. Pin Result has no unpin option.
13. Reports/documentation generation feels template/random instead of clearly context-bound.
14. "Write my handoff summary" does not generate properly.
15. App still displays v0.6.0 in the UI.
16. "Why does GeoAnomalyLogin fire so often?" routes to RealSIEMProvider.get_detection_rules and throws NotImplementedError in Mock mode.

Core constraints:
- Do not rewrite backend capability logic broadly.
- Do not break v0.5 app shell/navigation.
- Do not break v0.6 investigation memory.
- Do not break v0.7 query console/result table/artifact components.
- Do not install packages unless absolutely necessary.
- Do not integrate real Claude/API credits.
- Keep deterministic mock mode.
- Do not run long Playwright/browser loops.
- Validate only with:
  - cd apps/web && npm run build
  - cd apps/api && python -m pytest
- If either takes more than 2 minutes, stop and report where it hung.

Build v0.7.1:

1. Navigation history
- Add route-backed or history-backed navigation.
- If react-router already exists, use it.
- If not, use browser History API or hash routes; do not install a new package unless unavoidable.
- Add visible Back and Forward controls in the shell.
- Browser back/forward should work.
- Navigating between Overview, Logs, Reports, Investigations, Rules, Assets, etc. should not require refresh to return.
- Action-generated screens such as alert triage, documentation, detection-rule explanation, and noise coaching should be dismissible or navigable back from.
- The user should be able to return from "Triage my open alerts" to the previous page without refreshing.

2. Persist Logs page state
Create or extend a Logs store so the Logs page keeps:
- current KQL editor value
- last query result
- extracted entities
- summary open/closed state
- recent queries
- saved queries
- selected case target
- pinned state for the current result
- saved/unsaved state for the current result

Leaving Logs and returning should preserve the editor and result table.

3. Recent queries
- Every successful manual/custom KQL run should add to Recent Queries.
- Make recent queries visibly accessible, not hidden.
- Show an empty state if none exist.
- Clicking a recent query loads it into the KQL editor but does not auto-run.
- Limit to a sensible number, such as 10 or 20.
- Do not confuse Recent Queries with Saved Queries.

4. Saved queries delete
- Saved queries must have a delete option.
- Avoid modal overload.
- Inline delete, small confirmation, or undo is enough.
- Deleting a saved query should not affect recent query history.
- Saved queries should persist across navigation.

5. Manual Logs workflow and case saving
Change Logs behavior:
- Manual Run Query should NOT automatically save to INV-001 just because an active investigation exists.
- Query results should start as scratch/unsaved.
- Show a clear case target selector when active investigations exist.
- Default target may be the active investigation, but saving must be explicit.
- Replace "Saved to INV-001" with clearer states:
  - "Scratch result"
  - "Not saved"
  - "Case target: jsmith Account Compromise"
  - "Saved to jsmith Account Compromise"
- Add explicit actions:
  - Save Query
  - Save Result to Case
  - Save Summary as Note
  - Pin to Case
- Running a query manually should never surprise-save into an investigation.

6. Summary note destination feedback
- "Save as note" should require or select an investigation target.
- If no target case is selected, disable the action or ask the analyst to choose a case target.
- After save, show clear feedback:
  "Saved as note in jsmith Account Compromise -> Open Notes"
- The note must appear in the investigation Notes tab.
- The note should include summary text, source query/table, row count, timestamp, and linked result artifact if available.
- Avoid creating invisible notes with no clear destination.

7. Pin and unpin
- Pin Result should be reversible.
- When pinned, button becomes Unpin Result.
- Pinning should create or link a pinned finding to the current query_result artifact.
- Unpinning should unpin the artifact and remove/detach the related pinned finding.
- Pin state should persist after navigation.
- Pinning requires a case target.
- A scratch result should not be pinnable until the analyst chooses a case target or explicitly saves/pins to a case.

8. Fix entity chips and pivot suggestions
- Entity chips should either:
  a. fill the AI command bar and focus it, then Ask works reliably, OR
  b. submit the prompt directly through a shared command submit function.
- Pivot suggestion chips should submit reliably through the existing AI command flow.
- Add or adjust a shared method in useSearchBar if needed, such as submitCommand(prompt, options).
- Clear previous errors before each command.
- Ensure loading state always resets in finally.
- Do not allow old provider errors to freeze the AI bar.
- After clicking an entity chip or pivot chip, the analyst must still be able to type a new AI command and run it.

9. Mock mode routing fix
- When Mock mode is active, frontend/backend must not call RealSIEMProvider methods.
- Existing NotImplementedError messages should not appear in Mock mode.
- Add deterministic mock handlers or fixture paths for:
  - get_users
  - get_alerts
  - get_detection_rules
  - timeline
  - blast radius
  - detection rule generation
  - noisy rule explanation
  - GeoAnomalyLogin false-positive/noise coaching
  - report generation
  - executive summary generation
  - technical report generation
  - handoff summary generation
- "Why does GeoAnomalyLogin fire so often?" should generate deterministic mock noise coaching/rule explanation, not call RealSIEMProvider.get_detection_rules.
- The Mock badge should reflect actual provider behavior.
- If mock/provider config is mismatched, show a non-blocking warning instead of breaking the workflow.
- Provider errors should never poison or freeze the global command bar.

10. Reports/documentation context binding
- Reports must be generated from selected investigation context, not random-seeming templates.
- If no active/selected investigation exists, ask the analyst to select one or explicitly use demo context.
- Executive summary, technical report, and handoff summary should share a context-aware documentation generation path.
- Every generated report should show "Context used" with counts:
  - turns
  - artifacts
  - pinned findings
  - notes
  - query results
- "Write my handoff summary" must work in mock mode.
- Generated reports should clearly state the investigation/case they are based on.
- Do not rely on future Claude integration to solve context grounding; enforce context selection now.
- Report buttons should show the source context, for example:
  "Using: jsmith Account Compromise"
  "Context: 4 turns · 4 artifacts · 3 pinned findings · 1 note"

11. Detection-rule/noisy-rule coaching
- The Rules flow and global AI command should support deterministic mock explanation for noisy detections.
- "Why does GeoAnomalyLogin fire so often?" should produce a context-aware mock explanation with:
  - suspected cause of noise
  - affected rule name
  - common benign patterns
  - current mock evidence
  - recommended tuning approach
  - safe next step
- If an active investigation exists, allow saving this as a noise-coaching artifact or note, but do not auto-save without analyst consent.

12. Query artifact duplicate handling
- Keep duplicate avoidance, but make behavior explicit.
- Prefer normalized query hash for repeated query detection if feasible.
- Same query run again should update existing artifact only when explicitly saved to case.
- Edited query should create a new artifact or clean version.
- UI should indicate whether the result was newly saved or updated.

13. AI bar reliability
- Clear old error before every new submission.
- Reset loading state in finally.
- Allow new input after any failed command.
- Make Ask button state reflect only current command validity/loading state.
- Do not keep stale action mode or stale pending query state after a failure.
- KQL should never be injected into the global AI prompt bar.

14. Version label
- Update UI version label from v0.6.0 to v0.7.1 after implementation.

Files likely to inspect:
- apps/web/src/App.tsx
- apps/web/src/pages/LogsPage.tsx
- apps/web/src/pages/ReportsPage.tsx
- apps/web/src/pages/OverviewPage.tsx
- apps/web/src/pages/RulesPage.tsx
- apps/web/src/pages/InvestigationsPage.tsx
- apps/web/src/components/SearchBar/QueryPreviewCard.tsx
- apps/web/src/hooks/useSearchBar.ts
- apps/web/src/stores/sessionStore.ts
- apps/web/src/stores/investigationStore.ts
- apps/web/src/utils/mockResults.ts
- apps/web/src/utils/querySummary.ts
- apps/web/src/components/query/QueryResultTable.tsx
- apps/web/src/components/query/EntityChips.tsx
- apps/web/src/components/query/PivotSuggestions.tsx
- backend provider/mock routing files related to RealSIEMProvider and MOCK_LLM

If needed, create:
- apps/web/src/stores/logsStore.ts
- apps/web/src/stores/navigationStore.ts
- apps/web/src/utils/navigation.ts
- apps/web/src/utils/mockDocumentation.ts
- apps/web/src/utils/mockActions.ts
- apps/web/src/utils/mockRuleCoaching.ts

Validation:
Run only:
- cd apps/web && npm run build
- cd apps/api && python -m pytest

If either takes more than 2 minutes, stop and report where it hung.

After implementation, report:
- Files created
- Files changed
- How navigation/back/forward works
- How Logs state persistence works
- How recent queries work
- How saved query delete works
- How manual Logs scratch mode works
- How case target/save-to-case works
- How summary notes are saved and surfaced
- How pin/unpin works
- How entity chips and pivots now submit commands
- How AI bar freeze was fixed
- How Mock mode avoids RealSIEMProvider errors
- How GeoAnomalyLogin/noisy-rule coaching works
- How reports are now context-bound
- How handoff summary works
- How duplicate query artifacts are handled
- Frontend build result
- Backend test result
- Manual test checklist
- Whether safe to commit as v0.7.1-navigation-state-mock-routing-fix

Manual test checklist:
- Go Overview -> Logs -> Reports -> Back -> Logs; previous Logs KQL/result remains.
- Browser back button works.
- In-app Back/Forward buttons work.
- Triage my open alerts runs and can be navigated away/back without refresh.
- Run custom KQL; it appears in Recent Queries.
- Save a query; it appears in Saved Queries.
- Delete saved query; it disappears.
- Run Logs query with active investigation; result stays scratch until explicitly saved.
- Save result to selected case; UI confirms destination.
- Save summary as note; Notes tab shows it.
- Pin result; Artifacts/Overview reflect pinned state.
- Unpin result; pinned state is removed.
- Click entity chip; AI bar remains usable and Ask runs.
- Click pivot suggestion; corresponding action runs in mock mode.
- No RealSIEMProvider.NotImplementedError appears while Mock mode is active.
- "Why does GeoAnomalyLogin fire so often?" returns mock noisy-rule coaching.
- Generate executive report uses selected investigation context.
- Write technical report uses selected investigation context.
- Write handoff summary works.
- Every generated report shows "Context used."
- UI version shows v0.7.1.
```
