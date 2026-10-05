import { vi } from 'vitest'
import { parseServerConfig, type Env } from '@/lib/config'
import type { ServerEvent } from '@/lib/server/types'

/** Env de produção completa e válida — cada teste quebra uma coisa por vez. */
export function fullEnv(overrides: Env = {}): Env {
  return {
    VERCEL_ENV: 'production',
    NEXT_PUBLIC_SITE_URL: 'https://www.cliente.com.br',
    NEXT_PUBLIC_TRACKING_MODE: 'direct',
    NEXT_PUBLIC_META_PIXEL_ID: '123456789012345',
    META_CAPI_ACCESS_TOKEN: 'EAAtesttoken',
    NEXT_PUBLIC_GA4_MEASUREMENT_ID: 'G-ABCDE12345',
    GA4_API_SECRET: 'ga4secret',
    NEXT_PUBLIC_GA4_LEAD_SOURCE: 'server',
    NEXT_PUBLIC_GOOGLE_ADS_ID: 'AW-123456789',
    NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL: 'AbCdEfGhIjK12',
    NEXT_PUBLIC_CONSENT_MODE: 'off',
    CRM_PROVIDER: 'webhook',
    CRM_WEBHOOK_URL: 'https://n8n.example.com/webhook/lead',
    CRM_WEBHOOK_SECRET: 'whsecret',
    ...overrides,
  }
}

export const GADS_ENV: Env = {
  GOOGLE_ADS_DEVELOPER_TOKEN: 'devtoken',
  GOOGLE_ADS_CLIENT_ID: 'client.apps.googleusercontent.com',
  GOOGLE_ADS_CLIENT_SECRET: 'clientsecret',
  GOOGLE_ADS_REFRESH_TOKEN: '1//refreshtoken',
  GOOGLE_ADS_CUSTOMER_ID: '1234567890',
  GOOGLE_ADS_LOGIN_CUSTOMER_ID: '9876543210',
  GOOGLE_ADS_CONVERSION_ACTION_ID: '987654321',
}

export function serverCfg(overrides: Env = {}) {
  return parseServerConfig(fullEnv(overrides))
}

export function leadEvent(overrides: Partial<ServerEvent> = {}): ServerEvent {
  return {
    key: 'lead',
    eventId: 'evt-12345678',
    eventTime: 1_790_000_000,
    user: { email: '  Maria.Silva@Example.COM ', phone: '(11) 99999-8888', name: 'Maria  da Silva' },
    attribution: {
      fbp: 'fb.1.1790000000000.1234567890',
      fbc: 'fb.1.1790000000000.IwAR123',
      gclid: 'Cj0KCQtest',
      gaClientId: '111.222',
      gaSessionId: '1790000000',
      visitorId: 'vid-1',
      lastTouch: { utm_source: 'facebook', utm_medium: 'cpc', utm_campaign: 'camp', ts: 1 },
    },
    context: { ip: '200.1.2.3', userAgent: 'Mozilla/5.0', sourceUrl: 'https://www.cliente.com.br/' },
    consentGranted: true,
    ...overrides,
  }
}

export interface Call {
  url: string
  init?: RequestInit
  body: unknown
}

/** fetch falso: responde por URL e grava as chamadas. */
export function mockFetch(routes: Array<[RegExp, () => Response]> = []) {
  const calls: Call[] = []
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    let body: unknown = init?.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {
        /* form-encoded */
      }
    }
    calls.push({ url, init, body })
    const route = routes.find(([re]) => re.test(url))
    return route ? route[1]() : new Response('{}', { status: 200 })
  })
  return { fetch: fn, calls }
}

export const ok = (json: unknown) => () => Response.json(json)
export const httpError = (status: number, text = 'erro') => () => new Response(text, { status })

export const DEFAULT_ROUTES: Array<[RegExp, () => Response]> = [
  [/graph\.facebook\.com/, ok({ events_received: 1 })],
  [/oauth2\.googleapis\.com/, ok({ access_token: 'ya29.test', expires_in: 3600 })],
  [/uploadClickConversions/, ok({ results: [{}] })],
  [/google-analytics\.com/, () => new Response(null, { status: 204 })],
]
