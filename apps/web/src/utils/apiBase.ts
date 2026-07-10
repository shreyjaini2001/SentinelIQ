/**
 * Resolve the API base URL (v1.1.7).
 *
 * - **Local dev** (default): `VITE_API_BASE_URL` unset → `'/api/v1'`, served through the
 *   Vite dev proxy (`vite.config.ts`) to the FastAPI backend on `localhost:8000`.
 * - **Deployed demo**: set `VITE_API_BASE_URL` to the backend origin
 *   (e.g. `https://sentineliq-api.onrender.com`) at build time; the `/api/v1` prefix is
 *   appended automatically, so the frontend can live on a static host and the backend
 *   elsewhere.
 *
 * Keeping this in one place means the fetch client never hard-codes an origin.
 */
const RAW = import.meta.env.VITE_API_BASE_URL?.trim()

export const API_BASE = RAW ? `${RAW.replace(/\/+$/, '')}/api/v1` : '/api/v1'
