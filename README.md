# SentinelIQ

AI-powered SIEM search bar and security analyst assistant.  
Converts plain-English security questions into KQL, triages alerts, runs threat hunts, and reconstructs attack timelines.

---

## Quick Start

You need **two terminals** — one for the API, one for the web app.

### Terminal 1 — API (FastAPI)

```powershell
cd apps/api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Terminal 2 — Web (Vite + React)

```powershell
cd apps/web
npm install      # first time only
npm run dev
```

| Service | URL |
|---------|-----|
| Web app | http://localhost:5173 |
| API | http://localhost:8000 |
| Swagger docs | http://localhost:8000/docs |

---

## Running in Mock Mode (no API credits required)

Set `MOCK_LLM=true` in the `.env` file at the project root:

```env
MOCK_LLM=true
```

In mock mode:
- All LLM responses are deterministic keyword-based mocks (no network calls)
- All security data is loaded from `apps/api/data/fixtures/` JSON files
- The full UI and all capabilities work identically to production
- No Anthropic API key is needed (the value in `.env` is ignored)

To switch back to the real Claude API, set `MOCK_LLM=false` and ensure your `ANTHROPIC_API_KEY` is valid.

---

## Running Tests

All tests run in-process against the FastAPI app with `MOCK_LLM=true`. No servers need to be running.

```powershell
cd apps/api
pip install pytest pytest-asyncio httpx   # one-time
pytest
```

To run a specific module:

```powershell
pytest tests/test_triage.py -v
pytest tests/test_action.py -v
```

**47 tests** covering:
- `test_classify.py` — intent classification (query / action / refine)
- `test_query.py` — NLQ pipeline, KQL generation, refinement mode
- `test_session.py` — session creation, persistence, share tokens
- `test_autocomplete.py` — autocomplete endpoint, recency scoring, crash resistance
- `test_suggestions.py` — chip suggestion engine
- `test_triage.py` — alert triage scoring, fixture data diversity
- `test_hunt.py` — threat hunt by actor and TTP, technique catalog
- `test_timeline.py` — timeline reconstruction, tactic classification, stages
- `test_action.py` — SSE action streaming for all handlers

---

## Running the Classifier Benchmark (Phase 0 Exit Gate)

Requires the API to be running (`uvicorn main:app --reload --port 8000`).

```powershell
python scripts/run_classifier_benchmark.py
```

Options:

```powershell
python scripts/run_classifier_benchmark.py --url http://localhost:8000 --out results.json
```

The benchmark runs all 200 labeled examples from `data/test_sets/intent_classifier_200.jsonl` and reports:
- Overall accuracy (pass threshold: ≥85%)
- Per-class accuracy for query / action / refine
- Full confusion matrix
- All failed cases with predicted vs expected mode

Exit code `0` = pass, `1` = below threshold.

---

## Enabling Anthropic API Mode

1. Get an Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
2. Edit `.env` at the project root:

```env
ANTHROPIC_API_KEY=sk-ant-...your-key...
MOCK_LLM=false
```

3. Restart the API server. That's it — no code changes required.

The API uses:
- `claude-haiku-4-5-20251001` for fast intent classification (<200ms target)
- `claude-sonnet-4-6` for NLQ pipeline and action capabilities

Prompt caching is enabled automatically on all system prompts (ephemeral cache). If the API key runs out of credits, the system automatically falls back to mock mode and logs a warning.

---

## Demo Prompts That Work

Try these in the search bar. The mode pill (Query / Action / Refine) updates in real time.

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
Triage my alerts and score for false positives → same, 10 fixture alerts
Hunt for LAPSUS$ TTPs                          → HuntResultPanel with ATT&CK heatmap
Hunt for credential dumping                    → targeted T1003/T1078/T1021
Hunt for Scattered Spider techniques           → social engineering TTP set
Show timeline for jsmith@corp.com              → TimelinePanel, 8 kill-chain events
Reconstruct attack chain for SERVER-DC01       → host-based timeline
Summarize this investigation                   → executive summary text
Create a detection rule for this query         → KQL rule with MITRE mapping
```

### Refine mode — context-aware narrowing

```
(after a query) Now filter to just finance users
(after a query) Only show successful logins
(after a query) Limit to the last 2 hours
(after a query) Add a country filter for RU only
```

### Welcome screen quick-launch buttons

Click any of the four example buttons on the welcome screen to instantly submit:
- **Failed logins last 24h**
- **Triage my open alerts**
- **Hunt for LAPSUS$ TTPs**
- **Timeline for jsmith@corp.com**

---

## Architecture

```
apps/
├── api/                      Python FastAPI backend
│   ├── src/
│   │   ├── providers/        Provider abstraction layer
│   │   │   ├── llm/          LLMProvider (Anthropic / Mock)
│   │   │   └── data/         DataProvider (Fixture / RealSIEM placeholder)
│   │   ├── components/       Core logic (classifier, NLQ engine, session manager)
│   │   ├── capabilities/     Triage, ThreatHunt, Timeline
│   │   ├── handlers/         SSE action handlers (triage, hunt, timeline, summarize, rule)
│   │   ├── routers/          FastAPI route definitions
│   │   ├── storage/          SQLite session and query persistence
│   │   ├── models/           Pydantic schemas
│   │   └── llm/              LLM client, mock client, PII scrubber, prompts
│   ├── data/fixtures/        Realistic security demo data (JSON)
│   └── tests/                pytest suite (47 tests)
│
└── web/                      React 18 + TypeScript + Vite frontend
    └── src/
        ├── components/
        │   ├── SearchBar/    AI search bar + all sub-components
        │   └── panels/       AlertTriagePanel, HuntResultPanel, TimelinePanel
        ├── hooks/            useSearchBar, useSession, useAutocomplete
        ├── stores/           Zustand session store
        ├── api/              Fetch client + SSE reader
        └── types/            Shared TypeScript interfaces
```

### Provider Swap (Mock → Production)

The only config change needed to go live:

```
MOCK_LLM=false          → AnthropicLLMProvider + RealSIEMProvider
MOCK_LLM=true (default) → MockLLMProvider + FixtureDataProvider
```

`RealSIEMProvider` raises `NotImplementedError` on all methods — it is the Phase 2 integration target for Azure Sentinel / KQL execution.

---

## Fixture Data

Located at `apps/api/data/fixtures/`:

| File | Contents |
|------|----------|
| `alerts.json` | 10 realistic security alerts (geo anomaly, credential dump, lateral movement, etc.) |
| `auth_events.json` | 10 authentication events (SigninLogs + SecurityEvent) |
| `endpoint_events.json` | 8 process events (PowerShell, LSASS dump, schtasks, net.exe) |
| `network_events.json` | 6 network events (SMB lateral, exfiltration, C2 beacon) |
| `users.json` | 5 user profiles with risk scores, groups, MFA status |
| `hosts.json` | 5 host records with criticality, patch level, EDR status |
| `incidents.json` | 3 linked incidents (active, investigating, closed/FP) |
| `detection_rules.json` | 5 KQL detection rules with false positive rates |
| `attack_techniques.json` | 13 ATT&CK techniques with query templates and actor mappings |
| `baselines.json` | Historical averages for auth, network, process, and user behavior |
| `iam_graph.json` | Groups, roles, service principals, privileged access paths |
| `past_investigations.json` | 2 completed investigation records with KQL queries used |

All fixture data is based on the `jsmith@corp.com` account compromise scenario — a realistic attack chain from initial geo-anomaly login through credential dumping and data exfiltration.
