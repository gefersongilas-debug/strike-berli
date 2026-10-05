/**
 * Decide quais cookies first-party gravar numa navegação. Função pura, usada
 * pelo src/proxy.ts — cookie gravado pelo servidor dura mais que cookie de JS
 * no Safari (ITP), e funciona mesmo se o pixel for bloqueado.
 */
import type { PublicConfig } from '@/lib/config'
import { buildFbc, buildFbp, isValidFbp, organicTouch, touchFromUrl, type CookieReader } from './attribution'
import { COOKIES, MAX_AGE } from './cookies'

export interface CookieToSet {
  name: string
  value: string
  maxAge: number
}

export interface CaptureInput {
  url: URL
  referrer?: string
  get: CookieReader
  cfg: Pick<PublicConfig, 'consentMode'>
  now: number
  random: () => number
  uuid: () => string
}

export function captureTrackingCookies({ url, referrer, get, cfg, now, random, uuid }: CaptureInput): CookieToSet[] {
  const out: CookieToSet[] = []
  const adsAllowed = cfg.consentMode === 'off' || get(COOKIES.consent) === 'granted'

  // Toques de atribuição (só UTM/referrer — vão para o CRM)
  const touch = touchFromUrl(url, referrer, now)
  if (touch) {
    const value = JSON.stringify(touch)
    out.push({ name: COOKIES.lastTouch, value, maxAge: MAX_AGE.touch })
    if (!get(COOKIES.firstTouch)) out.push({ name: COOKIES.firstTouch, value, maxAge: MAX_AGE.touch })
  } else if (!get(COOKIES.firstTouch)) {
    out.push({ name: COOKIES.firstTouch, value: JSON.stringify(organicTouch(url, referrer, now)), maxAge: MAX_AGE.touch })
  }

  if (!adsAllowed) return out

  // Click ids
  for (const [param, cookie] of [
    ['gclid', COOKIES.gclid],
    ['gbraid', COOKIES.gbraid],
    ['wbraid', COOKIES.wbraid],
  ] as const) {
    const v = url.searchParams.get(param)?.trim()
    if (v) out.push({ name: cookie, value: v.slice(0, 500), maxAge: MAX_AGE.clickId })
  }

  const fbclid = url.searchParams.get('fbclid')?.trim()
  if (fbclid) {
    const current = get(COOKIES.fbc)
    // Só troca o _fbc se for um clique novo (manter o timestamp original do mesmo clique).
    if (!current?.endsWith(`.${fbclid}`)) out.push({ name: COOKIES.fbc, value: buildFbc(fbclid, now), maxAge: MAX_AGE.clickId })
  }

  if (!isValidFbp(get(COOKIES.fbp))) out.push({ name: COOKIES.fbp, value: buildFbp(now, random()), maxAge: MAX_AGE.clickId })

  if (!get(COOKIES.visitorId)) out.push({ name: COOKIES.visitorId, value: uuid(), maxAge: MAX_AGE.visitor })

  return out
}
