# Security Policy

SentinelIQ is a **mock-first prototype** for portfolio / demo use. It is **not** intended for production SOC use and has no production auth, RBAC, or hardening.

## Secrets & configuration

- **Never commit `.env`** — it is excluded by `.gitignore`. Use `.env.example` files (placeholders only).
- **Never commit API keys** or any credential. `ANTHROPIC_API_KEY` stays in your local/host env and is **ignored while `MOCK_LLM=true`**.
- If a secret is ever committed by accident, rotate it immediately and scrub history.

## Demo data handling

- Demo mode uses **deterministic mock data only** (synthetic `jsmith@corp.com` scenario + generated alerts). No real PII.
- **Do not upload real SOC logs, alerts, or customer/security data** into the demo.
- Any public deployment must be treated as **public and demo-only** (no auth) — never point it at real telemetry.

## AI / model calls

- **External AI calls are currently OFF.** The active provider is a deterministic `MockModelProvider`; no data leaves the environment.
- Future real-model integration (Claude / local / hybrid) **must** use the principles already scaffolded:
  - **Privacy / redaction** before any external call (`redact_sensitive` policy redacts emails, IPs, hostnames, hashes, encoded commands).
  - **Least-context**: assemble the minimum investigation context required per task, not the whole case.
  - **Explicit consent**: `allow_full_context` is opt-in and reserved for future real-API mode.

## SIEM connectors

- No real SIEM connector is implemented. `RealSIEMProvider` raises `NotImplementedError` — real Sentinel / Splunk / Elastic execution is future work and must add its own credential handling and least-privilege access.

## Reporting a concern

This is a personal portfolio project. If you spot a security issue or a committed secret, please open an issue (without including the secret value) so it can be addressed and rotated.
