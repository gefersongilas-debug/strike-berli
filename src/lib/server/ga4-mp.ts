/**
 * GA4 Measurement Protocol.
 * Docs: https://developers.google.com/analytics/devguides/collection/protocol/ga4
 *
 * O GA4 NÃO deduplica evento entre browser e servidor. Por isso cada evento sai
 * por um caminho só — ver NEXT_PUBLIC_GA4_LEAD_SOURCE.
 */
import type { Ga4ServerConfig } from '@/lib/config'
import { CURRENCY, EVENTS } from '@/lib/tracking/events'
import { hashedArray, normalizeEmail, normalizePhoneBR, toE164 } from './hash'
import type { DestinationResult, FetchLike, ServerEvent } from './types'
import { errorDetail, failed, sent, skipped } from './types'

export interface Ga4Payload {
  client_id: string
  timestamp_micros: number
  consent?: { ad_user_data: 'GRANTED' | 'DENIED'; ad_personalization: 'GRANTED' | 'DENIED' }
  user_data?: { sha256_email_address?: string[]; sha256_phone_number?: string[] }
  events: Array<{ name: string; params: Record<string, string | number | boolean> }>
}

/** client_id sintético quando não há `_ga` (ex.: bloqueador). Estável por evento. */
export function fallbackClientId(eventId: string, eventTime: number): string {
  let h = 0
  for (const c of eventId) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return `${h}.${eventTime}`
}

export function buildGa4Payload(ev: ServerEvent): Ga4Payload | null {
  const name = EVENTS[ev.key].ga4
  if (!name) return null

  const params: Record<string, string | number | boolean> = {
    event_id: ev.eventId,
    engagement_time_msec: 1,
    page_location: ev.context.sourceUrl,
  }
  if (ev.attribution.gaSessionId) params.session_id = ev.attribution.gaSessionId
  if (ev.key === 'lead') params.currency = CURRENCY
  const touch = ev.attribution.lastTouch
  if (touch?.utm_source) params.campaign_source = touch.utm_source
  if (touch?.utm_medium) params.campaign_medium = touch.utm_medium
  if (touch?.utm_campaign) params.campaign_name = touch.utm_campaign
  for (const [k, v] of Object.entries(ev.custom ?? {})) if (v !== undefined) params[k] = v

  const email = hashedArray(normalizeEmail(ev.user.email))
  const phone = hashedArray(toE164(normalizePhoneBR(ev.user.phone)))

  const payload: Ga4Payload = {
    client_id: ev.attribution.gaClientId ?? fallbackClientId(ev.eventId, ev.eventTime),
    timestamp_micros: ev.eventTime * 1_000_000,
    consent: ev.consentGranted
      ? { ad_user_data: 'GRANTED', ad_personalization: 'GRANTED' }
      : { ad_user_data: 'DENIED', ad_personalization: 'DENIED' },
    events: [{ name, params }],
  }
  if (ev.consentGranted && (email || phone)) {
    payload.user_data = {
      ...(email ? { sha256_email_address: email } : {}),
      ...(phone ? { sha256_phone_number: phone } : {}),
    }
  }
  return payload
}

export function ga4Endpoint(cfg: Ga4ServerConfig, debug = false): string {
  const base = debug ? 'https://www.google-analytics.com/debug/mp/collect' : 'https://www.google-analytics.com/mp/collect'
  return `${base}?measurement_id=${encodeURIComponent(cfg.measurementId)}&api_secret=${encodeURIComponent(cfg.apiSecret)}`
}

export async function sendGa4Event(
  ev: ServerEvent,
  cfg: Ga4ServerConfig | undefined,
  fetchImpl: FetchLike = fetch,
): Promise<DestinationResult> {
  if (!cfg) return skipped('ga4 mp não configurado')
  const payload = buildGa4Payload(ev)
  if (!payload) return skipped(`evento ${ev.key} não vai ao GA4 pelo servidor`)

  const res = await fetchImpl(ga4Endpoint(cfg), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  // O endpoint de produção responde 204 mesmo para payload inválido — a validação real
  // está no check ao vivo (endpoint /debug).
  if (!res.ok) return failed(await errorDetail(res))
  return sent(ev.attribution.gaClientId ? undefined : 'client_id sintético (sem cookie _ga)')
}

/** Valida um payload no endpoint /debug do GA4 — usado pelo check ao vivo e pelos testes. */
export async function validateGa4Payload(
  payload: Ga4Payload,
  cfg: Ga4ServerConfig,
  fetchImpl: FetchLike = fetch,
): Promise<DestinationResult> {
  const res = await fetchImpl(ga4Endpoint(cfg, true), { method: 'POST', body: JSON.stringify(payload) })
  if (!res.ok) return failed(await errorDetail(res))
  const json = (await res.json()) as { validationMessages?: Array<{ description?: string }> }
  const msgs = json.validationMessages ?? []
  return msgs.length === 0 ? sent('payload válido') : failed(msgs.map((m) => m.description).join(' | '))
}
