/**
 * Atribuição a partir de URL e cookies. Funções puras: rodam no proxy, nas rotas
 * de API e nos testes.
 */
import { COOKIES, gaSessionCookieName } from './cookies'

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
export type UtmKey = (typeof UTM_KEYS)[number]

export interface Touch {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  referrer?: string
  landing_page?: string
  /** epoch ms */
  ts: number
}

export interface Attribution {
  fbp?: string
  fbc?: string
  gclid?: string
  gbraid?: string
  wbraid?: string
  gaClientId?: string
  gaSessionId?: string
  visitorId?: string
  firstTouch?: Touch
  lastTouch?: Touch
}

export type CookieReader = (name: string) => string | undefined

const MAX_PARAM_LEN = 500

function param(url: URL, key: string): string | undefined {
  const v = url.searchParams.get(key)?.trim()
  return v ? v.slice(0, MAX_PARAM_LEN) : undefined
}

/**
 * Cria um "toque" de atribuição se a URL trouxer UTM ou click id. Referrer
 * externo sem UTM também conta (orgânico/referral), mas só para primeiro toque.
 */
export function touchFromUrl(url: URL, referrer: string | undefined, now: number): Touch | null {
  const utms: Partial<Record<UtmKey, string>> = {}
  for (const k of UTM_KEYS) {
    const v = param(url, k)
    if (v) utms[k] = v
  }
  const hasClick = ['gclid', 'gbraid', 'wbraid', 'fbclid'].some((k) => param(url, k))
  if (Object.keys(utms).length === 0 && !hasClick) return null

  return {
    ...utms,
    referrer: externalReferrer(referrer, url.host),
    landing_page: url.origin + url.pathname,
    ts: now,
  }
}

export function organicTouch(url: URL, referrer: string | undefined, now: number): Touch {
  return { referrer: externalReferrer(referrer, url.host), landing_page: url.origin + url.pathname, ts: now }
}

function externalReferrer(referrer: string | undefined, ownHost: string): string | undefined {
  if (!referrer) return undefined
  try {
    const r = new URL(referrer)
    return r.host === ownHost ? undefined : r.origin + r.pathname
  } catch {
    return undefined
  }
}

/** `_fbc` no formato da Meta: fb.1.<ms>.<fbclid> */
export function buildFbc(fbclid: string, now: number): string {
  return `fb.1.${now}.${fbclid}`
}

/** `_fbp` no formato da Meta: fb.1.<ms>.<aleatório> */
export function buildFbp(now: number, random: number): string {
  return `fb.1.${now}.${Math.floor(random * 1e10)}`
}

export function isValidFbc(v: string | undefined): boolean {
  return !!v && /^fb\.\d\.\d{10,13}\..+/.test(v)
}

export function isValidFbp(v: string | undefined): boolean {
  return !!v && /^fb\.\d\.\d{10,13}\.\d+$/.test(v)
}

/** `_ga` = GA1.1.<rand>.<ts>  →  client_id = <rand>.<ts> */
export function parseGaClientId(v: string | undefined): string | undefined {
  if (!v) return undefined
  const m = /^GA\d\.\d+\.(\d+\.\d+)$/.exec(v.trim())
  return m?.[1]
}

/**
 * `_ga_<ID>` guarda a sessão atual. Dois formatos em circulação:
 *   GS1.1.1700000000.3.1.1700000100.0.0.0
 *   GS2.1.s1700000000$o3$g1$t1700000100$j0$l0$h0
 */
export function parseGaSessionId(v: string | undefined): string | undefined {
  if (!v) return undefined
  const s = v.trim()
  const gs2 = /^GS2\.\d+\.s(\d+)/.exec(s)
  if (gs2) return gs2[1]
  const gs1 = /^GS1\.\d+\.(\d+)\./.exec(s)
  return gs1?.[1]
}

/** `_gcl_aw` = GCL.<ts>.<gclid> */
export function parseGclAw(v: string | undefined): string | undefined {
  if (!v) return undefined
  const m = /^GCL\.\d+\.(.+)$/.exec(v.trim())
  return m?.[1]
}

export function parseTouch(v: string | undefined): Touch | undefined {
  if (!v) return undefined
  try {
    const t = JSON.parse(v) as Touch
    return t && typeof t === 'object' && typeof t.ts === 'number' ? t : undefined
  } catch {
    return undefined
  }
}

export function readAttribution(get: CookieReader, ga4MeasurementId?: string): Attribution {
  const fbc = get(COOKIES.fbc)
  const fbp = get(COOKIES.fbp)
  return {
    fbc: isValidFbc(fbc) ? fbc : undefined,
    fbp: isValidFbp(fbp) ? fbp : undefined,
    gclid: get(COOKIES.gclid) ?? parseGclAw(get(COOKIES.gclAw)),
    gbraid: get(COOKIES.gbraid),
    wbraid: get(COOKIES.wbraid),
    gaClientId: parseGaClientId(get(COOKIES.ga)),
    gaSessionId: ga4MeasurementId ? parseGaSessionId(get(gaSessionCookieName(ga4MeasurementId))) : undefined,
    visitorId: get(COOKIES.visitorId),
    firstTouch: parseTouch(get(COOKIES.firstTouch)),
    lastTouch: parseTouch(get(COOKIES.lastTouch)),
  }
}

/** Lê um header Cookie cru (`a=1; b=2`) — usado onde não há API de cookies. */
export function cookieReaderFromHeader(header: string | null | undefined): CookieReader {
  const map = new Map<string, string>()
  for (const part of (header ?? '').split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    const k = part.slice(0, i).trim()
    const raw = part.slice(i + 1).trim()
    try {
      map.set(k, decodeURIComponent(raw))
    } catch {
      map.set(k, raw)
    }
  }
  return (name) => map.get(name)
}
