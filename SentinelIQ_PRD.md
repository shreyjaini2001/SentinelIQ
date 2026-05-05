# SentinelIQ — AI Search Bar & Capabilities
## Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** Draft — In Review  
**Owner:** Product Management  
**Last Updated:** April 2026  
**Classification:** Confidential — Internal Use Only

---

## Table of Contents

1. [Overview](#1-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Users & Personas](#4-users--personas)
5. [Phase 0 — AI Search Bar Engine](#5-phase-0--ai-search-bar-engine)
6. [Phase 1 — Query Foundation & Triage](#6-phase-1--query-foundation--triage)
7. [Phase 2 — Deep Investigation Intelligence](#7-phase-2--deep-investigation-intelligence)
8. [Phase 3 — Automation, Coaching & GA](#8-phase-3--automation-coaching--ga)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Out of Scope](#10-out-of-scope)
11. [Dependencies & Risks](#11-dependencies--risks)
12. [Open Questions](#12-open-questions)

---

## 1. Overview

### 1.1 Product Vision

SentinelIQ is an AI-powered SIEM platform centered on a single, intelligent interface: the **AI Search Bar**. Every analyst workflow — querying logs, triaging alerts, hunting threats, generating reports, estimating blast radius, coaching detection rules — is triggered through the same bar, in plain English.

The search bar is not a search box. It is the **UX paradigm of the entire platform**. It understands intent, generates queries, remembers context across a session, and dispatches actions to the right capability — all without the analyst navigating away from their current view.

### 1.2 What We Are Building

A next-generation SIEM platform with an AI copilot at its center, delivered in four phases:

| Phase | Timeline | Focus |
|---|---|---|
| **Phase 0** | Weeks 1–6 | AI Search Bar Engine — the foundation everything else runs on |
| **Phase 1** | Months 2–5 | Alert triage, threat hunting, timeline reconstruction |
| **Phase 2** | Months 6–9 | Comparative queries, documentation, rule suggestion, blast radius |
| **Phase 3** | Months 10–14 | Handoff briefing, noise coaching, runbook generation, GA |

### 1.3 Why Now

SOC analysts are drowning. Alert volumes are growing 30% year-over-year. Mean time to detect (MTTD) at the median enterprise SOC is 21 days for sophisticated attacks. Analysts spend 40–60% of their time on tasks that are mechanical, repetitive, and non-investigative: writing queries, formatting reports, documenting incidents, and tuning noisy rules.

Existing SIEMs have bolted AI onto legacy architectures as afterthoughts — a "natural language search" field that produces broken KQL, or an "AI summary" button that generates generic text disconnected from the actual log data. No platform has made AI the primary interaction model from the ground up.

SentinelIQ does.

---

## 2. Problem Statement

### 2.1 Core Problems

**Problem 1 — The query barrier**
Analysts must know KQL, SPL, or EQL to extract value from their SIEM. Junior analysts can't write complex queries. Senior analysts spend 20+ minutes on queries that should take 30 seconds. The skill ceiling for log correlation is too high for most teams.

**Problem 2 — No conversational memory**
Every query in a traditional SIEM is stateless. The analyst can't say "now filter that to just the finance department" — they have to rewrite the entire query from scratch. There is no thread. There is no investigation context. Each interaction starts cold.

**Problem 3 — Documentation is manual and painful**
After resolving a critical incident, an analyst spends 45–90 minutes writing a post-incident report from memory and scattered notes. This documentation is inconsistent, incomplete, and delayed. Critical institutional knowledge is lost when analysts change roles or companies.

**Problem 4 — Detection rules are black boxes**
Analysts inherit hundreds of rules they didn't write and don't understand. When a rule fires 500 times a day, they don't know why. When they want to create a new rule for a pattern they discovered, they have to write it from scratch in a query language. The feedback loop between investigation and detection is broken.

**Problem 5 — Shift transitions lose context**
When one analyst's shift ends and another begins, there is no structured handoff. The incoming analyst spends 15–30 minutes reading scattered notes and alert queues to understand what happened. Critical context falls through the cracks.

### 2.2 Root Cause

All five problems have the same root cause: **the interface between the analyst and their data requires too much specialized knowledge and too much manual effort.** The SIEM is a database with a query interface. It is not a collaborative intelligence platform.

---

## 3. Goals & Success Metrics

### 3.1 Business Goals

- Establish SentinelIQ as the first AI-native SIEM platform
- Achieve product-market fit with enterprise SOC teams (50+ analysts) within 18 months of GA
- Reach 20 enterprise beta customers before GA launch

### 3.2 Product Goals

| Goal | Target | Timeline |
|---|---|---|
| Reduce MTTD | 60% reduction vs. analyst baseline | 12 months post-GA |
| Reduce documentation overhead | 75% reduction in time-on-task | 12 months post-GA |
| AI search bar adoption | > 80% of queries through the bar (vs. traditional query box) | 6 months post-GA |
| Analyst NPS | > 50 from beta cohort | At GA |

### 3.3 Phase 0 Engine Health Metrics

These metrics gate Phase 1 from starting. All must be met at the end of Week 6.

| Metric | Target | How Measured |
|---|---|---|
| Intent classifier accuracy | > 90% | Weekly benchmark on 200-item labeled test set |
| NLQ query correctness | > 85% | Security engineer manual review of generated KQL vs. analyst intent |
| Query mode p95 latency | < 2 seconds | End-to-end: submission → KQL rendered on screen |
| Action mode p95 latency | < 5 seconds | End-to-end: submission → capability result visible |
| Session context preservation | > 95% of follow-ups use correct prior context | Automated regression suite of chained query scenarios |
| Analyst disambiguation rate | < 10% of queries trigger disambiguation | Production telemetry on disambiguation chip activation |

### 3.4 Capability Outcome Metrics

| Capability | Primary Metric | Target |
|---|---|---|
| NL Alert Triage | Analyst override rate | < 15% after 30-day feedback cycle |
| Threat Hunt Mode | Hunt-to-finding time | < 15 min (vs. 90 min manual baseline) |
| Timeline Reconstruction | Stage labeling accuracy | > 85% vs. manual analyst benchmark |
| Comparative Queries | Anomaly TP confirmation rate | > 75% analyst confirmation in UAT |
| One-Click Documentation | Time to complete incident report | < 5 min (vs. 45 min manual baseline) |
| Rule Suggestion | Deployed rule FP rate on back-test | < 5% before deployment |
| Blast Radius Estimation | Asset coverage completeness | > 90% vs. manual IAM audit |
| Shift Handoff Briefing | Incoming analyst ramp time | < 3 min to situational awareness |
| Noise Reduction Coaching | Alert volume reduction per coached rule | > 30% within 7 days of tuning |
| Runbook Generation | Runbook adoption rate | > 70% of analysts use before closing covered alert types |

---

## 4. Users & Personas

### 4.1 Primary Persona — Tier 1 SOC Analyst (Alex)

**Background:** 1–3 years of experience. Can write basic KQL but struggles with complex multi-source correlations. Handles high alert volumes during shifts. Frustrated by alert fatigue and repetitive documentation tasks.

**Key jobs to be done:**
- Quickly triage whether an alert is real or a false positive
- Understand what happened around a suspicious event without writing complex queries
- Document resolved incidents without spending an hour formatting a report

**Pain points with current SIEM:**
- Has to ask senior analysts to write queries for them
- Loses investigation context when switching between views
- Dreads end-of-shift documentation

**How SentinelIQ helps:** The AI search bar removes the query-writing barrier entirely. Alex types what they want in plain English and gets the result. Documentation is one click. The bar remembers what Alex was investigating so context is never lost.

---

### 4.2 Secondary Persona — Tier 2 / Threat Hunter (Morgan)

**Background:** 5–8 years of experience. Expert in MITRE ATT&CK. Writes custom detection rules. Runs proactive threat hunts. Manages junior analysts. Frustrated by the time it takes to operationalize hunt findings into rules.

**Key jobs to be done:**
- Run structured threat hunts against specific threat actor TTPs
- Convert hunt findings into detection rules without manually authoring KQL
- Understand why existing rules are noisy and tune them efficiently

**How SentinelIQ helps:** Threat Hunt Mode does the multi-query orchestration that Morgan normally does manually. Rule Suggestion turns their investigation findings into deployable rules in minutes. Noise Reduction Coaching explains exactly which fields to tune and shows the impact before applying.

---

### 4.3 Tertiary Persona — SOC Manager (Jordan)

**Background:** 10+ years of experience. Manages a team of 8–15 analysts. Accountable for MTTD, MTTR, and compliance reporting. Needs to report to CISO and board on security posture.

**Key jobs to be done:**
- Get an accurate picture of SOC performance without manual reporting
- Ensure smooth shift transitions with no dropped alerts
- Produce board-level and regulatory reports quickly

**How SentinelIQ helps:** Shift Handoff Briefing eliminates context loss at transitions. One-Click Documentation produces executive-ready summaries from technical incidents. Runbook Generation ensures institutional knowledge is captured and not lost when analysts leave.

---

## 5. Phase 0 — AI Search Bar Engine

> **Phase 0 is a prerequisite for all capability work. No Phase 1 development begins until the Phase 0 exit gate is passed.**

### 5.1 Overview

The AI Search Bar engine is five tightly integrated components that work together to make the bar feel like one seamless, intelligent experience. They are built once and shared by all capabilities.

---

### 5.2 Component 1 — Intent Classifier

#### What it does
Every bar submission passes through the intent classifier first. It determines which of the three modes the analyst is in and routes to the correct handler.

#### The three modes

**Query mode** — The analyst wants to find something in the logs.
> *"Show me failed logins from unusual geolocations in the last 6 hours"*

**Action mode** — The analyst wants to do something with what is on screen.
> *"Summarize this as a board-level report" / "Create a detection rule for this pattern"*

**Conversation mode (Refine)** — The analyst is refining a prior query in the same thread.
> *"Now filter that to just the finance department" / "What about last week?"*

#### Requirements

- **Input:** Raw analyst text + current session context object
- **Output:** `{ mode: 'query' | 'action' | 'refine', intent_label: string, confidence: 0–1, extracted_entities: string[] }`
- **Latency:** Must complete in < 200ms — invisible to the analyst
- **Confidence threshold:** If `confidence < 0.6`, surface an inline disambiguation prompt as clickable chips — not a blocking modal
- **Disambiguation chips** must offer the top-2 most likely interpretations plus a free-text fallback
- **Training data:** 200-item labeled test set covering all three modes, edge cases (ambiguous inputs, typos, mixed intent), and adversarial inputs

#### Disambiguation UX example
```
 ┌─────────────────────────────────────────────────────────────┐
 │  Did you mean:                                               │
 │  [Search logs for this pattern]  [Create a rule from this]  │
 │  [Something else — let me rephrase]                         │
 └─────────────────────────────────────────────────────────────┘
```

---

### 5.3 Component 2 — NLQ Engine (Natural Language → Query)

#### What it does
When the intent classifier routes to **Query mode**, the NLQ engine translates the analyst's plain-English input into a syntactically valid, semantically correct log query in the platform's configured backend language (KQL by default, SPL or EQL as alternatives).

#### The five stages

**Stage 1 — Semantic parsing**
Extract from the input:
- Time range (explicit or relative: "last 6 hours", "this week", "yesterday morning")
- Entities: users, hosts, IPs, processes, file hashes, service names
- Behaviors: verbs and actions ("failed logins", "outbound connections", "file writes")
- Qualitative descriptors: terms that require statistical reasoning ("unusual", "high volume", "first time ever", "abnormal", "rare")

**Stage 2 — Descriptor resolution** *(the core differentiator)*
Qualitative terms are resolved against entity baselines and platform context — not hardcoded definitions.

| Analyst says | NLQ resolves to |
|---|---|
| "unusual geolocations" | Countries not seen in `geo_baseline(user, 90d)` |
| "high volume" | Volume exceeding `mean(entity_metric, 90d) + 2σ` |
| "first time ever" | Event with no match in `entity_history(all_time)` |
| "abnormal login time" | Login outside `time_distribution(user, 90d, p10–p90)` |
| "rare process" | Process with `prevalence(org_wide, 30d) < 1%` |

This stage requires an LLM reasoning call with entity baseline data injected into context. It is what makes the bar feel intelligent rather than mechanical.

**Stage 3 — Query construction**
The resolved intent is compiled into the target query language. The engine generates a valid, executable query with appropriate clauses, filters, aggregations, and time bounds. The query is syntactically validated before being returned to the analyst.

**Stage 4 — Explanation generation**
Every generated query is accompanied by a plain-English breakdown:
- What the query does in one sentence
- A clause-by-clause explanation (each line of KQL mapped to plain English)
- Any assumptions made during descriptor resolution, with the data they were based on

**Stage 5 — Confidence scoring**
The engine self-scores its output (0–100). Queries scoring below 70 display a yellow confidence badge with a tooltip explaining the source of uncertainty. Queries below 40 require analyst confirmation before execution.

#### Requirements

- Default output: KQL. SPL and EQL configurable per tenant.
- Query validation must run before returning to the analyst — no invalid queries reach the execution engine
- Descriptor resolution must complete in < 1.5 seconds including the LLM call
- Total query mode p95 latency (classification → KQL on screen): < 2 seconds
- Multi-clause queries must be handled: "failed logins AND lateral movement AND data exfiltration from the same host" generates a single correlated query, not three separate ones

---

### 5.4 Component 3 — Session Context Manager

#### What it does
The session context manager is the memory of the search bar. It maintains a rolling state object across the analyst's entire session, enabling Conversation mode and powering the context injection that makes Action mode work.

#### State model

```
SessionContext {
  session_id: string
  analyst_id: string
  started_at: timestamp
  query_history: QueryEntry[]     // last 20 queries + result metadata
  active_entities: Entity[]       // users/hosts/IPs currently in scope
  current_results: ResultSummary  // metadata of what is currently on screen
  active_investigation: string?   // incident ID if set
  analyst_notes: string[]         // anything the analyst has explicitly flagged
  last_updated: timestamp
}
```

#### Requirements

- Context is updated after every query execution and every capability action
- In **Conversation mode**, the context manager merges the new input with the prior query rather than replacing it: "now filter to finance" rewrites the existing query in place, preserving all other clauses
- Context is compressed after every 5 turns using a dedicated summarization pass — oldest turns become a summary, not dropped. Key entities and findings are always preserved regardless of session length
- Context persists server-side for **8 hours** — analysts can close and reopen the browser without losing their investigation thread
- Context is **shareable**: a `context_link` can be generated that loads the full session state for a colleague receiving the link
- Context injection: on every LLM call (from any capability), the context manager prepends a compressed session summary so the model always has the thread

---

### 5.5 Component 4 — Action Dispatcher

#### What it does
When the intent classifier routes to **Action mode**, the action dispatcher resolves which capability to invoke and passes the current context as its input automatically — the analyst never has to re-specify what "this" refers to.

#### Action registry

The dispatcher maintains a typed registry mapping action labels to capability handlers:

| Action phrase examples | Dispatches to |
|---|---|
| "Summarize this", "Write a report" | `DocumentationCapability.draft(context)` |
| "Create a rule for this", "Turn this into an alert" | `RuleSuggestionCapability.generate(context)` |
| "Write my handoff", "Brief the next shift" | `HandoffCapability.generate(context)` |
| "Triage these alerts", "Score false positives" | `TriageCapability.score(context)` |
| "Estimate blast radius", "What's at risk?" | `BlastRadiusCapability.analyze(context)` |
| "Create a playbook for this" | `RunbookCapability.generate(context)` |
| "Why does this rule fire so much?" | `NoiseCoacingCapability.analyze(context)` |

#### Requirements

- Context injection is automatic — the current result set, session history, and active entities are injected into every capability call without analyst input
- Phase 0 ships with the registry infrastructure and **2 placeholder handlers** for integration testing; all 10 capability handlers are registered during their respective build sprints in Phases 1–3
- **Progressive disclosure:** while a capability runs, the bar renders a live status feed below the input: `"Drafting report... extracting IOCs... generating narrative... done."` — the analyst sees progress, not a spinner
- If the dispatcher cannot resolve the intent to a registered handler with confidence > 0.7, it surfaces the top-2 matching handlers as chips for the analyst to confirm before executing

---

### 5.6 Component 5 — Query Memory & Suggestion Engine

#### What it does
Powers the autocomplete, proactive chip suggestions, and query template system visible in the search bar UI.

#### Requirements

**Autocomplete**
- Per-analyst query history is stored and used to surface relevant completions as the analyst types, starting after 3 characters
- Completions rank by: recency, frequency, and relevance to current session context

**Contextual chip suggestions**
- After every query or capability action, the bar generates 3–5 suggestion chips based on the current session context
- Chips are generated by the LLM based on session state — they are **not hardcoded**
- Example chips after a failed-login query: `[Correlate with lateral movement]` `[Estimate blast radius]` `[Find related alerts]` `[Write triage summary]`

**Cross-team suggestion pool**
- Anonymized successful queries from across the analyst team surface as `"Commonly used"` chips
- Success signal: a query that returned results and was not immediately modified or discarded
- Spreads institutional knowledge across the team without requiring explicit sharing

**Query templates**
- Analysts can save any query as a named template: `"Daily geo-anomaly check"`, `"End-of-week privilege escalation scan"`
- Templates appear in the analyst's personal chip library and are accessible by name in the bar
- Templates support parameterization: `"Geo-anomaly check for {{user}}"` — analyst fills the variable inline

---

### 5.7 Search Bar UI Specification

#### Layout and positioning
- The bar is **always visible** at the top of every platform view — it does not live on a search page
- Minimum width: 600px. Expands to full-width on focus.
- Z-index: above all other platform chrome — nothing overlays the bar

#### Input area
- Single-line by default, expands to multi-line for inputs > 80 characters
- Mode indicator pill to the left of the input showing current detected mode — updates in real time with 300ms debounce
- Placeholder text rotates through example prompts from each mode on an 8-second cycle

#### Query preview card
- Appears inline **below the bar** on a translucent card — never in a modal or separate pane
- Shows: generated query (syntax-highlighted), confidence badge (if < 70), `[Run]` and `[Edit]` buttons
- Explanation section: collapsed by default, expandable — shows clause-by-clause breakdown in plain English
- Query preview appears within 2 seconds of the analyst stopping typing (500ms debounce)

#### Chip row
- Horizontal scrollable row of contextual suggestion chips, sits below the query preview
- Updates after every result — chips always reflect what is most relevant given the current session state
- Maximum 6 chips visible without scrolling

#### Session breadcrumb
- A subtle breadcrumb trail below the chip row shows the last 3 queries in the session
- Clicking any breadcrumb item restores that session state (query + results)
- Breadcrumb is collapsible

#### Confidence badge
- Yellow badge on the query preview card when confidence < 70
- Tooltip on hover explains what the engine was uncertain about: `"Unusual was resolved using a 90-day baseline — only 14 days of data available for this user"`

---

### 5.8 Phase 0 Exit Gate

The following criteria **all** must be met before Phase 1 development begins:

- [ ] Analyst can type any plain-English log query and receive valid KQL with a clause-by-clause explanation in under 2 seconds
- [ ] Analyst can type a follow-up refinement and the prior query updates in place with full context preservation
- [ ] Intent classifier routes correctly on ≥ 90% of a 200-item labeled test set covering all three modes
- [ ] Action dispatcher correctly invokes the two placeholder handlers for `"summarize this"` and `"create a rule"` inputs
- [ ] Session context persists across browser close/reopen within an 8-hour window
- [ ] Shareable context links load the correct session state for a recipient
- [ ] Contextual chips generate correctly after a sample query execution (end-to-end, not mocked)
- [ ] Zero P0 bugs in the bar UI on Chrome, Firefox, and Safari (desktop)

---

## 6. Phase 1 — Query Foundation & Triage

> All Phase 1 capabilities surface through the Phase 0 search bar engine. Each capability registers its action handler in the action dispatcher and its suggestion chips in the query memory.

---

### 6.1 Capability 1 — Natural Language Alert Triage

**Trigger phrases:** *"Which of today's alerts are likely false positives?"* / *"Triage my open alerts"* / *"Score these 50 alerts"*

**How it plugs into the bar:** Intent classifier detects triage intent and routes to `TriageCapability.score(context)`. The handler receives the analyst's current alert list from context — no navigation required. Results replace the main alert panel inline.

#### User story
> As a Tier 1 analyst, I want to ask the platform which of my open alerts are likely false positives so I can focus my time on the ones that matter without manually reviewing every alert.

#### Functional requirements

- **Verdict schema:** Each alert receives `{ fp_probability: 0–100, tp_probability: 0–100, confidence: 'high'|'medium'|'low', reasoning: string, influencing_fields: string[] }`
- **Context payload per alert:** Alert metadata + raw log sample + entity history (90 days) + similar past alerts with analyst verdicts
- **Batch processing:** Triage up to 200 alerts in parallel using async LLM calls. Results stream in as they complete — no waiting for all 200
- **Explainability renderer:** Highlights the specific log fields that most influenced the verdict with a visual weight indicator next to each field name
- **Feedback capture:** Analyst can accept or override any verdict with one click. Overrides are written to a label store and used to update the triage prompt's few-shot examples on a weekly cycle
- **Verdict UI:** Alerts sorted by TP probability descending. Color-coded badges: red (likely TP), yellow (uncertain), grey (likely FP)

#### Acceptance criteria
- 50-alert triage completes in under 8 seconds
- Analyst override rate drops below 15% after a 30-day feedback cycle
- FP detection precision > 80% on the internal labeled test set

---

### 6.2 Capability 2 — Threat Hunt Mode

**Trigger phrases:** *"Find anything that looks like LAPSUS$ TTPs this week"* / *"Hunt for credential dumping in the last 3 days"* / *"Look for signs of Scattered Spider activity"*

**How it plugs into the bar:** The NLQ engine detects hunt intent (threat actor name, TTP keyword, or explicit "hunt" verb) and routes to the hunt orchestrator. The bar shows a live progress feed as sub-queries execute.

#### User story
> As a Tier 2 threat hunter, I want to run a structured hunt for a specific threat actor's TTPs without having to manually author a query per technique, so I can cover the full ATT&CK surface quickly.

#### Functional requirements

- **ATT&CK knowledge base:** Embedded STIX/TAXII feed, synced weekly from MITRE CTI GitHub. Covers all 14 tactics, 200+ techniques, and profiles for ≥ 50 named threat actors
- **Hunt orchestrator:** Given a resolved TTP set, generates and executes one targeted sub-query per technique. Manages async execution, cancellation, and timeout (30s per sub-query)
- **Progress feed:** Bar shows live updates — `"Checking T1078 Valid Accounts... T1059 Command Line... 8 of 14 techniques complete"`
- **Result clustering:** Matching events grouped by ATT&CK technique ID with confidence level (High / Medium / Low evidence)
- **Hunt narrative:** 3–5 paragraph LLM-generated summary of findings: what was found, what was not found, and what should be investigated next
- **ATT&CK heatmap:** Interactive grid showing technique coverage — grey (no evidence), yellow (low confidence), red (confirmed evidence). Clickable — each technique cell opens the matching events

#### Acceptance criteria
- Hunt queries for known threat actors resolve in under 15 seconds
- ATT&CK mapping accuracy > 90% vs. manual analyst benchmark
- All 14 ATT&CK tactics covered in the query generation layer

---

### 6.3 Capability 3 — Timeline Reconstruction

**Trigger phrases:** *"Show me everything before and after this alert"* / *"Reconstruct the attack chain for incident #4821"* / *"Build a timeline for this host"*

**How it plugs into the bar:** If an alert is selected or an incident number is referenced, the context manager already has the pivot entities. The timeline handler extracts them from context immediately — the analyst does not re-specify them.

#### User story
> As a Tier 1 or Tier 2 analyst, I want to see a chronological attack chain of everything that happened around a suspicious alert so I can understand the full scope without manually correlating events across 5 different log sources.

#### Functional requirements

- **Entity pivot:** Given seed entities from the alert (user, host, IP, process), executes parallel graph traversals to collect all related events within a configurable window (default: 2 hours before, 30 minutes after)
- **Event stitcher:** Deduplicates and merges events across sources. Handles clock skew up to 60 seconds. Preserves original timestamps alongside normalized timestamps
- **Stage classifier:** Labels each event by ATT&CK tactic (Reconnaissance, Initial Access, Execution, Persistence, Privilege Escalation, Defense Evasion, Credential Access, Discovery, Lateral Movement, Collection, Exfiltration, Command and Control, Impact). Uses a locally-deployed gradient-boosted classifier — no LLM call per event
- **Stage annotations:** After classification, the LLM generates one plain-English annotation per stage group (not per event), keeping LLM calls bounded regardless of event volume
- **Timeline UI:** Interactive vertical swimlane. Entity lanes on X axis, time on Y axis. Click any event to expand the raw log. Click any stage annotation to ask a follow-up question about it directly in the search bar

#### Acceptance criteria
- Timeline renders in under 5 seconds for a 4-hour window across 5 log sources
- Stage labeling matches manual analyst classification in > 85% of test cases

---

## 7. Phase 2 — Deep Investigation Intelligence

---

### 7.1 Capability 4 — Comparative Queries

**Trigger phrases:** *"How does jsmith's behavior today compare to their baseline?"* / *"Is this host acting normally?"* / *"Flag anything unusual about this user vs. their peers"*

#### User story
> As a Tier 2 analyst investigating a suspicious user, I want to see how their activity today compares to their normal behavior and their peer group so I can quickly determine if something is genuinely anomalous.

#### Functional requirements

- **UBA engine:** Rolling 90-day behavioral baseline per entity, per dimension: login hours, source IPs, systems accessed, data volumes transferred, process names executed, authentication methods used
- **Peer group engine:** Clusters entities by role, department, subnet, and access pattern. Each entity's behavior is compared to both their own history and their peer group's current activity
- **Deviation scorer:** Standard deviation computation per dimension. Dimensions outside 2σ are flagged yellow; outside 3σ are flagged red. Threshold configurable per tenant
- **Narrative:** Plain-English summary auto-generated: *"jsmith today accessed 14 systems they have never touched before, logged in 4 hours earlier than usual, and transferred 3x their average data volume. No peers show similar activity."*
- **Comparison renderer:** Side-by-side table (baseline vs. today) with color-coded deviation indicators and peer percentile markers. Available dimensions shown as rows; values and deviation score shown as columns

#### Acceptance criteria
- Baselines available for all entities active in the last 90 days within 24 hours of ingestion
- Anomaly TP confirmation rate > 75% in analyst UAT

---

### 7.2 Capability 5 — One-Click Documentation

**Trigger phrases:** *"Write the post-incident report"* / *"Document this investigation"* / *"Generate an executive summary for this incident"*

#### User story
> As a Tier 1 or Tier 2 analyst who just resolved an incident, I want to generate a structured post-incident report with one command so I don't have to spend an hour manually writing it up from memory.

#### Functional requirements

- **Artifact collector:** At trigger, gathers from session context: all alerts involved, correlated events, timeline stages, entities affected, analyst notes, actions taken, investigation duration
- **Report templates — three variants:**
  - `Technical`: Full detail — IOCs, log evidence, query results, technical root cause
  - `Executive`: One-page narrative in non-technical language — what happened, what was impacted, what was done, what changes are recommended
  - `Regulatory`: Structured for compliance evidence — PCI DSS, SOC 2, HIPAA, ISO 27001. Includes chain-of-custody metadata

- **Report sections generated:** Executive Summary · Timeline of Events · Systems and Users Affected · Indicators of Compromise · Root Cause Analysis · Response Actions Taken · Recommendations

- **In-platform editor:** Rich text editor. AI-generated content highlighted in blue. Analyst can accept, edit, or regenerate any section individually without regenerating the whole report

- **IOC extraction:** IPs, hashes, domains, user accounts, and registry keys are automatically extracted from the narrative into a structured IOC table and pushed to the platform's threat intelligence repository

- **Export:** DOCX and PDF with embedded chain-of-custody metadata (analyst name, timestamp, log sources referenced, platform version)

#### Acceptance criteria
- Report generation completes in under 30 seconds
- Time to complete incident report: < 5 min vs. 45 min manual baseline in analyst UAT

---

### 7.3 Capability 6 — Rule Suggestion

**Trigger phrases:** *"Create a detection rule for this pattern"* / *"Turn this into an alert rule"* / *"Suggest a rule based on what I found"*

#### User story
> As a threat hunter who just found a novel attack pattern, I want the platform to convert my investigation findings into a deployable detection rule so I don't have to manually author KQL and I don't lose the pattern when I move on.

#### Functional requirements

- **Pattern extraction:** Analyst selects a set of events representing the attack pattern. The engine identifies: discriminating fields, value ranges, event sequences, and time windows that are common across selected events and statistically absent in surrounding non-selected events
- **Rule compiler:** Translates the extracted pattern into valid KQL (default), SPL, or EQL. Generates threshold, sequence, and cardinality rule variants for analyst review — analyst selects which variant to deploy
- **FP estimator:** Back-tests the generated rule against 30 days of historical data before deployment. Reports: estimated daily alert volume, FP rate, and top-3 FP-causing patterns
- **Rule explanation:** Plain-English summary shown side-by-side with triggering events — what the rule detects and why each condition is necessary
- **Deployment pipeline:** 4-stage pipeline — Draft → Analyst Review → Staged (10% of traffic, 48 hours) → Full Deploy. One-click promotion at each stage. Full rollback available at any stage within 30 days

#### Acceptance criteria
- Estimated FP rate < 5% on back-test for rules that proceed to deployment
- Rule authoring time: < 10 min vs. 2-hour manual baseline

---

### 7.4 Capability 7 — Blast Radius Estimation

**Trigger phrases:** *"If jsmith's account is compromised, what's at risk?"* / *"Map the blast radius for this host"* / *"What can this service account access?"*

#### User story
> As a Tier 2 analyst responding to a credential compromise, I want to immediately understand what systems and data are at risk from the compromised account so I can prioritize containment actions correctly.

#### Functional requirements

- **IAM graph ingestion:** Pulls permissions data from Active Directory, Azure AD, AWS IAM, and GCP IAM into the Neo4j entity graph on a 4-hour refresh cycle. Covers: direct access, group membership, delegated permissions, service account relationships, and trust relationships
- **Lateral path tracer:** Breadth-first graph traversal from the seed entity, following all edge types. Pruned at depth 5 by default (configurable). Returns: all reachable assets, the access path to each, and the access type (direct / via group / via delegation)
- **Asset sensitivity scorer:** Rates each reachable asset by sensitivity — crown jewel databases, PII stores, privileged accounts, production systems, backup systems, code repositories weighted highest. Rule-based scorer with ML override for unlabeled assets
- **Visualization:** Interactive D3.js force-directed graph. Seed entity at center. Nodes sized by sensitivity score. Edges colored by access type. Click any node to see the access path and the raw IAM permissions behind it
- **Containment narrative:** *"The 3 highest-risk paths are: 1) jsmith → Domain Admin via nested group membership. 2) jsmith → prod-db-01 via delegated service account credentials. 3) jsmith → backup server with write access. Recommend: immediate password reset, session termination, and review of service account delegation."*

#### Acceptance criteria
- Blast radius graph renders in under 8 seconds
- Asset coverage > 90% vs. manual IAM audit
- Containment recommendations confirmed as accurate by security engineers in ≥ 85% of test cases

---

## 8. Phase 3 — Automation, Coaching & GA

---

### 8.1 Capability 8 — Shift Handoff Briefing

**Trigger phrases:** *"Write my handoff summary"* / *"Brief the incoming analyst"* / *"What should the next shift know?"*

#### User story
> As an analyst ending my shift, I want to generate a structured handoff brief in one command so the incoming analyst is immediately up to speed without me having to write notes or schedule a call.

#### Functional requirements

- **Shift window:** Configurable (default 8 hours). Analyst can specify custom range
- **Aggregation:** All activity in window — alerts opened, escalated, closed, pending; investigations in progress; actions taken; notable observations
- **Brief structure:** Open Items (ranked by urgency / SLA proximity) · Closed This Shift (summary) · Key Context for Incoming Analyst · Watch List (top 3 items to monitor in the next 4 hours)
- **Push delivery:** Slack, Microsoft Teams, and email. Incoming analyst receives the link before logging in. Deep links from every referenced item open directly into the alert, investigation, or entity view
- **In-platform briefing card:** Incoming analyst sees the handoff brief as a dismissable overlay on first login after receiving a handoff. Persists as an accessible card until dismissed

#### Acceptance criteria
- Brief generated in under 15 seconds
- Incoming analyst situational awareness time: < 3 min vs. 15 min unstructured baseline in UAT

---

### 8.2 Capability 9 — Noise Reduction Coaching

**Trigger phrases:** *"Why does this rule fire so often?"* / *"Help me tune alert X"* / *"What's causing all this noise from rule Y?"*

#### User story
> As a Tier 2 analyst managing a noisy detection rule, I want the platform to analyze why it fires so often and suggest specific tuning changes so I can reduce alert fatigue without accidentally suppressing real threats.

#### Functional requirements

- **FP history retrieval:** Last 30 days of firing history for the specified rule, including all analyst verdicts (TP / FP / suppressed / no action)
- **Pattern mining:** DBSCAN clustering over FP event features — identifies common field values, user groups, IP ranges, time windows, and value patterns that consistently produce FPs while being absent in TP events
- **Tuning recommendations:** Each cluster maps to a specific query modification: exclusion clause, time-of-day filter, threshold adjustment, allowlist entry, or scope restriction. Each recommendation shows: the cluster it addresses, percentage of FPs it would eliminate, and estimated residual FP rate
- **Impact preview:** Before applying, shows side-by-side: current daily alert volume vs. estimated new volume, current FP rate vs. estimated new FP rate
- **One-click apply:** Analyst confirms a recommendation — it is applied to the live rule immediately. Full rollback available within 30 days
- **Tuning audit log:** All AI-suggested and analyst-applied changes logged with: timestamp, change description, analyst who applied, before/after FP rates, and verification status (confirmed improvement / pending / regressed)

#### Acceptance criteria
- Alert volume reduction > 30% per coached rule within 7 days of tuning application
- FP rate improvement confirmed by analyst in ≥ 80% of cases

---

### 8.3 Capability 10 — Runbook Generation

**Trigger phrases:** *"Create a playbook for this alert type"* / *"Write a runbook based on how I handled this"* / *"Generate a response procedure for privilege escalation"*

#### User story
> As a SOC manager, I want the platform to automatically generate response runbooks from how my analysts handle incidents so that institutional knowledge is captured and junior analysts have structured guidance rather than starting from scratch every time.

#### Functional requirements

- **Incident historian:** All resolved incidents indexed with vector embeddings (using a text embedding model). Enables semantic similarity search — finds past incidents similar to the current one regardless of how they were described or labeled
- **Step extractor:** Identifies discrete response actions from unstructured analyst notes, SOAR execution logs, and command history. Classifies each action into: Triage · Contain · Investigate · Remediate · Communicate · Close
- **Runbook synthesizer:** LLM synthesizes extracted steps from all similar past incidents into a generalized, numbered playbook with: decision branches (`"If lateral movement confirmed → go to step 7"`), role annotations per step, estimated time per step, and tool/command references
- **Playbook library:** Versioned, searchable repository. Search by: alert type, ATT&CK technique, asset type, or keyword. Each runbook shows: usage count, analyst rating (1–5 stars), last updated, and average time-to-close when followed
- **In-bar prompting:** When an alert fires that matches a runbook, the bar surfaces: `[Runbook available for this alert type — load it]` as a chip. One click loads the runbook into a side panel alongside the investigation view

#### Acceptance criteria
- Runbook adoption rate: > 70% of analysts use a runbook before closing alerts of types with coverage
- Runbook creation time: < 10 min vs. 3+ hours manual baseline

---

## 9. Non-Functional Requirements

### 9.1 Performance

| Requirement | Target |
|---|---|
| Query mode end-to-end latency (p95) | < 2 seconds |
| Action mode end-to-end latency (p95) | < 5 seconds |
| Alert triage — 50 alerts | < 8 seconds |
| Timeline reconstruction — 4h window, 5 sources | < 5 seconds |
| Blast radius graph render | < 8 seconds |
| Report generation | < 30 seconds |
| Log ingestion throughput | ≥ 100,000 events/second per tenant |
| Search query execution (hot store) | < 3 seconds for 95th percentile query |

### 9.2 Security & Privacy

- **PII scrubbing:** A PII scrubbing layer runs before every LLM API call. Scrubbed fields: email addresses, full names, phone numbers, SSNs, credit card numbers, health identifiers
- **On-premise deployment option:** For customers with data residency requirements, SentinelIQ must support a fully on-premise or customer-VPC deployment where no log data leaves the customer's environment. The LLM layer uses a self-hosted model in this configuration
- **Data residency:** Configurable per tenant — US, EU, APAC storage regions
- **Encryption:** All log data encrypted at rest (AES-256) and in transit (TLS 1.3 minimum)
- **Role-based access control:** Analyst, Senior Analyst, Threat Hunter, SOC Manager, Admin — each with configurable capability access
- **Audit logging:** All analyst queries, AI actions, rule changes, and tuning modifications are logged immutably with analyst identity and timestamp

### 9.3 Availability & Reliability

- Platform SLA: 99.9% uptime
- Search bar engine: 99.95% uptime (higher than platform SLA — degraded mode falls back to traditional query box if AI engine is unavailable)
- Log ingestion pipeline: zero data loss architecture — Kafka replication factor ≥ 3
- RTO: < 4 hours. RPO: < 15 minutes

### 9.4 Scalability

- Multi-tenant architecture — all data strictly isolated between tenants
- Horizontal scaling for all stateless services
- Entity graph partitioned by tenant — no cross-tenant graph traversal possible
- Support up to 1TB/day log ingestion per tenant at GA

### 9.5 Accessibility

- WCAG 2.1 AA compliance for all UI components
- Search bar and all capability outputs must be keyboard-navigable
- Screen reader support for alert panels, timeline, and report editor

---

## 10. Out of Scope

The following are explicitly out of scope for the initial 14-month delivery:

- **Mobile application** — web-only for GA. Mobile app is a post-GA workstream
- **SOAR automation execution** — SentinelIQ can recommend actions and generate playbooks, but does not execute automated response actions in v1. SOAR integration is a Phase 4 item
- **Custom LLM fine-tuning** — the feedback loop updates few-shot prompts, not model weights. Full fine-tuning is a post-GA capability
- **Real-time threat intelligence feeds** — the ATT&CK knowledge base is updated weekly, not in real time. Live TAXII feed ingestion is a post-GA enhancement
- **Email/Slack alert delivery** — handoff briefings can be pushed to Slack/Teams/email, but real-time alert notifications via these channels are out of scope for v1
- **Multi-language support** — English only at GA. Localization roadmap to be defined post-GA
- **AWS IAM and GCP IAM ingestion for blast radius** — Active Directory and Azure AD are in scope for Phase 2. AWS and GCP IAM ingestion are Phase 4

---

## 11. Dependencies & Risks

### 11.1 External Dependencies

| Dependency | Risk | Mitigation |
|---|---|---|
| Anthropic Claude API | Latency spikes or availability issues degrade the search bar experience | Streaming responses mask latency. Caching for repeated queries. Local model fallback for classification steps |
| MITRE ATT&CK CTI GitHub | Weekly sync fails or breaking schema changes | Fallback to last successful sync. Schema version lock. Alert to platform team on sync failure |
| Neo4j (entity graph) | Performance degrades at enterprise scale | Tenant-partitioned graph. Approximate shortest-path algorithms. Cached traversal results for frequent queries |
| Customer IAM systems (AD, Azure AD) | Data freshness — IAM changes not reflected in blast radius until next 4h sync | Show last-synced timestamp prominently on blast radius results. On-demand refresh available for analysts |

### 11.2 Internal Dependencies

| Dependency | Required by | Owner |
|---|---|---|
| Phase 0 exit gate passed | Phase 1 start | AI/ML + Platform team |
| Entity baseline service v1 | Capability 1 (Triage), Capability 4 (Comparative) | ML team |
| Entity graph v1 (Neo4j) | Capability 3 (Timeline), Capability 7 (Blast Radius) | Platform team |
| Vector store (Pinecone / pgvector) | Capability 10 (Runbook) | ML Ops |

### 11.3 Key Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Phase 0 slip cascades to all downstream phases | **High** | Phase 0 is timeboxed to 6 weeks with a hard exit gate. No capability work begins before gate is passed |
| Descriptor resolution accuracy too low for analyst trust | **High** | Confidence scoring gates low-confidence queries. Weekly prompt improvement cycle. 90% accuracy target on labeled test set |
| Intent classifier misroutes Query vs. Action | **Medium** | Disambiguation chips catch misroutes gracefully. Misroute rate is a primary health metric. Each correction generates a labeled training example |
| PII in logs sent to external LLM API | **High** | PII scrubbing layer required before every LLM call. On-premise deployment option for regulated industries |
| Session context exceeds LLM context window | **Medium** | Compression pass every 5 turns. Key entities and findings always preserved regardless of session length |
| Analyst adoption — bar feels unfamiliar | **Medium** | Onboarding overlay with live examples. Suggestion chips guide first interactions. Traditional query box remains accessible as fallback |

---

## 12. Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Which vector database do we standardize on — Pinecone (managed) or pgvector (self-hosted)? Trade-off: Pinecone is faster to ship, pgvector supports on-premise deployment requirement | ML Ops | End of Week 2 |
| 2 | What is the maximum context window we can reliably inject into Claude API calls without hitting latency targets? Need to benchmark context sizes against p95 latency targets | AI/ML | End of Week 3 |
| 3 | Should the NLQ engine support SPL and EQL at Phase 0, or ship KQL-only with others added in Phase 1? Shipping all three in Phase 0 adds 2 weeks of effort | Engineering Lead | End of Week 1 |
| 4 | What is the data residency requirement for our first 3 target enterprise customers? This determines whether on-premise deployment is a Phase 0 or Phase 2 requirement | Product + Sales | End of Week 2 |
| 5 | Who owns the ATT&CK knowledge base quality — security engineering or AI/ML? Needs a clear DRI given the weekly sync cadence and the hunt mode dependency on accuracy | Product | End of Week 1 |
| 6 | Should the disambiguation chip use 2 or 3 options? More options increase cognitive load but reduce re-submission rate. Recommend A/B testing in Phase 1 beta | Product + Frontend | Phase 1 beta |
| 7 | What is the retention policy for analyst query history used by the suggestion engine? GDPR and enterprise data governance implications need legal review | Product + Legal | End of Month 1 |
| 8 | Do we build the tuning audit log to meet SOC 2 Type II requirements from day one, or is v1 audit logging sufficient? Affects Phase 3 scope | Product + Compliance | End of Phase 2 |

---

*Document version 1.0 — April 2026*  
*SentinelIQ Product Management — Confidential*  
*Supersedes: no prior PRD exists for this product*
