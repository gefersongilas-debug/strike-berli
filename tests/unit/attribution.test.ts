import { describe, expect, it } from 'vitest'
import {
  buildFbc,
  cookieReaderFromHeader,
  isValidFbc,
  isValidFbp,
  parseGaClientId,
  parseGaSessionId,
  parseGclAw,
  readAttribution,
  touchFromUrl,
} from '@/lib/tracking/attribution'
import { captureTrackingCookies, type CookieToSet } from '@/lib/tracking/capture'
import { normalizePhoneBR, splitName } from '@/lib/tracking/normalize'

const NOW = 1_790_000_000_000

function capture(url: string, cookies: Record<string, string> = {}, consentMode: 'off' | 'banner' = 'off', referrer?: string) {
  return captureTrackingCookies({
    url: new URL(url),
    referrer,
    get: (n) => cookies[n],
    cfg: { consentMode },
    now: NOW,
    random: () => 0.123456789,
    uuid: () => 'uuid-1',
  })
}
const byName = (list: CookieToSet[]) => Object.fromEntries(list.map((c) => [c.name, c.value]))

describe('parsers de cookie', () => {
  it('_ga → client_id', () => {
    expect(parseGaClientId('GA1.1.123456789.1700000000')).toBe('123456789.1700000000')
    expect(parseGaClientId('lixo')).toBeUndefined()
  })

  it('_ga_<id> → session_id (formatos GS1 e GS2)', () => {
    expect(parseGaSessionId('GS1.1.1700000000.3.1.1700000100.0.0.0')).toBe('1700000000')
    expect(parseGaSessionId('GS2.1.s1700000000$o3$g1$t1700000100$j0$l0$h0')).toBe('1700000000')
  })

  it('_gcl_aw → gclid', () => {
    expect(parseGclAw('GCL.1700000000.Cj0KCQabc')).toBe('Cj0KCQabc')
  })

  it('fbc/fbp validados no formato da Meta', () => {
    expect(buildFbc('IwAR1', NOW)).toBe(`fb.1.${NOW}.IwAR1`)
    expect(isValidFbc(`fb.1.${NOW}.IwAR1`)).toBe(true)
    expect(isValidFbc('IwAR1')).toBe(false)
    expect(isValidFbp('fb.1.1700000000000.123')).toBe(true)
    expect(isValidFbp('fb.1.abc.123')).toBe(false)
  })

  it('readAttribution junta tudo e usa _gcl_aw quando falta trk_gclid', () => {
    const get = cookieReaderFromHeader(
      `_ga=GA1.1.111.222; _ga_ABCDE12345=GS2.1.s1790000000$o1; _gcl_aw=GCL.1.Cj0gclaw; _fbp=fb.1.1790000000000.99; trk_lt=${encodeURIComponent(
        JSON.stringify({ utm_source: 'google', ts: 1 }),
      )}`,
    )
    const a = readAttribution(get, 'G-ABCDE12345')
    expect(a.gaClientId).toBe('111.222')
    expect(a.gaSessionId).toBe('1790000000')
    expect(a.gclid).toBe('Cj0gclaw')
    expect(a.fbp).toBe('fb.1.1790000000000.99')
    expect(a.lastTouch?.utm_source).toBe('google')
  })

  it('cookie _fbc malformado é descartado (a Meta rejeitaria)', () => {
    const a = readAttribution(cookieReaderFromHeader('_fbc=IwAR-cru'))
    expect(a.fbc).toBeUndefined()
  })
})

describe('touchFromUrl', () => {
  it('captura UTMs e landing page sem querystring', () => {
    const t = touchFromUrl(new URL('https://site.com/lp?utm_source=fb&utm_campaign=x&foo=1'), 'https://instagram.com/', NOW)!
    expect(t).toMatchObject({ utm_source: 'fb', utm_campaign: 'x', landing_page: 'https://site.com/lp', referrer: 'https://instagram.com/' })
  })

  it('sem UTM nem click id → null', () => {
    expect(touchFromUrl(new URL('https://site.com/?foo=1'), undefined, NOW)).toBeNull()
  })

  it('referrer do próprio site é ignorado', () => {
    const t = touchFromUrl(new URL('https://site.com/?utm_source=x'), 'https://site.com/outra', NOW)!
    expect(t.referrer).toBeUndefined()
  })
})

describe('captura no proxy', () => {
  it('fbclid vira _fbc; gclid vira trk_gclid; cria _fbp e visitor id', () => {
    const c = byName(capture('https://site.com/?fbclid=IwAR9&gclid=Cj0x&utm_source=meta'))
    expect(c._fbc).toBe(`fb.1.${NOW}.IwAR9`)
    expect(c.trk_gclid).toBe('Cj0x')
    expect(c._fbp).toMatch(/^fb\.1\.\d+\.\d+$/)
    expect(c.trk_vid).toBe('uuid-1')
    expect(JSON.parse(c.trk_lt).utm_source).toBe('meta')
    expect(JSON.parse(c.trk_ft).utm_source).toBe('meta')
  })

  it('mesmo fbclid não reescreve o _fbc (mantém o timestamp do clique)', () => {
    const c = byName(capture('https://site.com/?fbclid=IwAR9', { _fbc: 'fb.1.1700000000000.IwAR9' }))
    expect(c._fbc).toBeUndefined()
  })

  it('fbclid novo substitui o _fbc antigo', () => {
    const c = byName(capture('https://site.com/?fbclid=NOVO', { _fbc: 'fb.1.1700000000000.VELHO' }))
    expect(c._fbc).toBe(`fb.1.${NOW}.NOVO`)
  })

  it('primeiro toque não é sobrescrito; último toque é', () => {
    const c = byName(capture('https://site.com/?utm_source=google', { trk_ft: '{"utm_source":"meta","ts":1}' }))
    expect(c.trk_ft).toBeUndefined()
    expect(JSON.parse(c.trk_lt).utm_source).toBe('google')
  })

  it('visita orgânica registra só o primeiro toque com referrer', () => {
    const c = byName(capture('https://site.com/', {}, 'off', 'https://www.google.com/'))
    expect(JSON.parse(c.trk_ft).referrer).toBe('https://www.google.com/')
    expect(c.trk_lt).toBeUndefined()
  })

  it('não recria _fbp válido existente', () => {
    const c = byName(capture('https://site.com/', { _fbp: 'fb.1.1700000000000.555', trk_vid: 'x', trk_ft: '{"ts":1}' }))
    expect(c).toEqual({})
  })

  it('banner sem aceite: só UTM, nenhum cookie de anúncio', () => {
    const c = byName(capture('https://site.com/?fbclid=IwAR9&gclid=Cj0x&utm_source=meta', {}, 'banner'))
    expect(Object.keys(c).sort()).toEqual(['trk_ft', 'trk_lt'])
  })

  it('banner com aceite: grava cookies de anúncio', () => {
    const c = byName(capture('https://site.com/?fbclid=IwAR9', { trk_consent: 'granted' }, 'banner'))
    expect(c._fbc).toBeDefined()
  })
})

describe('normalização', () => {
  it.each([
    ['(11) 99999-8888', '5511999998888'],
    ['11 3333-4444', '551133334444'],
    ['+55 11 99999-8888', '5511999998888'],
    ['011 99999-8888', '5511999998888'],
    ['12345', undefined],
    ['', undefined],
  ])('telefone %s → %s', (input, expected) => {
    expect(normalizePhoneBR(input)).toBe(expected)
  })

  it('nome composto → primeiro e último', () => {
    expect(splitName('  João  Pedro da Silva ')).toEqual({ first: 'joão', last: 'silva' })
  })
})
