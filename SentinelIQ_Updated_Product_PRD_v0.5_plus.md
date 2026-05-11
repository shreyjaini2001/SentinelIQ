# SentinelIQ Updated Product PRD v0.5+

## 1. Purpose

This document updates the SentinelIQ product direction after the Phase 0–3 mock-mode build and the v0.4 UI polish work.

SentinelIQ should no longer be treated as only an AI search bar or a single-page capability demo. The product should evolve into a **Sentinel-style SOC investigation workspace with an AI-native command layer**.

Use this document as the reference PRD for Claude before continuing implementation.

---

## 2. Updated Product Vision

SentinelIQ is an AI-native SIEM investigation workspace that combines:

1. **Traditional SOC/SIEM navigation**
   - Alerts
   - Incidents / Investigations
   - Logs / KQL console
   - Hunts
   - Rules
   - Reports
   - Assets / Entities
   - Data Sources
   - Settings

2. **AI command/search layer**
   - Natural language navigation
   - Natural language to KQL
   - KQL explanation
   - Alert triage
   - Threat hunt
   - Timeline reconstruction
   - Blast radius analysis
   - Documentation
   - Rule suggestion
   - Runbook generation
   - Handoff generation
   - Noise coaching

3. **Investigation-scoped memory**
   - The AI should remember what happened inside the active investigation.
   - It should not only answer one isolated prompt at a time.

4. **Manual + AI hybrid workflow**
   - Analysts should be able to operate the portal manually.
   - AI should speed up navigation, investigation, and documentation.

5. **Secure, provider-agnostic AI architecture**
   - The product should support mock mode now.
   - Later it should support Claude, Azure OpenAI, Security Copilot, local LLMs, or customer-hosted models depending on deployment.

---

## 3. Current Build State

### 3.1 Completed Phase 0
- Intent classifier: query / action / refine.
- Natural-language query to KQL.
- KQL explanation.
- KQL validation.
- Suggestions and autocomplete.
- Session persistence.
- Mock LLM mode.
- PII scrubbing layer.
- Classifier benchmark.

### 3.2 Completed Phase 1
- Alert triage.
- Threat hunt.
- Timeline reconstruction.
- Frontend panels:
  - AlertTriagePanel
  - HuntResultPanel
  - TimelinePanel

### 3.3 Completed Phase 2
- Blast radius estimation.
- Documentation generation.
- Comparative behavioral analysis.
- Rule suggestion.
- Frontend panels:
  - BlastRadiusPanel
  - DocumentationPanel
  - ComparativeAnalysisPanel
  - RuleSuggestionPanel

### 3.4 Completed Phase 3
- Shift handoff.
- Runbook generation.
- Noise reduction coaching.
- Frontend panels:
  - HandoffBriefingPanel
  - RunbookPanel
  - NoiseCoachingPanel

### 3.5 Current v0.4 Problems
The UI looks more polished, but the product still feels structurally messy.

Known issues:
- App is still too centered around one AI search page.
- No strong SIEM-style navigation model.
- No proper dashboard return.
- Top nav items are not fully meaningful.
- Search history and session history are not investigation-grade memory.
- Query editing behavior is confusing.
- Query results are not shown like a real SIEM result table.
- Outputs are not consistently saved as artifacts.
- “Summarize this investigation” does not yet use true investigation memory.
- Manual SIEM workflows are underdeveloped.

---

## 4. Core Product Principles

### 4.1 Manual + AI Hybrid
SentinelIQ must support both manual workflows and AI-assisted workflows.

Manual examples:
- Open alert queue.
- Filter alerts.
- Open an incident.
- Write/edit KQL manually.
- Inspect result rows.
- Pin findings.
- Add notes.
- Open rules.
- Review reports.

AI examples:
- “Show failed logins from unusual countries.”
- “Triage my critical alerts.”
- “Build a timeline for this host.”
- “Map blast radius for jsmith.”
- “Generate an executive summary.”
- “Help me tune this noisy rule.”

### 4.2 Analyst Remains in Control
AI should prepare and recommend. The analyst should inspect, edit, approve, reject, and execute.

### 4.3 Investigation-Scoped Memory
The AI should remember:
- queries run
- results viewed
- alerts triaged
- entities identified
- timelines generated
- blast radius outputs
- reports created
- notes
- pinned findings

### 4.4 Environment-Aware AI
The AI should understand:
- available log tables
- data connectors
- detection rules
- users
- hosts
- critical assets
- service accounts
- privileged groups
- MITRE mappings
- baselines

### 4.5 Secure by Design
Sensitive SIEM data should not be blindly sent to external AI providers. The product must support customer-controlled model and data policies.

---

## 5. Target Users

### SOC Tier 1 Analyst
Needs fast triage, explanation, and escalation support.

### SOC Tier 2 Incident Responder
Needs investigation workspace, timeline, entity pivots, evidence collection, and reporting.

### Detection Engineer
Needs KQL generation, rule creation, tuning, backtesting, and noise reduction.

### Security Manager
Needs executive summaries, status, metrics, and handoff/reporting outputs.

### New Analyst / Intern
Needs portal navigation help and guided workflows.

---

## 6. Information Architecture

SentinelIQ should move toward a Sentinel/Defender-style SOC portal.

### 6.1 Proposed App Shell

```text
Left Sidebar:
- Overview
- Alerts
- Incidents / Investigations
- Logs
- Hunts
- Rules
- Reports
- Assets / Entities
- Data Sources
- Settings

Top:
- Global AI command bar
- Current workspace / active investigation
- New investigation button

Main Workspace:
- Current page content

Right Context Panel:
- Active investigation context
- Pinned findings
- Artifacts
- AI recommendations
```

### 6.2 Pages

#### Overview / Dashboard
SOC overview, alert counts, active investigations, recent incidents, connector health, and AI quick-start prompts.

#### Alerts
Alert queue, filters, severity, assignment, status, manual triage, AI triage.

#### Incidents / Investigations
Investigation/session list, create new investigation, open investigation, status, severity, owner, entities.

#### Investigation Workspace
Case workspace with tabs:
- Overview
- Alerts
- Entities
- Logs
- Timeline
- Blast Radius
- Notes
- Reports
- Artifacts

#### Logs / KQL Console
Manual KQL editor, AI-generated KQL, query execution, result table, save/pin results.

#### Hunts
Threat actor hunts, MITRE technique hunts, hunt history, hunt narratives.

#### Rules
Detection rule library, rule suggestion, backtesting, tuning, noise coaching.

#### Reports
Technical, executive, and regulatory reports.

#### Assets / Entities
Users, hosts, IPs, service accounts, groups, entity risk.

#### Data Sources
Connectors, log tables, schema inventory, ingestion status.

#### Settings
Model provider, mock/real mode, privacy policy, API keys, integrations.

---

## 7. AI Command Modes

### 7.1 Navigation Assistant
Examples:
- “Where do I check connector health?”
- “Open alerts.”
- “Take me to rules.”

Behavior:
- answer where to go
- optionally navigate
- explain the page

### 7.2 Query Assistant
Examples:
- “Show failed logins from Russia in the last 24 hours.”
- “Find lateral movement events this week.”

Behavior:
- generate KQL
- explain KQL
- allow inline editing
- run query
- show results
- pin result

### 7.3 Investigation Assistant
Examples:
- “What have we found so far?”
- “What should I investigate next?”
- “Correlate this with endpoint activity.”

Behavior:
- use current investigation memory
- use artifacts and pinned findings
- recommend next steps

### 7.4 Action Assistant
Examples:
- “Triage my alerts.”
- “Hunt for LAPSUS$ TTPs.”
- “Build a timeline.”
- “Map blast radius.”

Behavior:
- route to capability
- render dedicated panel
- save output as artifact

### 7.5 Documentation Assistant
Examples:
- “Generate executive summary.”
- “Write technical report.”
- “Prepare handoff.”

Behavior:
- use investigation context and pinned findings

### 7.6 Environment Assistant
Examples:
- “What logs do we have?”
- “Do we have Defender endpoint data?”
- “Which tables help with identity investigations?”

Behavior:
- use environment inventory
- explain available data
- recommend queries/pages

---

## 8. Investigation and Session Model

### 8.1 Investigation Object

```json
{
  "investigation_id": "inv_123",
  "title": "jsmith account compromise",
  "status": "active",
  "severity": "high",
  "created_at": "2026-05-09T12:00:00Z",
  "updated_at": "2026-05-09T12:45:00Z",
  "owner": "analyst_1",
  "entities": [],
  "alerts": [],
  "turns": [],
  "artifacts": [],
  "pinned_findings": [],
  "notes": [],
  "generated_reports": []
}
```

### 8.2 Turns
A turn is a user/AI interaction.

Types:
- query
- action
- refine
- navigation
- manual_note
- report_generation
- rule_creation

### 8.3 Artifacts
Artifacts are saved outputs.

Types:
- kql_query
- query_result
- alert_triage
- threat_hunt
- timeline
- blast_radius
- comparative_analysis
- rule_suggestion
- documentation
- handoff
- runbook
- noise_coaching
- analyst_note

### 8.4 Pinned Findings
Pinned findings are important evidence selected by the analyst.

Examples:
- suspicious login from RU IP
- encoded PowerShell on DESKTOP-42
- lateral movement to SERVER-DC01
- privileged path to Domain Admins
- large outbound transfer

Pinned findings should drive reports and summaries.

---

## 9. Query Console Requirements

### 9.1 Natural Language Query Flow
1. User asks a natural-language query.
2. AI generates KQL.
3. QueryPreviewCard shows KQL.
4. User can copy, edit, run, save, pin, or refine.

### 9.2 Inline KQL Editing
Rules:
- KQL editing must happen inside QueryPreviewCard.
- Edited KQL should not be pushed into the global AI bar.
- Raw KQL should not be treated as an action prompt.
- “Run edited query” should execute the edited KQL.

### 9.3 Query Results
Running query should show:
- mock result table
- row count
- extracted entities
- suggested pivots
- pin to investigation
- create rule from result
- summarize result
- correlate with related data

---

## 10. Manual Workflows

### Alert Workflow
1. Open Alerts page.
2. Filter queue.
3. Open alert.
4. Triage manually or with AI.
5. Start investigation.

### Investigation Workflow
1. Open investigation.
2. View alerts, entities, logs, timeline.
3. Add notes.
4. Pin findings.
5. Generate reports.

### Query Workflow
1. Open Logs page.
2. Write or generate KQL.
3. Run query.
4. Inspect results.
5. Pin evidence.

### Rule Workflow
1. Open Rules page.
2. View noisy rules.
3. Open rule detail.
4. Tune manually or with AI.
5. Review backtest estimate.

---

## 11. AI-Assisted Demo Workflow

Scenario: jsmith account compromise

1. Dashboard shows critical alert.
2. Analyst asks: “Triage my critical alerts.”
3. AI identifies jsmith compromise.
4. Analyst starts investigation for jsmith.
5. Analyst asks: “Show failed logins for this user.”
6. AI generates KQL and shows results.
7. Analyst pins suspicious login.
8. Analyst asks: “Correlate with endpoint activity.”
9. AI finds encoded PowerShell.
10. Analyst asks: “Build timeline.”
11. AI builds timeline.
12. Analyst asks: “Map blast radius.”
13. AI maps reachable assets.
14. Analyst asks: “Create detection rule.”
15. AI generates rule.
16. Analyst asks: “Generate executive summary.”
17. AI generates report from investigation artifacts.
18. Analyst asks: “Write handoff.”
19. AI generates handoff.

---

## 12. Model Provider Architecture

### 12.1 Current Brain
Right now, answers come from:
- MockLLMProvider
- deterministic keyword/routing logic
- templates
- fixture data

Claude API is not used in mock mode.

### 12.2 Future Providers

```text
MockLLMProvider
AnthropicProvider
AzureOpenAIProvider
SecurityCopilotProvider
LocalLLMProvider
CustomerHostedModelProvider
```

### 12.3 Layered AI Brain

```text
Layer 1: deterministic routing/templates
Layer 2: retrieval/schema lookup
Layer 3: small/local model for simple tasks
Layer 4: large model for complex reasoning/reporting
```

### 12.4 Cost Controls
- cache common outputs
- summarize before model calls
- use templates for known workflows
- limit context size
- choose model per task
- use local models where possible

---

## 13. Secure AI Deployment Models

### Microsoft-Native Deployment
Use Microsoft-native AI stack such as Security Copilot/Azure OpenAI if integrated into Sentinel.

### Customer-Owned Azure Deployment
Customer deploys SentinelIQ in their own Azure tenant with Azure OpenAI and private networking.

### Fully Local / Self-Hosted Deployment
For regulated customers:
- local LLM
- local vector DB
- no outbound AI calls
- customer-controlled infrastructure

### Hybrid Deployment
- raw logs stay local
- summaries/entities are extracted
- PII is scrubbed
- external model calls allowed only by policy

---

## 14. Security and Privacy Controls

Required controls:
- data minimization
- PII/secret scrubbing
- RBAC-aware retrieval
- tenant isolation
- audit logging
- human approval for sensitive actions
- customer policy controls
- external model enable/disable
- no training on customer data by default

---

## 15. SIEM Connector Architecture

To become an add-on product, SentinelIQ should become SIEM-agnostic.

### Future Connectors

```text
FixtureConnector
MicrosoftSentinelConnector
SplunkConnector
ElasticConnector
ChronicleConnector
QRadarConnector
CrowdStrikeConnector
DatadogConnector
SnowflakeSecurityLakeConnector
```

### Connector Responsibilities
- expose available tables/indexes
- expose schema metadata
- execute queries
- retrieve alerts
- retrieve incidents
- retrieve rules
- resolve entities
- expose environment inventory

---

## 16. Productization Strategy

### SaaS Add-On
Customer connects SIEM through APIs.

### Customer-Hosted Deployment
Customer deploys inside their own cloud/VNet.

### On-Prem / Private Appliance
For regulated customers.

### Marketplace App
Potential platforms:
- Azure Marketplace
- Splunk apps
- Elastic integrations
- ServiceNow Security Operations
- CrowdStrike marketplace

Best positioning:

> SentinelIQ is a secure AI command and investigation layer for SIEM platforms.

---

## 17. Updated Roadmap

### v0.5 — Product Architecture + App Shell
Goal:
Create a Sentinel-style shell and navigation.

Build:
- left sidebar nav
- Overview route
- Alerts route
- Investigations route
- Logs route
- Hunts route
- Rules route
- Reports route
- Assets route
- Data Sources route
- Settings route
- global AI command bar
- dashboard/home return
- remove or wire dead buttons
- preserve current capability panels

### v0.6 — Investigation Sessions + Memory
Goal:
Make investigations persistent.

Build:
- investigation list
- new investigation button
- open investigation
- per-investigation turns
- artifacts
- pinned findings
- notes
- active investigation context

### v0.7 — Query Console + Result Artifacts
Goal:
Make query workflow realistic.

Build:
- inline KQL editing
- run edited query
- mock result table
- entity extraction
- save/pin result
- suggested pivots
- create rule from result
- summarize result

### v0.8 — Manual SIEM Pages
Goal:
Make manual portal workflows useful.

Build:
- alerts queue
- alert detail
- investigation detail
- rules library
- reports library
- assets page
- data sources page

### v0.9 — Environment-Aware AI
Goal:
AI understands the company environment.

Build:
- environment inventory
- page registry
- AI navigation assistant
- schema/table awareness
- connector health awareness
- environment-aware recommendations

### v1.0 — Demo-Ready Product
Goal:
Portfolio and product demo-ready.

Build:
- seeded investigation scenario
- polished UI
- stable workflow
- README
- screenshots/GIFs
- demo script
- optional real LLM mode

### v1.1 — Model Provider Expansion
Build:
- AzureOpenAIProvider
- LocalLLMProvider stub
- provider policy layer
- model routing by task

### v1.2 — Security Controls
Build:
- data policy engine
- redaction controls
- audit logs
- RBAC-aware retrieval
- external model controls

### v1.3 — SIEM-Agnostic Connector Strategy
Build:
- connector interface
- Sentinel connector prototype
- Splunk connector stub
- Elastic connector stub

---

## 18. Immediate Bug Backlog

### Search and History
- session history duplicates
- dropdown layering
- inconsistent history between preview/open states
- recent prompts should include actions and queries
- breadcrumbs should not duplicate
- long prompts should truncate cleanly

### Query Card
- edit KQL inline
- do not push raw KQL into AI bar
- run edited query
- show results
- save/pin query output

### Navigation
- back to dashboard
- wire nav items
- view queue button should open queue or be disabled
- no refresh needed to return home

### Session/Investigation Memory
- summarize investigation using artifacts
- multiple sessions/investigations
- investigation-specific context

### Manual Pages
- alerts page
- rules page
- reports page
- logs page
- assets page
- data sources page

---

## 19. Development Guardrails for Claude

Always:
- work one milestone at a time
- keep mock mode working
- preserve existing Phase 0–3 prompts
- avoid backend changes when only UI shell is requested
- run `cd apps/web && npm run build`
- run `cd apps/api && python -m pytest`
- keep changes scoped

Avoid:
- broad rewrites
- fake clickable buttons
- hiding broken features behind styling
- raw KQL in global AI bar
- treating session history as full investigation memory
- making RealSIEMProvider return fake production data
- long Playwright/browser loops unless requested

---

## 20. First Implementation Step

Start with:

# v0.5 App Shell and Navigation

Goals:
- create proper routed app shell
- left sidebar navigation
- overview dashboard
- meaningful placeholder pages
- global AI command bar
- dashboard/home return
- preserve current AI capability prompts
- no backend rewrite

Success:
- user can navigate without refreshing
- AI bar still works
- current capability panels still render
- nav items no longer feel dead
- build passes
- tests pass
