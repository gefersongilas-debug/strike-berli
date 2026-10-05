/**
 * API de tracking do browser. Use só isto nos componentes:
 *
 *   trackEvent('contact')                    // browser + servidor, mesmo event_id
 *   fireBrowserEvent('lead', id, { user })   // depois do POST /api/lead
 *
 * O modo (direct/gtm) é resolvido aqui — componente nenhum chama fbq/gtag direto.
 */
import type { PublicConfig } from '@/lib/config'
import { COOKIES, MAX_AGE, type ConsentValue } from './cookies'
import { CURRENCY, EVENTS, type EventDefinition, type EventKey } from './events'
import { normalizeEmail, normalizePhoneBR, toE164 } from './normalize'

type Fn = (...args: unknown[]) => void

export interface TrackingWindow {
  fbq?: Fn
  gtag?: Fn
  dataLayer?: unknown[]
  location: { href: string }
  document: { cookie: string }
  navigator?: { sendBeacon?: (url: string, data: Blob) => boolean }
  fetch?: typeof fetch
}

export type Params = Record<string, string | number | boolean>

export interface BrowserUser {
  email?: string
  phone?: string
}

export function newEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

function googleUserData(user?: BrowserUser) {
  if (!user) return undefined
  const email = normalizeEmail(user.email)
  const phone_number = toE164(normalizePhoneBR(user.phone))
  if (!email && !phone_number) return undefined
  return { ...(email ? { email } : {}), ...(phone_number ? { phone_number } : {}) }
}

/** Rótulo da conversão do Google Ads (tag no browser) de cada evento, se houver. */
export function googleAdsLabelFor(key: EventKey, cfg: PublicConfig): string | undefined {
  if (key === 'lead') return cfg.googleAdsLeadLabel
  if (key === 'reservation_click') return cfg.googleAdsReservationLabel
  if (key === 'contact') return cfg.googleAdsContactLabel
  return undefined
}

/** Dispara o evento no browser, pelo caminho do modo configurado. */
export function fireBrowserEvent(
  key: EventKey,
  eventId: string,
  cfg: PublicConfig,
  win: TrackingWindow,
  opts: { params?: Params; user?: BrowserUser } = {},
): void {
  const def: EventDefinition = EVENTS[key]
  const params = opts.params ?? {}
  const userData = googleUserData(opts.user)

  if (cfg.mode === 'gtm') {
    win.dataLayer = win.dataLayer ?? []
    win.dataLayer.push({
      event: def.dataLayer,
      event_id: eventId,
      meta_event_name: def.meta,
      ga4_event_name: def.ga4,
      ga4_send_from_browser: !(key === 'lead' && cfg.ga4LeadSource === 'server'),
      ...(def.googleAdsConversion ? { currency: CURRENCY } : {}),
      ...(userData ? { user_data: userData } : {}),
      ...params,
    })
    return
  }

  // --- modo direct ---
  if (cfg.metaPixelId && win.fbq) {
    win.fbq(def.metaCustom ? 'trackCustom' : 'track', def.meta, def.googleAdsConversion ? { currency: CURRENCY, ...params } : params, {
      eventID: eventId,
    })
  }
  if (!win.gtag) return

  const ga4FromBrowser = def.ga4 && !(key === 'lead' && cfg.ga4LeadSource === 'server')
  if (cfg.ga4Id && ga4FromBrowser) {
    win.gtag('event', def.ga4, { ...params, event_id: eventId, send_to: cfg.ga4Id })
  }
  const adsLabel = googleAdsLabelFor(key, cfg)
  if (cfg.googleAdsId && adsLabel) {
    if (userData) win.gtag('set', 'user_data', userData)
    win.gtag('event', 'conversion', {
      send_to: `${cfg.googleAdsId}/${adsLabel}`,
      transaction_id: eventId,
      ...(def.googleAdsConversion ? { currency: CURRENCY, ...params } : {}),
    })
  }
}

/** Manda o mesmo evento para /api/track (CAPI). Não bloqueia navegação. */
export function sendServerEvent(key: EventKey, eventId: string, win: TrackingWindow, params?: Params): void {
  const body = JSON.stringify({ event: key, eventId, pageUrl: win.location.href, custom: params })
  const blob = new Blob([body], { type: 'application/json' })
  if (win.navigator?.sendBeacon?.('/api/track', blob)) return
  void win.fetch?.('/api/track', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } })
}

/** Evento completo: browser + servidor com o mesmo event_id. Retorna o id. */
export function trackEventWith(
  key: EventKey,
  cfg: PublicConfig,
  win: TrackingWindow,
  params?: Params,
): string {
  const eventId = newEventId()
  fireBrowserEvent(key, eventId, cfg, win, { params })
  if (EVENTS[key].publicServer && (key !== 'page_view' || cfg.serverPageview)) sendServerEvent(key, eventId, win, params)
  return eventId
}

// --- Consentimento (NEXT_PUBLIC_CONSENT_MODE=banner) ---

export function readConsent(win: TrackingWindow): ConsentValue | undefined {
  const m = win.document.cookie.split('; ').find((c) => c.startsWith(`${COOKIES.consent}=`))
  const v = m?.split('=')[1]
  return v === 'granted' || v === 'denied' ? v : undefined
}

export function applyConsent(value: ConsentValue, win: TrackingWindow): void {
  const secure = win.location.href.startsWith('https:') ? '; Secure' : ''
  win.document.cookie = `${COOKIES.consent}=${value}; Max-Age=${MAX_AGE.consent}; Path=/; SameSite=Lax${secure}`
  win.gtag?.('consent', 'update', {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
  })
  win.fbq?.('consent', value === 'granted' ? 'grant' : 'revoke')
  win.dataLayer = win.dataLayer ?? []
  win.dataLayer.push({ event: 'trk_consent_update', trk_consent: value })
}
