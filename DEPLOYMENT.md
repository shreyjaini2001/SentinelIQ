# SentinelIQ — Deployment (Mock Demo)

This guide covers deploying SentinelIQ as a **mock, credential-free demo** for portfolio / interview use.

> **Mode:** Mock only · **External AI:** Off · **Real SIEM credentials:** None
>
> Do not deploy with real security data, real SIEM connectors, or live AI keys. SentinelIQ is a mock-first prototype (see [SECURITY.md](SECURITY.md)).

---

## Topology

SentinelIQ is two apps:

- **Frontend** — a static Vite/React bundle (`apps/web`)
- **Backend** — a FastAPI service (`apps/api`) that the frontend calls at `/api/v1/*`

For a public demo, host them separately:

| Component | Recommended hosts |
|-----------|-------------------|
| Frontend (static) | Vercel · Netlify · Cloudflare Pages · any static host |
| Backend (Python) | Render · Railway · Fly.io · any Python/uvicorn host |

### Why not GitHub Pages alone?

GitHub Pages serves **static files only**. SentinelIQ currently expects a running **FastAPI backend** (classify / query / action / session / suggestions endpoints), so Pages alone is not ideal unless the app is first converted to a **frontend-only mock mode** (a future patch that would move the mock classify/query/action logic into the browser). Until then, deploy the backend somewhere that runs Python.

---

## Environment variables

### Frontend (`apps/web`) — build-time

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_BASE_URL` | Backend origin for the deployed frontend. **Unset locally** (uses the Vite proxy `/api`). Set in production to the backend URL; the app appends `/api/v1`. | `https://sentineliq-api.onrender.com` |

> Implemented in `apps/web/src/utils/apiBase.ts` (v1.1.7). Local dev needs no change — leaving `VITE_API_BASE_URL` unset falls back to `'/api/v1'` through the dev proxy.

### Backend (`apps/api`) — runtime

| Variable | Purpose | Example |
|----------|---------|---------|
| `MOCK_LLM` | Keep mock mode on. **Must be `true`** for a credential-free demo. | `true` |
| `APP_ENV` | Environment label. | `demo` |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins. Set to your deployed frontend URL. | `https://sentineliq.vercel.app` |
| `ANTHROPIC_API_KEY` | Ignored while `MOCK_LLM=true`. Leave blank for the demo. | *(blank)* |
| `SESSION_DB_PATH` | SQLite session file path. Use an ephemeral/writable path on the host. | `./sentineliq_sessions.db` |
| `SENTINELIQ_DB_PATH` | Local demo persistence SQLite file (investigation memory, alert lifecycle, workspace checkpoints). Use a writable path; `:memory:` for a fully ephemeral demo. | `apps/api/data/sentineliq_demo.db` |

> `CORS_ORIGINS` is read in `apps/api/config.py` and applied in `apps/api/main.py` (v1.1.7). Default (`http://localhost:5173,http://localhost:3000`) preserves local dev.

---

## Steps

### 1. Deploy the backend (e.g. Render)

- **Root directory:** `apps/api`
- **Build:** `pip install -r requirements.txt`
- **Start:** `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Env:** `MOCK_LLM=true`, `APP_ENV=demo`, `CORS_ORIGINS=https://<your-frontend-domain>`
- Confirm health at `https://<backend>/health` → `{"status":"ok"}`.

### 2. Deploy the frontend (e.g. Vercel)

- **Root directory:** `apps/web`
- **Build:** `npm run build`
- **Output directory:** `dist`
- **Env:** `VITE_API_BASE_URL=https://<your-backend-domain>`
- Redeploy after setting env vars (Vite inlines `VITE_*` at build time).

### 3. Verify

- Open the frontend URL; the command bar should respond (mock).
- Run the [Demo Flow](README.md#demo-flow).
- If requests fail with CORS errors, confirm `CORS_ORIGINS` on the backend matches the exact frontend origin (scheme + host, no trailing slash).

---

## Persistence on hosted demos

v1.2.0 adds a local SQLite demo persistence store (`SENTINELIQ_DB_PATH`). On hosts with an **ephemeral filesystem** (Render/Railway/Fly free tiers, most containers), the DB file is wiped when the container restarts or redeploys — so persisted demo state **may reset on restart**. That is expected for a demo.

- For persistence across restarts, attach a **persistent disk/volume** and point `SENTINELIQ_DB_PATH` at it.
- The persistence API is **unauthenticated** — never expose it with real data; treat the deployment as public demo-only.
- A **production** deployment should replace this single-file store with a real database + auth/RBAC (the `FutureDatabaseWorkspaceMemoryProvider` boundary).

## Notes & limitations

- Backend state (sessions, alert lifecycle, investigation memory) is **SQLite-backed but ephemeral** on most hosts — a host restart without a persistent volume resets it.
- No auth / RBAC — treat any deployment as **public and demo-only**.
- Keep `MOCK_LLM=true`. Turning it off requires a real `ANTHROPIC_API_KEY` and still won't execute real SIEM queries (`RealSIEMProvider` is a Phase 2 stub).
- **Connectors (v1.3.0) are mock/placeholder only.** The Data Sources page ships a working **mock connector** plus `not_configured` placeholders for Sentinel/Splunk/Elastic/Defender/CrowdStrike/Okta. No connector uses credentials or the network; ingestion runs are deterministic and metadata-only. Do **not** wire a hosted demo to real telemetry — real connectors require secrets management, auth/RBAC, and encryption (see [SECURITY.md](SECURITY.md)).
