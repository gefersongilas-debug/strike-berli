/**
 * O que o site da Strike acrescenta ao template: clique em "Reservar" como evento
 * próprio, conversões do Google Ads por evento, linker e link de saída com origem.
 */
import { describe, expect, it, vi, type Mock } from 'vitest'
import { parsePublicConfig, validateTrackingConfig } from '@/lib/config'
import type { Attribution } from '@/lib/tracking/attribution'
import { fireBrowserEvent, type TrackingWindow } from '@/lib/tracking/client'
import { EVENTS } from '@/lib/tracking/events'
import { decorateOutboundUrl, fbclidFromFbc, UTM_FRESH_MS } from '@/lib/tracking/outbound'
import { buildInitScript } from '@/lib/tracking/snippets'
import { fullEnv } from './helpers'

type Fn = (...args: unknown[]) => void

function win(): TrackingWindow & { fbq: Mock<Fn>; gtag: Mock<Fn>; dataLayer: unknown[] } {
  return {
    fbq: vi.fn<Fn>(),
    gtag: vi.fn<Fn>(),
    dataLayer: [],
    location: { href: 'https://www.strikeberlin.com.br/' },
    document: { cookie: '' },
  }
}

const labels = {
  NEXT_PUBLIC_GOOGLE_ADS_RESERVATION_LABEL: 'ReservaLabel01',
  NEXT_PUBLIC_GOOGLE_ADS_CONTACT_LABEL: 'ContatoLabel01',
}

describe('reservation_click', () => {
  it('é evento personalizado na Meta (não colide com o InitiateCheckout do Eleven Tickets)', () => {
    const w = win()
    fireBrowserEvent('reservation_click', 'evt-reserva-1', parsePublicConfig(fullEnv()), w, { params: { button: 'hero' } })
    expect(w.fbq).toHaveBeenCalledWith('trackCustom', 'ReservationClick', { button: 'hero' }, { eventID: 'evt-reserva-1' })
    expect(EVENTS.reservation_click.meta).not.toBe('InitiateCheckout')
    expect(EVENTS.reservation_click.publicServer).toBe(true)
  })

  it('com rótulo, vira conversão do Google Ads com o event_id como transaction_id', () => {
    const w = win()
    fireBrowserEvent('reservation_click', 'evt-reserva-2', parsePublicConfig(fullEnv(labels)), w)
    expect(w.gtag).toHaveBeenCalledWith('event', 'conversion', {
      send_to: 'AW-123456789/ReservaLabel01',
      transaction_id: 'evt-reserva-2',
    })
  })

  it('sem rótulo, nenhuma conversão do Google Ads sai no clique', () => {
    const w = win()
    fireBrowserEvent('reservation_click', 'evt-reserva-3', parsePublicConfig(fullEnv()), w)
    expect(w.gtag.mock.calls.some((c) => c[1] === 'conversion')).toBe(false)
  })

  it('contato usa o próprio rótulo; lead continua com o dele', () => {
    const cfg = parsePublicConfig(fullEnv(labels))
    const w = win()
    fireBrowserEvent('contact', 'evt-contato-1', cfg, w, { params: { method: 'whatsapp' } })
    fireBrowserEvent('lead', 'evt-lead-1', cfg, w)
    const sendTo = w.gtag.mock.calls.filter((c) => c[1] === 'conversion').map((c) => (c[2] as { send_to: string }).send_to)
    expect(sendTo).toEqual(['AW-123456789/ContatoLabel01', 'AW-123456789/AbCdEfGhIjK12'])
  })
})

describe('config', () => {
  it('rótulo repetido entre eventos quebra o build', () => {
    const r = validateTrackingConfig(fullEnv({ NEXT_PUBLIC_GOOGLE_ADS_RESERVATION_LABEL: 'AbCdEfGhIjK12' }))
    expect(r.errors.join(' ')).toMatch(/mesmo rótulo/)
  })

  it('rótulo sem NEXT_PUBLIC_GOOGLE_ADS_ID quebra o build', () => {
    const r = validateTrackingConfig(fullEnv({ ...labels, NEXT_PUBLIC_GOOGLE_ADS_ID: '', NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL: '' }))
    expect(r.errors.join(' ')).toMatch(/NEXT_PUBLIC_GOOGLE_ADS_RESERVATION_LABEL definido sem/)
  })

  it('linker: aceita domínio puro, recusa URL', () => {
    expect(validateTrackingConfig(fullEnv({ NEXT_PUBLIC_LINKER_DOMAINS: 'eleventickets.com' })).errors).toEqual([])
    const bad = validateTrackingConfig(fullEnv({ NEXT_PUBLIC_LINKER_DOMAINS: 'https://eleventickets.com/' }))
    expect(bad.errors.join(' ')).toMatch(/LINKER_DOMAINS/)
  })

  it('linker entra no gtag antes do config', () => {
    const s = buildInitScript(parsePublicConfig(fullEnv({ NEXT_PUBLIC_LINKER_DOMAINS: 'eleventickets.com' })))
    expect(s).toContain(`gtag('set','linker',{domains:["eleventickets.com"]})`)
    expect(s.indexOf('linker')).toBeLessThan(s.indexOf(`gtag('config'`))
  })
})

describe('Clarity', () => {
  it('só carrega com id, e só no modo direct', () => {
    expect(buildInitScript(parsePublicConfig(fullEnv()))).not.toContain('clarity.ms')
    const withClarity = fullEnv({ NEXT_PUBLIC_CLARITY_ID: 'abcde12345' })
    const s = buildInitScript(parsePublicConfig(withClarity))
    expect(s).toContain(`'clarity','script',"abcde12345"`)
    expect(s).not.toContain('consentv2')
    expect(() => new Function(s)).not.toThrow()
    const viaGtm = parsePublicConfig({ ...withClarity, NEXT_PUBLIC_TRACKING_MODE: 'gtm', NEXT_PUBLIC_GTM_ID: 'GTM-ABC1234' })
    expect(buildInitScript(viaGtm)).not.toContain('clarity.ms')
  })

  it('com banner de cookies, recebe o consentimento antes de gravar', () => {
    const s = buildInitScript(parsePublicConfig(fullEnv({ NEXT_PUBLIC_CLARITY_ID: 'abcde12345', NEXT_PUBLIC_CONSENT_MODE: 'banner' })))
    expect(s).toContain(`clarity('consentv2',{ad_Storage:trkG,analytics_Storage:trkG})`)
  })

  it('id fora do formato quebra o build', () => {
    expect(validateTrackingConfig(fullEnv({ NEXT_PUBLIC_CLARITY_ID: 'https://clarity.ms/x' })).errors.join(' ')).toMatch(/CLARITY_ID/)
  })
})

describe('link de saída para o Eleven Tickets', () => {
  const now = 1_790_000_000_000
  const base = 'https://eleventickets.com/strike-berlin/strike-berlin'
  const attribution: Attribution = {
    gclid: 'Cj0_gclid',
    fbc: `fb.1.${now - 1000}.IwAR_fbclid`,
    lastTouch: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'search-et', ts: now - 60_000 },
  }

  it('leva UTMs recentes e click ids', () => {
    const u = new URL(decorateOutboundUrl(base, attribution, { now, adsAllowed: true }))
    expect(u.searchParams.get('utm_source')).toBe('google')
    expect(u.searchParams.get('utm_campaign')).toBe('search-et')
    expect(u.searchParams.get('gclid')).toBe('Cj0_gclid')
    expect(u.searchParams.get('fbclid')).toBe('IwAR_fbclid')
    expect(u.origin + u.pathname).toBe(base)
  })

  it('UTM de toque antigo não vai (visita de hoje pode ser orgânica)', () => {
    const old = { ...attribution, lastTouch: { ...attribution.lastTouch!, ts: now - UTM_FRESH_MS - 1 } }
    const u = new URL(decorateOutboundUrl(base, old, { now, adsAllowed: true }))
    expect(u.searchParams.has('utm_source')).toBe(false)
    expect(u.searchParams.get('gclid')).toBe('Cj0_gclid')
  })

  it('sem consentimento de anúncio, nenhum click id sai', () => {
    const u = new URL(decorateOutboundUrl(base, attribution, { now, adsAllowed: false }))
    expect(u.searchParams.has('gclid')).toBe(false)
    expect(u.searchParams.has('fbclid')).toBe(false)
    expect(u.searchParams.get('utm_source')).toBe('google')
  })

  it('não sobrescreve parâmetro que o link já tem', () => {
    const u = new URL(decorateOutboundUrl(`${base}?utm_source=site`, attribution, { now, adsAllowed: true }))
    expect(u.searchParams.get('utm_source')).toBe('site')
  })

  it('sem atribuição, o link fica igual', () => {
    expect(decorateOutboundUrl(base, {}, { now, adsAllowed: true })).toBe(base)
  })

  it('fbclid sai do _fbc; _fbc inválido não vira fbclid', () => {
    expect(fbclidFromFbc('fb.1.1700000000000.abc')).toBe('abc')
    expect(fbclidFromFbc('lixo')).toBeUndefined()
  })
})
