/**
 * Meta Conversions API (CAPI).
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */
import type { MetaServerConfig } from '@/lib/config'
import { CURRENCY, EVENTS } from '@/lib/tracking/events'
import { hashedArray, normalizeEmail, normalizeName, normalizePhoneBR, splitName } from './hash'
import type { DestinationResult, FetchLike, ServerEvent } from './types'
import { errorDetail, failed, sent, skipped } from './types'

export interface MetaUserData {
  em?: string[]
  ph?: string[]
  fn?: string[]
  ln?: string[]
  ct?: string[]
  st?: string[]
  zp?: string[]
  country?: string[]
  external_id?: string[]
  client_ip_address?: string
  client_user_agent?: string
  fbc?: string
  fbp?: string
}

export interface MetaEventPayload {
  data: Array<{
    event_name: string
    event_time: number
    event_id: string
    action_source: 'website'
    event_source_url: string
    user_data: MetaUserData
    custom_data?: Record<string, unknown>
  }>
  test_event_code?: string
}

export function buildMetaUserData(ev: ServerEvent): MetaUserData {
  const { first, last } = splitName(ev.user.name)
  const cityNorm = normalizeName(ev.user.city)?.replace(/\s/g, '')
  const zip = ev.user.zip?.replace(/\D/g, '') || undefined
  const ud: MetaUserData = {
    em: hashedArray(normalizeEmail(ev.user.email)),
    ph: hashedArray(normalizePhoneBR(ev.user.phone)),
    fn: hashedArray(first),
    ln: hashedArray(last),
    ct: hashedArray(cityNorm),
    st: hashedArray(ev.user.state?.trim().toLowerCase()),
    zp: hashedArray(zip),
    country: hashedArray('br'),
    external_id: hashedArray(ev.attribution.visitorId),
    client_ip_address: ev.context.ip,
    client_user_agent: ev.context.userAgent,
    fbc: ev.attribution.fbc,
    fbp: ev.attribution.fbp,
  }
  return stripUndefined(ud)
}

export function buildMetaPayload(ev: ServerEvent, cfg: MetaServerConfig): MetaEventPayload {
  const def = EVENTS[ev.key]
  const custom: Record<string, unknown> = { ...ev.custom }
  if (ev.key === 'lead') custom.currency ??= CURRENCY

  const payload: MetaEventPayload = {
    data: [
      {
        event_name: def.meta,
        event_time: ev.eventTime,
        event_id: ev.eventId,
        action_source: 'website',
        event_source_url: ev.context.sourceUrl,
        user_data: buildMetaUserData(ev),
        ...(Object.keys(stripUndefined(custom)).length ? { custom_data: stripUndefined(custom) } : {}),
      },
    ],
  }
  if (cfg.testEventCode) payload.test_event_code = cfg.testEventCode
  return payload
}

export function metaEndpoint(cfg: MetaServerConfig): string {
  return `https://graph.facebook.com/${cfg.apiVersion}/${cfg.pixelId}/events`
}

export async function sendMetaEvent(
  ev: ServerEvent,
  cfg: MetaServerConfig | undefined,
  fetchImpl: FetchLike = fetch,
): Promise<DestinationResult> {
  if (!cfg) return skipped('meta capi não configurada')
  if (!ev.consentGranted) return skipped('sem consentimento')

  const body = JSON.stringify({ ...buildMetaPayload(ev, cfg), access_token: cfg.accessToken })
  const res = await fetchImpl(metaEndpoint(cfg), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
  if (!res.ok) return failed(await errorDetail(res))
  const json = (await res.json().catch(() => ({}))) as { events_received?: number }
  if (json.events_received !== 1) return failed(`events_received=${json.events_received ?? '?'}`)
  return sent(cfg.testEventCode ? 'test_event_code' : undefined)
}

function stripUndefined<T extends object>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '')) as T
}

/** Exposto para o check ao vivo: token alcança o pixel? */
export async function checkMetaPixelAccess(cfg: MetaServerConfig, fetchImpl: FetchLike = fetch) {
  const url = `https://graph.facebook.com/${cfg.apiVersion}/${cfg.pixelId}?fields=id,name`
  const res = await fetchImpl(url, { headers: { Authorization: `Bearer ${cfg.accessToken}` } })
  if (!res.ok) return failed(await errorDetail(res))
  const json = (await res.json()) as { id?: string; name?: string }
  return json.id === cfg.pixelId ? sent(`pixel "${json.name ?? json.id}"`) : failed('resposta sem id do pixel')
}
