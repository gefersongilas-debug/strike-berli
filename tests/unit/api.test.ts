/**
 * Rotas /api/lead e /api/track de ponta a ponta (com fetch falso para as plataformas).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildRdStationPayload, signWebhookBody } from '@/lib/crm'
import { handleLead, handleTrack } from '@/lib/server/handlers'
import { resetGoogleTokenCache } from '@/lib/server/google-ads'
import { DEFAULT_ROUTES, GADS_ENV, httpError, mockFetch, serverCfg, type Call } from './helpers'

const SITE = 'https://www.cliente.com.br'
const NOW = 1_790_000_000_000

const COOKIE = [
  `_fbp=fb.1.1790000000000.1234567890`,
  `_fbc=fb.1.1790000000000.IwAR9`,
  `trk_gclid=Cj0KCQtest`,
  `_ga=GA1.1.111.222`,
  `trk_vid=vid-1`,
  `trk_lt=${encodeURIComponent(JSON.stringify({ utm_source: 'facebook', utm_medium: 'cpc', utm_campaign: 'bf', ts: 1 }))}`,
  `trk_ft=${encodeURIComponent(JSON.stringify({ utm_source: 'google', landing_page: `${SITE}/`, ts: 0 }))}`,
].join('; ')

function req(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${SITE}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: SITE,
      cookie: COOKIE,
      'user-agent': 'Mozilla/5.0 Teste',
      'x-forwarded-for': '200.1.2.3, 10.0.0.1',
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

const validLead = {
  name: 'Maria da Silva',
  email: 'Maria@Example.com',
  phone: '(11) 99999-8888',
  message: 'Quero orçamento',
  consent: true,
  eventId: 'evt-12345678',
  pageUrl: `${SITE}/lp?utm_source=facebook`,
}

async function runLead(body: unknown, env = {}, routes = DEFAULT_ROUTES, headers: Record<string, string> = {}) {
  const { fetch, calls } = mockFetch([...routes, [/n8n\.example\.com/, () => new Response('ok')]])
  const deferred: Array<() => Promise<unknown>> = []
  const res = await handleLead(req('/api/lead', body, headers), {
    cfg: serverCfg(env),
    fetch,
    defer: (t) => deferred.push(t),
    now: () => NOW,
  })
  for (const t of deferred) await t()
  return { res, json: await res.json(), calls, deferred }
}

const callTo = (calls: Call[], re: RegExp) => calls.find((c) => re.test(c.url))

beforeEach(() => {
  resetGoogleTokenCache()
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('POST /api/lead', () => {
  it('lead válido: CRM + Meta + GA4 + Google Ads, todos com o mesmo event_id', async () => {
    const { res, json, calls } = await runLead(validLead, GADS_ENV)
    expect(res.status).toBe(200)
    expect(json).toEqual({ ok: true, eventId: 'evt-12345678' })

    const crm = callTo(calls, /n8n/)!.body as Record<string, any>
    expect(crm.eventId).toBe('evt-12345678')
    expect(crm.email).toBe('maria@example.com')
    expect(crm.attribution).toMatchObject({
      utm_source: 'facebook',
      utm_campaign: 'bf',
      first_utm_source: 'google',
      gclid: 'Cj0KCQtest',
      fbc: 'fb.1.1790000000000.IwAR9',
    })

    const meta = callTo(calls, /graph\.facebook/)!.body as any
    expect(meta.data[0].event_id).toBe('evt-12345678')
    expect(meta.data[0].event_name).toBe('Lead')
    expect(meta.data[0].user_data.client_ip_address).toBe('200.1.2.3')
    expect(meta.data[0].user_data.fbc).toBe('fb.1.1790000000000.IwAR9')
    expect(meta.data[0].event_source_url).toBe(`${SITE}/lp?utm_source=facebook`)

    const ga4 = callTo(calls, /google-analytics/)!.body as any
    expect(ga4.events[0].params.event_id).toBe('evt-12345678')
    expect(ga4.client_id).toBe('111.222')

    const gads = callTo(calls, /uploadClickConversions/)!.body as any
    expect(gads.conversions[0].orderId).toBe('evt-12345678')
    expect(gads.conversions[0].gclid).toBe('Cj0KCQtest')
  })

  it('webhook é assinado com HMAC quando há secret', async () => {
    const { calls } = await runLead(validLead)
    const c = callTo(calls, /n8n/)!
    const sig = (c.init!.headers as Record<string, string>)['X-Signature']
    expect(sig).toBe(signWebhookBody(c.init!.body as string, 'whsecret'))
  })

  it('eventos de plataforma rodam depois da resposta (after)', async () => {
    const { deferred } = await runLead(validLead)
    expect(deferred).toHaveLength(1)
  })

  it('dados inválidos → 400 com erro por campo, nada é enviado', async () => {
    const { res, json, calls } = await runLead({ ...validLead, email: 'nao-e-email', phone: '123' })
    expect(res.status).toBe(400)
    expect(Object.keys(json.errors)).toEqual(expect.arrayContaining(['email', 'phone']))
    expect(calls).toHaveLength(0)
  })

  it('e-mail é opcional (o atendimento da Strike é pelo WhatsApp)', async () => {
    const { res, calls } = await runLead({ ...validLead, email: '' })
    expect(res.status).toBe(200)
    const crm = callTo(calls, /n8n/)!.body as Record<string, any>
    expect(crm.email).toBeUndefined()
    expect(crm.phone).toBe(validLead.phone)
  })

  it('perguntas extras (fields) chegam ao CRM; vazias são descartadas', async () => {
    const { calls } = await runLead({ ...validLead, fields: { entrada: 'R$ 70 a 100 mil', parcela: '', imovel: 'algarve' } })
    const crm = callTo(calls, /n8n/)!.body as Record<string, any>
    expect(crm.fields).toEqual({ entrada: 'R$ 70 a 100 mil', imovel: 'algarve' })
  })

  it('fields com chave fora do padrão → 400', async () => {
    const { res, json, calls } = await runLead({ ...validLead, fields: { 'Entrada Máx': 'x' } })
    expect(res.status).toBe(400)
    expect(json.errors.fields).toBeDefined()
    expect(calls).toHaveLength(0)
  })

  it('CRM_PROVIDER=kommo: negócio criado → conversões disparam', async () => {
    const env = { CRM_PROVIDER: 'kommo', KOMMO_SUBDOMAIN: 'minhaempresa', KOMMO_ACCESS_TOKEN: 'tok' }
    const routes: typeof DEFAULT_ROUTES = [[/kommo\.com\/api\/v4\/leads\/complex/, () => Response.json([{ id: 42 }])], ...DEFAULT_ROUTES]
    const { res, calls } = await runLead({ ...validLead, fields: { entrada: 'R$ 70 a 100 mil' } }, env, routes)
    expect(res.status).toBe(200)
    const note = callTo(calls, /leads\/notes/)!.body as any[]
    expect(note[0].params.text).toContain('- entrada: R$ 70 a 100 mil')
    expect(note[0].params.text).toContain('- utm_campaign: bf')
    expect(callTo(calls, /graph\.facebook/)).toBeDefined()
  })

  it('CRM_PROVIDER=kommo fora do ar → 502, sem conversão', async () => {
    const env = { CRM_PROVIDER: 'kommo', KOMMO_SUBDOMAIN: 'minhaempresa', KOMMO_ACCESS_TOKEN: 'tok' }
    const { res, deferred } = await runLead(validLead, env, [[/kommo\.com/, httpError(503)], ...DEFAULT_ROUTES])
    expect(res.status).toBe(502)
    expect(deferred).toHaveLength(0)
  })

  it('JSON quebrado → 400', async () => {
    const { res } = await runLead('{nao json')
    expect(res.status).toBe(400)
  })

  it('honeypot preenchido → finge sucesso, não envia nada', async () => {
    const { res, calls, deferred } = await runLead({ ...validLead, website: 'http://spam' })
    expect(res.status).toBe(200)
    expect(calls).toHaveLength(0)
    expect(deferred).toHaveLength(0)
  })

  it('CRM fora do ar → 502 e NÃO dispara conversão (a pessoa vai tentar de novo)', async () => {
    const { res, calls, deferred } = await runLead(validLead, {}, [[/n8n/, httpError(500)], ...DEFAULT_ROUTES])
    expect(res.status).toBe(502)
    expect(deferred).toHaveLength(0)
    expect(callTo(calls, /graph\.facebook/)).toBeUndefined()
  })

  it('Meta fora do ar não afeta a resposta do lead', async () => {
    const { res } = await runLead(validLead, {}, [[/graph\.facebook/, httpError(500)], ...DEFAULT_ROUTES])
    expect(res.status).toBe(200)
  })

  it('origem de outro domínio → 403', async () => {
    const { res } = await runLead(validLead, {}, DEFAULT_ROUTES, { origin: 'https://atacante.com' })
    expect(res.status).toBe(403)
  })

  it('pageUrl de outro domínio não vira event_source_url', async () => {
    const { calls } = await runLead({ ...validLead, pageUrl: 'https://outro.com/x' })
    const meta = callTo(calls, /graph\.facebook/)!.body as any
    expect(meta.data[0].event_source_url).toBe(SITE)
  })

  it('consent banner sem aceite: CRM recebe, plataformas de anúncio não', async () => {
    const { res, calls } = await runLead(validLead, { NEXT_PUBLIC_CONSENT_MODE: 'banner' })
    expect(res.status).toBe(200)
    expect(callTo(calls, /n8n/)).toBeDefined()
    expect(callTo(calls, /graph\.facebook/)).toBeUndefined()
  })

  it('CRM_PROVIDER=none: lead segue só para as plataformas', async () => {
    const { res, calls } = await runLead(validLead, { CRM_PROVIDER: 'none' })
    expect(res.status).toBe(200)
    expect(callTo(calls, /n8n/)).toBeUndefined()
    expect(callTo(calls, /graph\.facebook/)).toBeDefined()
  })
})

describe('POST /api/track', () => {
  async function runTrack(body: unknown, env = {}, headers: Record<string, string> = {}) {
    const { fetch, calls } = mockFetch(DEFAULT_ROUTES)
    const deferred: Array<() => Promise<unknown>> = []
    const res = await handleTrack(req('/api/track', body, headers), { cfg: serverCfg(env), fetch, defer: (t) => deferred.push(t), now: () => NOW })
    for (const t of deferred) await t()
    return { res, calls }
  }

  it('contact vai para a CAPI com o event_id do browser', async () => {
    const { res, calls } = await runTrack({ event: 'contact', eventId: 'evt-contact1', pageUrl: `${SITE}/`, custom: { method: 'whatsapp' } })
    expect(res.status).toBe(204)
    const meta = callTo(calls, /graph\.facebook/)!.body as any
    expect(meta.data[0]).toMatchObject({ event_name: 'Contact', event_id: 'evt-contact1', custom_data: { method: 'whatsapp' } })
    expect(callTo(calls, /uploadClickConversions|google-analytics/)).toBeUndefined()
  })

  it('lead pelo endpoint público é recusado (só entra via /api/lead)', async () => {
    const { res, calls } = await runTrack({ event: 'lead', eventId: 'evt-12345678', pageUrl: `${SITE}/` })
    expect(res.status).toBe(400)
    expect(calls).toHaveLength(0)
  })

  it('evento desconhecido é recusado', async () => {
    const { res } = await runTrack({ event: 'Purchase', eventId: 'evt-12345678', pageUrl: `${SITE}/` })
    expect(res.status).toBe(400)
  })

  it('pageUrl de outro domínio é recusada', async () => {
    const { res } = await runTrack({ event: 'page_view', eventId: 'evt-12345678', pageUrl: 'https://outro.com/' })
    expect(res.status).toBe(400)
  })

  it('www e sem www são o mesmo site', async () => {
    const { res } = await runTrack({ event: 'page_view', eventId: 'evt-12345678', pageUrl: 'https://cliente.com.br/' })
    expect(res.status).toBe(204)
  })

  it('page_view com server pageview desligado não chama a Meta', async () => {
    const { res, calls } = await runTrack({ event: 'page_view', eventId: 'evt-12345678', pageUrl: `${SITE}/` }, { NEXT_PUBLIC_SERVER_PAGEVIEW: 'false' })
    expect(res.status).toBe(204)
    expect(calls).toHaveLength(0)
  })

  it('custom com objeto aninhado é recusado', async () => {
    const { res } = await runTrack({ event: 'contact', eventId: 'evt-12345678', pageUrl: `${SITE}/`, custom: { a: { b: 1 } } })
    expect(res.status).toBe(400)
  })
})

describe('RD Station', () => {
  it('payload no formato da API de conversões', () => {
    const p = buildRdStationPayload(
      {
        eventId: 'e',
        createdAt: '',
        name: 'Maria',
        email: 'maria@example.com',
        phone: '(11) 99999-8888',
        pageUrl: SITE,
        consent: true,
        attribution: { utm_source: 'facebook', utm_medium: 'cpc', utm_campaign: 'bf', gclid: 'g' },
      },
      'site-lead',
    )
    expect(p).toMatchObject({
      event_type: 'CONVERSION',
      event_family: 'CDP',
      payload: {
        conversion_identifier: 'site-lead',
        email: 'maria@example.com',
        mobile_phone: '+5511999998888',
        traffic_source: 'facebook',
        traffic_medium: 'cpc',
        traffic_campaign: 'bf',
        legal_bases: [{ category: 'communications', type: 'consent', status: 'granted' }],
      },
    })
  })
})
