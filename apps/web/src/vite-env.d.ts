// Minimal typing for the Vite build-time env vars SentinelIQ reads.
// Self-contained (no dependency on vite/client resolution) so `tsc -b` never fails here.

interface ImportMetaEnv {
  /**
   * Backend origin for a deployed frontend, e.g. https://sentineliq-api.onrender.com.
   * Unset in local dev — the app falls back to the Vite proxy path ('/api/v1').
   */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
