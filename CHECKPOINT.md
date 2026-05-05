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
