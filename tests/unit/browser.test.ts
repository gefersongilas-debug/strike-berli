/**
 * O que roda no browser: scripts por modo e disparos com o mesmo event_id.
 */
import { describe, expect, it, vi, type Mock } from 'vitest'
import { parsePublicConfig } from '@/lib/config'
import { applyConsent, fireBrowserEvent, trackEventWith, type TrackingWindow } from '@/lib/tracking/client'
import { EVENT_KEYS, EVENTS } from '@/lib/tracking/events'
import { buildInitScript, gtmNoscriptSrc } from '@/lib/tracking/snippets'
import { fullEnv } from './helpers'

const direct = parsePublicConfig(fullEnv())
const gtm = parsePublicConfig(fullEnv({ NEXT_PUBLIC_TRACKING_MODE: 'gtm', NEXT_PUBLIC_GTM_ID: 'GTM-ABC1234' }))

type Fn = (...args: unknown[]) => void

function fakeWindow(): TrackingWindow & { fbq: Mock<Fn>; gtag: Mock<Fn>; dataLayer: unknown[]; beacons: unknown[] } {
  const beacons: unknown[] = []
  return {
    fbq: vi.fn<Fn>(),
    gtag: vi.fn<Fn>(),
    dataLayer: [],
    beacons,
    location: { href: 'https://www.cliente.com.br/lp' },
    document: { cookie: '' },
    navigator: {
      sendBeacon: (url: string, data: Blob) => {
        beacons.push({ url, data })
        return true
      },
    },
  }
}

describe('catálogo de eventos', () => {
  it('todo evento tem nome para Meta e dataLayer, e nomes são únicos', () => {
    const metas = EVENT_KEYS.map((k) => EVENTS[k].meta)
    const layers = EVENT_KEYS.map((k) => EVENTS[k].dataLayer)
    expect(new Set(metas).size).toBe(metas.length)
    expect(new Set(layers).size).toBe(layers.length)
    for (const k of EVENT_KEYS) expect(EVENTS[k].dataLayer).toMatch(/^trk_/)
  })

  it('lead não pode entrar pelo endpoint público /api/track', () => {
    expect(EVENTS.lead.publicServer).toBe(false)
  })
})

describe('script de inicialização', () => {
  it('modo direct: carrega pixel e gtag, NÃO carrega GTM', () => {
    const s = buildInitScript(direct)
    expect(s).toContain('fbevents.js')
    expect(s).toContain(`fbq('init',"123456789012345")`)
    expect(s).toContain('gtag/js?id=')
    expect(s).toContain(`gtag('config',"G-ABCDE12345")`)
    expect(s).toContain(`gtag('config',"AW-123456789"`)
    expect(s).not.toContain('gtm.js')
    expect(gtmNoscriptSrc(direct)).toBeNull()
  })

  it('modo direct: pixel NÃO dispara PageView sozinho (o tracker dispara com eventID)', () => {
    const s = buildInitScript(direct)
    expect(s).not.toMatch(/fbq\('track'/)
    expect(s).toContain('fbq.disablePushState=true')
  })

  it('modo gtm: carrega só o GTM — nada de pixel/gtag direto (evita duplicidade)', () => {
    const s = buildInitScript(gtm)
    expect(s).toContain('gtm.js?id=')
    expect(s).toContain('"GTM-ABC1234"')
    expect(s).not.toContain('fbevents.js')
    expect(s).not.toContain('gtag/js')
    expect(gtmNoscriptSrc(gtm)).toBe('https://www.googletagmanager.com/ns.html?id=GTM-ABC1234')
  })

  it('consent banner: default denied antes de qualquer tag', () => {
    const cfg = parsePublicConfig(fullEnv({ NEXT_PUBLIC_CONSENT_MODE: 'banner' }))
    const s = buildInitScript(cfg)
    const consentAt = s.indexOf(`gtag('consent','default'`)
    expect(consentAt).toBeGreaterThan(-1)
    expect(consentAt).toBeLessThan(s.indexOf('fbevents.js'))
    expect(s).toContain(`fbq('consent','revoke')`)
  })

  it('consent off: nenhum comando de consentimento', () => {
    expect(buildInitScript(direct)).not.toContain('consent')
  })

  it('script é JavaScript válido nos dois modos', () => {
    for (const cfg of [direct, gtm, parsePublicConfig(fullEnv({ NEXT_PUBLIC_CONSENT_MODE: 'banner' }))]) {
      expect(() => new Function(buildInitScript(cfg))).not.toThrow()
    }
  })
})

describe('disparo no browser — modo direct', () => {
  it('lead: pixel e Google Ads recebem o MESMO event_id', () => {
    const w = fakeWindow()
    fireBrowserEvent('lead', 'evt-abc12345', direct, w, { user: { email: 'A@B.com', phone: '(11) 99999-8888' } })
    expect(w.fbq).toHaveBeenCalledWith('track', 'Lead', { currency: 'BRL' }, { eventID: 'evt-abc12345' })
    expect(w.gtag).toHaveBeenCalledWith('set', 'user_data', { email: 'a@b.com', phone_number: '+5511999998888' })
    expect(w.gtag).toHaveBeenCalledWith(
      'event',
      'conversion',
      expect.objectContaining({ send_to: 'AW-123456789/AbCdEfGhIjK12', transaction_id: 'evt-abc12345' }),
    )
  })

  it('lead com GA4 via servidor: browser NÃO manda generate_lead (evita duplicar)', () => {
    const w = fakeWindow()
    fireBrowserEvent('lead', 'evt-abc12345', direct, w)
    expect(w.gtag.mock.calls.some((c) => c[1] === 'generate_lead')).toBe(false)
  })

  it('lead com GA4 via browser: manda generate_lead', () => {
    const w = fakeWindow()
    const cfg = parsePublicConfig(fullEnv({ NEXT_PUBLIC_GA4_LEAD_SOURCE: 'browser' }))
    fireBrowserEvent('lead', 'evt-abc12345', cfg, w)
    expect(w.gtag).toHaveBeenCalledWith('event', 'generate_lead', expect.objectContaining({ event_id: 'evt-abc12345', send_to: 'G-ABCDE12345' }))
  })

  it('modo direct nunca empurra evento trk_* no dataLayer', () => {
    const w = fakeWindow()
    fireBrowserEvent('contact', 'evt-abc12345', direct, w)
    expect(w.dataLayer).toEqual([])
  })

  it('trackEvent manda browser e servidor com o mesmo id', async () => {
    const w = fakeWindow()
    const id = trackEventWith('contact', direct, w, { method: 'whatsapp' })
    expect(w.fbq).toHaveBeenCalledWith('track', 'Contact', { method: 'whatsapp' }, { eventID: id })
    expect(w.beacons).toHaveLength(1)
    const beacon = w.beacons[0] as { url: string; data: Blob }
    expect(beacon.url).toBe('/api/track')
    expect(JSON.parse(await beacon.data.text())).toEqual({
      event: 'contact',
      eventId: id,
      pageUrl: 'https://www.cliente.com.br/lp',
      custom: { method: 'whatsapp' },
    })
  })

  it('page_view sem NEXT_PUBLIC_SERVER_PAGEVIEW não chama o servidor', () => {
    const w = fakeWindow()
    trackEventWith('page_view', parsePublicConfig(fullEnv({ NEXT_PUBLIC_SERVER_PAGEVIEW: 'false' })), w)
    expect(w.fbq).toHaveBeenCalledOnce()
    expect(w.beacons).toHaveLength(0)
  })
})

describe('disparo no browser — modo gtm', () => {
  it('empurra evento trk_* com event_id e NÃO chama fbq/gtag', () => {
    const w = fakeWindow()
    fireBrowserEvent('lead', 'evt-abc12345', gtm, w, { user: { email: 'a@b.com' } })
    expect(w.fbq).not.toHaveBeenCalled()
    expect(w.gtag).not.toHaveBeenCalled()
    expect(w.dataLayer).toEqual([
      expect.objectContaining({
        event: 'trk_lead',
        event_id: 'evt-abc12345',
        meta_event_name: 'Lead',
        ga4_event_name: 'generate_lead',
        ga4_send_from_browser: false,
        user_data: { email: 'a@b.com' },
      }),
    ])
  })

  it('page_view vira trk_page_view com event_id', () => {
    const w = fakeWindow()
    const id = trackEventWith('page_view', gtm, w)
    expect(w.dataLayer[0]).toMatchObject({ event: 'trk_page_view', event_id: id, meta_event_name: 'PageView' })
  })
})

describe('consentimento', () => {
  it('aceitar grava cookie e atualiza Consent Mode, pixel e dataLayer', () => {
    const w = fakeWindow()
    applyConsent('granted', w)
    expect(w.document.cookie).toMatch(/^trk_consent=granted;/)
    expect(w.gtag).toHaveBeenCalledWith('consent', 'update', expect.objectContaining({ ad_storage: 'granted', ad_user_data: 'granted' }))
    expect(w.fbq).toHaveBeenCalledWith('consent', 'grant')
    expect(w.dataLayer).toContainEqual({ event: 'trk_consent_update', trk_consent: 'granted' })
  })

  it('recusar revoga no pixel', () => {
    const w = fakeWindow()
    applyConsent('denied', w)
    expect(w.fbq).toHaveBeenCalledWith('consent', 'revoke')
  })
})
