export const MOCK_NOW = '2026-05-10T08:45:00Z'

export function mockTs(): string {
  return MOCK_NOW
}

export function mockFmtDate(iso?: string): string {
  return (iso ?? MOCK_NOW).replace('T', ' ').slice(0, 16)
}
