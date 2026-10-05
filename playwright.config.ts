/**
 * E2E em browser real, um modo por vez (NEXT_PUBLIC_* é inlinado no build):
 *   npm run test:e2e   → build+testa "direct", depois build+testa "gtm"
 * Os scripts externos (fbevents.js, gtag.js, gtm.js) são interceptados: nada
 * sai para a Meta/Google, e as chamadas ficam na fila do fbq/dataLayer para inspeção.
 */
import { defineConfig, devices } from '@playwright/test'

const mode = process.env.E2E_MODE === 'gtm' ? 'gtm' : 'direct'
const PORT = 3100

export const E2E_ENV: Record<string, string> = {
  VERCEL_ENV: 'preview',
  NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
  NEXT_PUBLIC_TRACKING_MODE: mode,
  NEXT_PUBLIC_META_PIXEL_ID: '123456789012345',
  NEXT_PUBLIC_GA4_MEASUREMENT_ID: 'G-ABCDE12345',
  NEXT_PUBLIC_GA4_LEAD_SOURCE: 'browser',
  NEXT_PUBLIC_GOOGLE_ADS_ID: 'AW-123456789',
  NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL: 'AbCdEfGhIjK12',
  NEXT_PUBLIC_CONSENT_MODE: 'off',
  NEXT_PUBLIC_SERVER_PAGEVIEW: 'true',
  CRM_PROVIDER: 'none',
  ...(mode === 'gtm' ? { NEXT_PUBLIC_GTM_ID: 'GTM-ABC1234' } : {}),
}

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  grep: new RegExp(`@${mode}\\b`),
  // PW_CHANNEL=chrome usa o Google Chrome instalado (sem baixar o Chromium do Playwright).
  use: { baseURL: `http://localhost:${PORT}`, ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL || undefined },
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: E2E_ENV,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
