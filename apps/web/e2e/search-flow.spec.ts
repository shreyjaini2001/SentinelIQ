/**
 * E2E tests for SentinelIQ search bar flow.
 *
 * Prerequisites: API on :8000 (MOCK_LLM=true), web dev server on :5173.
 * Run: npx playwright test
 */
import { test, expect, type Page } from '@playwright/test'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Type into the search bar and submit. */
async function search(page: Page, prompt: string) {
  const bar = page.getByRole('textbox', { name: 'AI Search Bar' })
  await bar.click()
  await bar.fill(prompt)
  await page.getByRole('button', { name: /Ask →/ }).click()
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  // Wait for session_id to be written into the input's data-session-id attribute.
  await page.waitForFunction(
    () => {
      const input = document.querySelector('[aria-label="AI Search Bar"]')
      return input instanceof HTMLElement && !!input.dataset.sessionId
    },
    { timeout: 10_000 },
  )
})

// ── Mode pill ─────────────────────────────────────────────────────────────────

test('shows Action mode pill for triage prompt', async ({ page }) => {
  const bar = page.getByRole('textbox', { name: 'AI Search Bar' })
  await bar.fill('Triage my open alerts')
  // Wait for debounced classify to respond
  await page.waitForFunction(
    () => document.querySelector('[data-testid="mode-pill"]')?.textContent?.toLowerCase().includes('action'),
    { timeout: 5_000 },
  )
  await expect(page.locator('[data-testid="mode-pill"]')).toContainText(/action/i)
})

test('shows Query mode pill for log search prompt', async ({ page }) => {
  const bar = page.getByRole('textbox', { name: 'AI Search Bar' })
  await bar.fill('Show me failed logins last 6 hours')
  await page.waitForFunction(
    () => document.querySelector('[data-testid="mode-pill"]')?.textContent?.toLowerCase().includes('query'),
    { timeout: 5_000 },
  )
  await expect(page.locator('[data-testid="mode-pill"]')).toContainText(/query/i)
})

// ── Query flow ────────────────────────────────────────────────────────────────

test('query prompt shows QueryPreviewCard with KQL', async ({ page }) => {
  await search(page, 'Show me failed logins last 6 hours')
  // QueryPreviewCard should appear (it lives in SearchBar's below-bar area)
  await page.waitForSelector('[data-testid="query-preview-card"]', { timeout: 15_000 })
  const card = page.locator('[data-testid="query-preview-card"]')
  await expect(card).toBeVisible()
  // Should contain KQL table name
  const kqlText = await card.textContent()
  expect(kqlText).toMatch(/SigninLogs|SecurityEvent/)
})

test('query prompt does NOT show an action panel', async ({ page }) => {
  await search(page, 'Show me failed logins last 6 hours')
  await page.waitForSelector('[data-testid="query-preview-card"]', { timeout: 15_000 })
  // None of the dedicated action panels should be visible
  await expect(page.locator('[data-testid="alert-triage-panel"]')).not.toBeVisible()
  await expect(page.locator('[data-testid="hunt-result-panel"]')).not.toBeVisible()
})

// ── Action flows ──────────────────────────────────────────────────────────────

test('triage prompt renders AlertTriagePanel — not KQL card', async ({ page }) => {
  await search(page, 'Triage my alerts')
  await page.waitForSelector('[data-testid="alert-triage-panel"]', { timeout: 20_000 })
  await expect(page.locator('[data-testid="alert-triage-panel"]')).toBeVisible()
  // QueryPreviewCard must NOT appear
  await expect(page.locator('[data-testid="query-preview-card"]')).not.toBeVisible()
})

test('hunt prompt renders HuntResultPanel — not KQL card', async ({ page }) => {
  await search(page, 'Hunt for LAPSUS$ TTPs')
  await page.waitForSelector('[data-testid="hunt-result-panel"]', { timeout: 20_000 })
  await expect(page.locator('[data-testid="hunt-result-panel"]')).toBeVisible()
  await expect(page.locator('[data-testid="query-preview-card"]')).not.toBeVisible()
})

test('timeline prompt renders TimelinePanel — not KQL card', async ({ page }) => {
  await search(page, 'Build a timeline for jsmith@corp.com')
  await page.waitForSelector('[data-testid="timeline-panel"]', { timeout: 20_000 })
  await expect(page.locator('[data-testid="timeline-panel"]')).toBeVisible()
  await expect(page.locator('[data-testid="query-preview-card"]')).not.toBeVisible()
})

test('blast radius prompt renders BlastRadiusPanel', async ({ page }) => {
  await search(page, 'Map the blast radius for jsmith@corp.com')
  await page.waitForSelector('[data-testid="blast-radius-panel"]', { timeout: 20_000 })
  await expect(page.locator('[data-testid="blast-radius-panel"]')).toBeVisible()
})

test('comparative prompt renders ComparativeAnalysisPanel', async ({ page }) => {
  await search(page, "Compare jsmith's behavior today against their 90-day baseline")
  await page.waitForSelector('[data-testid="comparative-panel"]', { timeout: 20_000 })
  await expect(page.locator('[data-testid="comparative-panel"]')).toBeVisible()
})

test('documentation prompt renders DocumentationPanel', async ({ page }) => {
  await search(page, 'Generate an executive summary for this investigation')
  await page.waitForSelector('[data-testid="documentation-panel"]', { timeout: 20_000 })
  await expect(page.locator('[data-testid="documentation-panel"]')).toBeVisible()
})

test('rule suggestion prompt renders RuleSuggestionPanel', async ({ page }) => {
  await search(page, 'Create a detection rule from this pattern')
  await page.waitForSelector('[data-testid="rule-suggestion-panel"]', { timeout: 20_000 })
  await expect(page.locator('[data-testid="rule-suggestion-panel"]')).toBeVisible()
})

// ── Sequential prompts ────────────────────────────────────────────────────────

test('second prompt replaces first result cleanly', async ({ page }) => {
  // First: query
  await search(page, 'Show me failed logins last 6 hours')
  await page.waitForSelector('[data-testid="query-preview-card"]', { timeout: 15_000 })

  // Second: action (should replace query card with action panel)
  await search(page, 'Triage my alerts')
  await page.waitForSelector('[data-testid="alert-triage-panel"]', { timeout: 20_000 })
  await expect(page.locator('[data-testid="alert-triage-panel"]')).toBeVisible()
  // Old query card must be gone
  await expect(page.locator('[data-testid="query-preview-card"]')).not.toBeVisible()
})

test('action then query clears action panel', async ({ page }) => {
  // First: action
  await search(page, 'Triage my alerts')
  await page.waitForSelector('[data-testid="alert-triage-panel"]', { timeout: 20_000 })

  // Second: query — action panel should disappear
  await search(page, 'Show me failed logins last 6 hours')
  await page.waitForSelector('[data-testid="query-preview-card"]', { timeout: 15_000 })
  await expect(page.locator('[data-testid="query-preview-card"]')).toBeVisible()
  await expect(page.locator('[data-testid="alert-triage-panel"]')).not.toBeVisible()
})

test('submit button re-enables after action completes', async ({ page }) => {
  await search(page, 'Triage my alerts')
  await page.waitForSelector('[data-testid="alert-triage-panel"]', { timeout: 20_000 })
  // Button must be re-enabled so a second prompt can be typed
  const btn = page.getByRole('button', { name: /Ask →/ })
  await expect(btn).not.toBeDisabled({ timeout: 5_000 })
})

// ── Welcome screen buttons ────────────────────────────────────────────────────

test('welcome screen Triage button renders AlertTriagePanel', async ({ page }) => {
  // Click the quick-launch button on the welcome screen
  await page.getByRole('button', { name: /Triage my open alerts/i }).click()
  await page.waitForSelector('[data-testid="alert-triage-panel"]', { timeout: 20_000 })
  await expect(page.locator('[data-testid="alert-triage-panel"]')).toBeVisible()
})
