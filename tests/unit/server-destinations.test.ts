import { beforeEach, describe, expect, it } from 'vitest'
import { sha256 } from '@/lib/server/hash'
import { buildMetaPayload, sendMetaEvent } from '@/lib/server/meta-capi'
import { buildGa4Payload, sendGa4Event } from '@/lib/server/ga4-mp'
import {
  buildClickConversion,
  formatConversionDateTime,
  resetGoogleTokenCache,
  sendGoogleAdsConversion,
} from '@/lib/server/google-ads'
import { dispatchServerEvent } from '@/lib/server/dispatch'
import { DEFAULT_ROUTES, GADS_ENV, httpError, leadEvent, mockFetch, ok, serverCfg } from './helpers'

const HEX64 = /^[a-f0-9]{64}$/
const RAW_PII = ['maria', 'Maria', 'example.com', '99999', 'silva']

function expectNoRawPii(payload: unknown) {
  const text = JSON.stringify(payload)
  for (const pii of RAW_PII) expect(text, `dado pessoal cru "${pii}" no payload`).not.toContain(pii)
}

beforeEach(() => resetGoogleTokenCache())

describe('hash', () => {
  it('sha256 bate com o vetor conhecido', () => {
    expect(sha256('test@example.com')).toBe('973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b')
  })
})

describe('Meta CAPI', () => {
  const cfg = serverCfg().meta!

  it('payload tem event_id, action_source e nome padrão da Meta', () => {
    const p = buildMetaPayload(leadEvent(), cfg)
    const d = p.data[0]
    expect(d.event_name).toBe('Lead')
    expect(d.event_id).toBe('evt-12345678')
    expect(d.action_source).toBe('website')
    expect(d.event_source_url).toBe('https://www.cliente.com.br/')
    expect(d.event_time).toBe(1_790_000_000)
  })

  it('e-mail/telefone/nome são normalizados e hasheados — nada cru sai', () => {
    const p = buildMetaPayload(leadEvent(), cfg)
    const ud = p.data[0].user_data
    expect(ud.em).toEqual([sha256('maria.silva@example.com')])
    expect(ud.ph).toEqual([sha256('5511999998888')])
    expect(ud.fn).toEqual([sha256('maria')])
    expect(ud.ln).toEqual([sha256('silva')])
    expect(ud.country).toEqual([sha256('br')])
    for (const k of ['em', 'ph', 'fn', 'ln', 'external_id'] as const) expect(ud[k]![0]).toMatch(HEX64)
    expectNoRawPii({ ...p.data[0].user_data, client_user_agent: undefined, fbc: undefined, fbp: undefined })
  })

  it('fbc, fbp, IP e user agent vão sem hash (como a Meta pede)', () => {
    const ud = buildMetaPayload(leadEvent(), cfg).data[0].user_data
    expect(ud.fbc).toBe('fb.1.1790000000000.IwAR123')
    expect(ud.fbp).toBe('fb.1.1790000000000.1234567890')
    expect(ud.client_ip_address).toBe('200.1.2.3')
    expect(ud.client_user_agent).toBe('Mozilla/5.0')
  })

  it('test_event_code só aparece quando configurado', () => {
    expect(buildMetaPayload(leadEvent(), cfg).test_event_code).toBeUndefined()
    const withTest = serverCfg({ META_TEST_EVENT_CODE: 'TEST999', VERCEL_ENV: 'preview' }).meta!
    expect(buildMetaPayload(leadEvent(), withTest).test_event_code).toBe('TEST999')
  })

  it('envia para graph.facebook.com/<versão>/<pixel>/events', async () => {
    const { fetch, calls } = mockFetch(DEFAULT_ROUTES)
    const r = await sendMetaEvent(leadEvent(), cfg, fetch)
    expect(r.status).toBe('sent')
    expect(calls[0].url).toBe('https://graph.facebook.com/v26.0/123456789012345/events')
    expect((calls[0].body as { access_token: string }).access_token).toBe('EAAtesttoken')
  })

  it('erro da API vira "failed" com o motivo', async () => {
    const { fetch } = mockFetch([[/graph/, httpError(400, '{"error":{"message":"Invalid OAuth access token"}}')]])
    const r = await sendMetaEvent(leadEvent(), cfg, fetch)
    expect(r.status).toBe('failed')
    expect(r.detail).toMatch(/Invalid OAuth/)
  })

  it('events_received diferente de 1 é falha', async () => {
    const { fetch } = mockFetch([[/graph/, ok({ events_received: 0 })]])
    expect((await sendMetaEvent(leadEvent(), cfg, fetch)).status).toBe('failed')
  })

  it('sem consentimento não envia', async () => {
    const { fetch, calls } = mockFetch(DEFAULT_ROUTES)
    const r = await sendMetaEvent(leadEvent({ consentGranted: false }), cfg, fetch)
    expect(r.status).toBe('skipped')
    expect(calls).toHaveLength(0)
  })
})

describe('GA4 Measurement Protocol', () => {
  const cfg = serverCfg().ga4!

  it('usa o client_id e session_id dos cookies do GA', () => {
    const p = buildGa4Payload(leadEvent())!
    expect(p.client_id).toBe('111.222')
    expect(p.events[0].name).toBe('generate_lead')
    expect(p.events[0].params.session_id).toBe('1790000000')
    expect(p.events[0].params.event_id).toBe('evt-12345678')
    expect(p.events[0].params.currency).toBe('BRL')
    expect(p.timestamp_micros).toBe(1_790_000_000_000_000)
  })

  it('user_data vai hasheado com telefone em E.164', () => {
    const p = buildGa4Payload(leadEvent())!
    expect(p.user_data?.sha256_email_address).toEqual([sha256('maria.silva@example.com')])
    expect(p.user_data?.sha256_phone_number).toEqual([sha256('+5511999998888')])
    expectNoRawPii(p.user_data)
  })

  it('sem cookie _ga gera client_id sintético estável', () => {
    const ev = leadEvent({ attribution: {} })
    const a = buildGa4Payload(ev)!
    const b = buildGa4Payload(ev)!
    expect(a.client_id).toMatch(/^\d+\.\d+$/)
    expect(a.client_id).toBe(b.client_id)
  })

  it('page_view não vai pelo servidor (o gtag/GTM já coleta)', () => {
    expect(buildGa4Payload(leadEvent({ key: 'page_view' }))).toBeNull()
  })

  it('sem consentimento: consent DENIED e sem user_data', () => {
    const p = buildGa4Payload(leadEvent({ consentGranted: false }))!
    expect(p.consent).toEqual({ ad_user_data: 'DENIED', ad_personalization: 'DENIED' })
    expect(p.user_data).toBeUndefined()
  })

  it('envia com measurement_id e api_secret na URL', async () => {
    const { fetch, calls } = mockFetch(DEFAULT_ROUTES)
    expect((await sendGa4Event(leadEvent(), cfg, fetch)).status).toBe('sent')
    expect(calls[0].url).toBe('https://www.google-analytics.com/mp/collect?measurement_id=G-ABCDE12345&api_secret=ga4secret')
  })
})

describe('Google Ads API', () => {
  const cfg = serverCfg(GADS_ENV).googleAds!

  it('formata a data no padrão da API', () => {
    expect(formatConversionDateTime(1_790_000_000)).toBe('2026-09-21 14:13:20+00:00')
  })

  it('conversão usa gclid, orderId = event_id e identificadores hasheados', () => {
    const c = buildClickConversion(leadEvent(), cfg)!
    expect(c.conversionAction).toBe('customers/1234567890/conversionActions/987654321')
    expect(c.gclid).toBe('Cj0KCQtest')
    expect(c.orderId).toBe('evt-12345678')
    expect(c.userIdentifiers).toEqual([
      { hashedEmail: sha256('maria.silva@example.com') },
      { hashedPhoneNumber: sha256('+5511999998888') },
    ])
    expect(c.consent.adUserData).toBe('GRANTED')
  })

  it('manda só UM click id, e sem user identifiers quando é gbraid/wbraid', () => {
    const c = buildClickConversion(leadEvent({ attribution: { gbraid: 'gb1', wbraid: 'wb1' } }), cfg)!
    expect(c.gbraid).toBe('gb1')
    expect(c.wbraid).toBeUndefined()
    expect(c.gclid).toBeUndefined()
    expect(c.userIdentifiers).toBeUndefined()
  })

  it('sem click id e sem dados pessoais não envia', async () => {
    const ev = leadEvent({ attribution: {}, user: {} })
    expect(buildClickConversion(ev, cfg)).toBeNull()
    const { fetch, calls } = mockFetch(DEFAULT_ROUTES)
    expect((await sendGoogleAdsConversion(ev, cfg, fetch)).status).toBe('skipped')
    expect(calls).toHaveLength(0)
  })

  it('troca refresh token por access token e manda os headers certos', async () => {
    const { fetch, calls } = mockFetch(DEFAULT_ROUTES)
    const r = await sendGoogleAdsConversion(leadEvent(), cfg, fetch)
    expect(r.status).toBe('sent')
    expect(calls[0].url).toBe('https://oauth2.googleapis.com/token')
    const upload = calls[1]
    expect(upload.url).toBe('https://googleads.googleapis.com/v25/customers/1234567890:uploadClickConversions')
    const h = upload.init!.headers as Record<string, string>
    expect(h['developer-token']).toBe('devtoken')
    expect(h['login-customer-id']).toBe('9876543210')
    expect(h.Authorization).toBe('Bearer ya29.test')
    expect((upload.body as { partialFailure: boolean }).partialFailure).toBe(true)
  })

  it('partialFailureError com HTTP 200 é tratado como falha', async () => {
    const { fetch } = mockFetch([
      [/oauth2/, ok({ access_token: 't', expires_in: 3600 })],
      [/uploadClickConversions/, ok({ partialFailureError: { message: 'The click is too old' } })],
    ])
    const r = await sendGoogleAdsConversion(leadEvent(), cfg, fetch)
    expect(r.status).toBe('failed')
    expect(r.detail).toMatch(/too old/)
  })

  it('page_view nunca vira conversão', async () => {
    const { fetch, calls } = mockFetch(DEFAULT_ROUTES)
    expect((await sendGoogleAdsConversion(leadEvent({ key: 'page_view' }), cfg, fetch)).status).toBe('skipped')
    expect(calls).toHaveLength(0)
  })
})

describe('dispatch', () => {
  it('lead com tudo configurado sai para as 3 plataformas', async () => {
    const { fetch } = mockFetch(DEFAULT_ROUTES)
    const r = await dispatchServerEvent(leadEvent(), serverCfg(GADS_ENV), fetch)
    expect(r.meta.status).toBe('sent')
    expect(r.ga4.status).toBe('sent')
    expect(r.googleAds.status).toBe('sent')
  })

  it('uma plataforma falhando não impede as outras', async () => {
    const { fetch } = mockFetch([[/graph\.facebook/, httpError(500)], ...DEFAULT_ROUTES])
    const r = await dispatchServerEvent(leadEvent(), serverCfg(GADS_ENV), fetch)
    expect(r.meta.status).toBe('failed')
    expect(r.ga4.status).toBe('sent')
    expect(r.googleAds.status).toBe('sent')
  })

  it('exceção de rede vira "failed", não estoura', async () => {
    const { fetch } = mockFetch([[/graph\.facebook/, () => { throw new Error('ECONNRESET') }], ...DEFAULT_ROUTES])
    const r = await dispatchServerEvent(leadEvent(), serverCfg(), fetch)
    expect(r.meta).toEqual({ status: 'failed', detail: 'ECONNRESET' })
  })

  it('GA4 lead via browser → servidor não manda ao GA4 (evita duplicar)', async () => {
    const { fetch, calls } = mockFetch(DEFAULT_ROUTES)
    const r = await dispatchServerEvent(leadEvent(), serverCfg({ NEXT_PUBLIC_GA4_LEAD_SOURCE: 'browser' }), fetch)
    expect(r.ga4.status).toBe('skipped')
    expect(calls.some((c) => c.url.includes('google-analytics'))).toBe(false)
  })
})
