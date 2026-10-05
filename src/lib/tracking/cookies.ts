/** Nomes e validade dos cookies first-party usados pelo tracking. */

export const COOKIES = {
  // Meta (mesmo nome que o pixel usa — o servidor só completa quando falta)
  fbp: '_fbp',
  fbc: '_fbc',
  // Google (escritos pelo gtag/GTM; lidos aqui)
  ga: '_ga',
  gclAw: '_gcl_aw',
  // Nossos
  gclid: 'trk_gclid',
  gbraid: 'trk_gbraid',
  wbraid: 'trk_wbraid',
  firstTouch: 'trk_ft',
  lastTouch: 'trk_lt',
  visitorId: 'trk_vid',
  consent: 'trk_consent',
} as const

const DAY = 60 * 60 * 24

export const MAX_AGE = {
  clickId: 90 * DAY,
  touch: 90 * DAY,
  visitor: 365 * DAY,
  consent: 180 * DAY,
} as const

/** Cookie do GA4 que guarda a sessão: `_ga_<id sem "G-">`. */
export function gaSessionCookieName(measurementId: string): string {
  return `_ga_${measurementId.replace(/^G-/, '')}`
}

export type ConsentValue = 'granted' | 'denied'
