# SentinelIQ

**A memory-first, AI-assisted SOC investigation workspace that helps analysts turn alerts, logs, queries, evidence, notes, and reports into a connected, explainable investigation.**

> **Manual SOC workflow first. AI-assisted acceleration second. Investigation memory always.**

`Status: Mock-first prototype` · `External AI: Off` · `Backend tests: 145 passing` · `Frontend build: passing locally`

---

## Summary

SentinelIQ is an AI-native SOC (Security Operations Center) **investigation workspace**. Instead of treating security work as a series of disconnected queries or chatbot replies, it keeps everything an analyst does — alerts triaged, queries run, entities pivoted, evidence linked, findings pinned, notes written, reports generated — inside **persistent investigation memory** that the AI can then reason over.

It is built mock-first: the full workflow, UI, query planning, evidence graph, and AI-orchestration contracts are implemented and deterministic, so the *product architecture* can be perfected before wiring in real SIEM connectors and real AI model providers.

---

## The problem

SOC analysts don't just need answers — they need **investigation continuity**. In a real shift an analyst juggles multiple SIEM tabs, ad-hoc queries, screenshots, and notes. Context is constantly lost between tools, between alerts, and between shift handoffs. Most "AI for security" tools bolt a stateless chatbot onto that mess.

SentinelIQ's thesis:

> The core object in a SOC tool should not be a chat session or a dashboard widget. It should be **the investigation**.

Every workflow is designed to strengthen the investigation: what happened, who/what was affected, what evidence supports the conclusion, what's already been checked, what still needs checking, and what was handed off.

---

## What SentinelIQ is

- An AI-native SOC **investigation layer** that sits *above* existing SIEMs
- A **memory-first** analyst workspace (turns, artifacts, query results, entities, evidence, notes, pinned findings, reports)
- A **manual + AI hybrid** environment — the analyst is never trapped inside the AI flow
- A **vendor-agnostic** query layer (one neutral QueryPlan → Sentinel KQL / Splunk SPL / Elastic ES\|QL)
- A **privacy-aware** orchestration design (context minimization + redaction before any external model call)

## What SentinelIQ is not

- ❌ Not a generic SIEM dashboard
- ❌ Not a Microsoft Sentinel clone
- ❌ Not "just a KQL chatbot"
- ❌ Not a full SIEM replacement (no ingestion/indexing/retention/RBAC at scale)
- ❌ Not a stateless chat interface

---

## Current status — honest disclosure

**SentinelIQ is currently a mock-first prototype.** The workflows, UI, query planning, evidence graph, and orchestration patterns are implemented, but real SIEM connectors and real AI model providers are future work.

Specifically, right now SentinelIQ:

- ✅ Uses **deterministic mock SOC data** (a realistic `jsmith@corp.com` account-compromise scenario + a 190-alert generated dataset)
- 🚫 Does **not** use real customer or production security data
- 🚫 Does **not** call Claude / OpenAI / any external AI API (mock provider only)
- 🚫 Does **not** connect to Microsoft Sentinel, Splunk, or Elastic (adapters render query *syntax* only)

The current value is the **workflow architecture**: investigation memory, the evidence graph, vendor-agnostic query planning, and the mock AI-orchestration contracts (Context Used + Execution Trace + redaction). Provider swapping is designed in from day one — see [Architecture](#architecture).

---

## Key features

| Area | Feature |
|------|---------|
| **Workspace** | Scratch-first landing · active-case context lens · per-case workspace memory (page, tab, Logs editor, Alerts filters/selection/detail, Evidence selection, Reports context, Hunts selection) |
| **Logs / Query** | Manual KQL console · natural-language → query planning · recent/saved queries · deterministic mock results · entity extraction |
| **Vendor-agnostic query** | Neutral `QueryPlan` (15 intents) · Sentinel (KQL) / Splunk (SPL) / Elastic (ES\|QL) renderers · QueryPlan validation · Plan inspector |
| **Alerts** | Unified mock alert operations · in-page triage workspace · TP/FP scoring · lifecycle (investigating / FP / close / suppress / reopen / undo) · recommended next actions · case linking · append-only audit trail |
| **Evidence** | Investigation evidence graph · entity + relationship provenance (source table, artifact, row count, platform, intent) · entity timeline · manual evidence actions (note, mark reviewed, open in Logs) |
| **Investigation memory** | Turns, artifacts, query results, notes, pinned findings, entities, generated reports — all per case |
| **AI orchestration (mock)** | Context Used panel · Execution Trace · privacy/redaction policies · explicit Save-as-Note / Pin-as-Finding (never auto-save) |
| **Reporting** | Executive / technical / handoff / regulatory report variants · context-bound generation ("Using: {case}") |
| **Data** | Deterministic mock SOC data layer (fixtures + generated alerts) |

---

## Screenshots

Screenshots live in [`docs/assets/`](docs/assets/README.md). Suggested set for portfolio sharing:

| View | Path |
|------|------|
| SOC overview / scratch landing | `docs/assets/overview.png` |
| Alerts + in-page triage | `docs/assets/alerts-triage.png` |
| Logs query console | `docs/assets/logs-query-console.png` |
| QueryPlan + Sentinel/Splunk/Elastic adapters | `docs/assets/queryplan-adapters.png` |
| Investigation evidence workspace | `docs/assets/evidence-workspace.png` |
| Reports / handoff | `docs/assets/reports-handoff.png` |
| Context Used + Execution Trace | `docs/assets/context-used-trace.png` |

> ⚠️ **Add screenshots here before public portfolio sharing.** The image files are not committed yet.

---

## Demo Flow

A ~3-minute walkthrough that shows the core thesis end-to-end (all mock, no credits):

1. Start in **Scratch Mode** (default landing — no active case).
2. In the command bar, run **`show me all the users`**.
3. Open the **QueryPlan inspector** on the result to see the neutral plan (intent, entities, source, validation).
4. Switch the generated query between **Microsoft Sentinel (KQL)**, **Splunk (SPL)**, and **Elastic (ES\|QL)** — same plan, three syntaxes.
5. Go to **Alerts**.
6. Click an alert to open **alert detail**.
7. Run **in-page triage** (Triage visible / selected / all-open).
8. Review the **recommended next actions** and **lifecycle status** (current → recommended).
9. **Link the alert to a case**.
10. Open the case's **Investigation → Evidence**.
11. Explore **entity relationships and provenance** (select an entity, e.g. `DESKTOP-42`).
12. Run **"Summarize evidence for …"** from the command bar.
13. Generate a **handoff or report** from the case context.
14. Expand **Context Used** and **Execution Trace** to see exactly what context the AI used and the step-by-step orchestration.

---

## Architecture

### Flow

```
Analyst intent (command bar / page action)
   → Command router (classify: query / action / refine)
   → QueryPlan (neutral)  ─or─  AI action (mock handler)
   → SIEM adapter (KQL / SPL / ES|QL)  ─or─  mock action engine
   → Normalized result (users, hosts, IPs, processes, countries, findings, relationships)
   → Investigation memory (turns, artifacts, query results, notes, findings)
   → Evidence graph / timeline / reports / handoff
```

### Layers

| Layer | Implementation |
|-------|----------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind + Zustand |
| Backend | FastAPI (Python) · SSE streaming for AI actions · SQLite session store |
| Mock SOC data | Deterministic fixtures + generated 190-alert dataset |
| QueryPlan / adapters | Neutral `QueryPlan` → Sentinel / Splunk / Elastic renderers + validation |
| Alert store | Alert data, filters, selection, lifecycle, audit trail (Zustand) |
| Investigation store | Per-case turns, artifacts, notes, findings, entities, reports |
| Workspace memory | Per-workspace UI continuity (localStorage), scratch-first, `LocalWorkspaceMemoryProvider` |
| Evidence graph | Frontend derivation of nodes/relationships/gaps from investigation memory |
| AI orchestration | `MockModelProvider` + context builder + redaction + Context Used / Execution Trace |
| Future providers | `RealSIEMProvider`, `AnthropicLLMProvider`, `FutureDatabaseWorkspaceMemoryProvider` (stubs / boundaries) |

The mock ↔ real swap is a config boundary: `MOCK_LLM=true` (default) → `MockLLMProvider` + fixtures; `MOCK_LLM=false` → `AnthropicLLMProvider` + `RealSIEMProvider` (the latter currently raises `NotImplementedError` — Phase 2 target).

---

## How SentinelIQ sits on top of SIEMs

> **The SIEM stores and searches the data. SentinelIQ remembers and drives the investigation.**

- The SIEM remains the **system of record** for logs and detections.
- SentinelIQ is an **investigation workspace above** the SIEM.
- Analyst intent is converted into a **neutral QueryPlan**.
- The QueryPlan renders to **KQL, SPL, or Elastic-style** syntax.
- Results are **normalized** into users, hosts, IPs, processes, countries, findings, notes, and relationships.
- **Investigation memory is vendor-neutral** — it doesn't care which SIEM produced the evidence.
- A future real **connector layer can replace the mock data layer** without changing the workspace/UX.

---

## How it differs from Microsoft Sentinel / Security Copilot

Microsoft Security Copilot is a production enterprise assistant deeply integrated with Microsoft security products. SentinelIQ is a **portfolio / research prototype** exploring a **vendor-agnostic, memory-first SOC investigation layer**. Its focus is investigation continuity, evidence provenance, manual analyst control, privacy-aware orchestration, and cross-SIEM query planning.

**SentinelIQ is not a replacement for Microsoft Sentinel.** It is designed as a future investigation layer that could sit **above** Sentinel, Splunk, Elastic, and other tools.

| | Microsoft Sentinel / Security Copilot | SentinelIQ (this project) |
|---|---|---|
| Maturity | Production, enterprise | Portfolio / research prototype |
| Ecosystem | Microsoft-centric | Vendor-agnostic by design |
| Core object | Incidents + assistant | The **investigation** (memory-first) |
| Query | KQL-native | Neutral QueryPlan → KQL / SPL / ES\|QL |
| AI | Live models | Deterministic mock (real provider is a boundary) |
| Data | Real telemetry | Deterministic mock only |

---

## Tech stack

- **Frontend:** React 18, TypeScript, Vite 6, Tailwind CSS, Zustand
- **Backend:** FastAPI, Uvicorn, Pydantic v2, SSE (sse-starlette), SQLite (aiosqlite)
- **AI (interface):** Anthropic SDK wired behind a provider abstraction (off by default; mock provider active)
- **Testing:** pytest (backend, 145 tests), `tsc` + Vite production build (frontend)

---

## Run locally

### Prerequisites
- **Node.js** 18+ and **npm**
- **Python** 3.11+
- **Git**

### 1. Backend (FastAPI)

```powershell
cd apps/api
python -m venv .venv
.\.venv\Scripts\activate        # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### 2. Frontend (Vite + React)

```powershell
cd apps/web
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api` → `http://localhost:8000`, so no extra config is needed locally.

### Validate

```powershell
cd apps/web && npm run build      # tsc + vite build, zero TS errors
cd apps/api && python -m pytest   # 145 passing
```

---

## Mock mode

Set `MOCK_LLM=true` (the default) in `.env`. In mock mode:

- All LLM responses are deterministic keyword/intent-based mocks — **no network calls, no API credits**.
- All security data comes from `apps/api/data/fixtures/` and the frontend mock SOC data layer.
- The full UI and every capability work identically to how the real-provider path is intended to.
- No Anthropic API key is required (any value in `.env` is ignored while mocking).

To later enable the real Anthropic path: set `MOCK_LLM=false` and provide a valid `ANTHROPIC_API_KEY`. (Real SIEM execution still requires implementing `RealSIEMProvider` — Phase 2.)

See [DEPLOYMENT.md](DEPLOYMENT.md) for hosting a mock demo and [SECURITY.md](SECURITY.md) for handling secrets.

---

## Roadmap

**Near term**
- v1.2 persistence / local-database foundation
- Backend-backed investigation storage
- Durable alert lifecycle and audit trail
- Deployment polish

**Medium term**
- Real SIEM connector abstraction
- Microsoft Sentinel connector · Splunk connector · Elastic connector
- Local / hybrid AI provider interface
- Privacy-aware Claude integration

**Long term**
- Multi-case persistence
- Team / user roles
- Report export
- Detection-engineering workflows
- Production deployment hardening

---

## Current limitations

- Mock-first prototype — **no real SIEM ingestion yet**
- **No real external AI calls yet** (mock provider only)
- No production auth / RBAC
- Local/browser state still used in places (investigation & alert data reset on refresh; workspace memory persists to localStorage)
- Deployment configuration is still basic
- **Not intended for production SOC use yet**

---

## Security notes

- Never commit `.env` or API keys — `.gitignore` excludes them; use `.env.example` for placeholders.
- Demo mode uses **mock data only** — do **not** upload real SOC logs into the demo.
- External AI calls are currently **off**; future real-model integration must use the privacy/redaction and least-context principles already scaffolded.

Full policy: [SECURITY.md](SECURITY.md).

---

## Portfolio / Interview talking points

- **Why I built it:** SOC analysts lose investigation context across tools and shifts; I wanted to design the *memory layer* and *workflow*, not another chatbot.
- **What I learned:** how to model investigation state, keep an AI assistant explainable (Context Used + Execution Trace), and design a vendor-neutral query abstraction.
- **Product thinking:** a clear thesis ("investigation continuity"), an explicit "what it is / isn't", and a disciplined mock-first plan that de-risks real integration.
- **SOC workflow understanding:** alert triage lifecycle, evidence provenance, entity pivots, handoff briefings, noisy-rule coaching — modeled on how analysts actually work.
- **Frontend/backend architecture:** typed React + Zustand stores, a FastAPI backend with SSE streaming, and provider abstractions that make mock ↔ real a config swap.
- **AI safety / context design:** privacy policies + redaction before any external call, minimum-context assembly per task, and explicit (never automatic) save-to-case.

---

## Status & license

Portfolio / demo project — **mock-first prototype, not for production use**. No open-source license is granted yet; if you'd like to use or reference it, please open an issue. See [CHECKPOINT.md](CHECKPOINT.md) for the full version history and architecture notes.
