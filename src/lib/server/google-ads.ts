/**
 * Google Ads API — upload de conversão de clique (com enhanced conversions for leads).
 * Docs: https://developers.google.com/google-ads/api/docs/conversions/upload-offline
 *
 * A ação de conversão precisa ser do tipo "Importação > Cliques" (UPLOAD_CLICKS),
 * diferente da ação usada pela tag do site.
 */
import type { GoogleAdsServerConfig } from '@/lib/config'
import { CURRENCY } from '@/lib/tracking/events'
import { normalizeEmail, normalizePhoneBR, sha256, toE164 } from './hash'
import type { DestinationResult, FetchLike, ServerEvent } from './types'
import { errorDetail, failed, sent, skipped } from './types'

export interface ClickConversion {
  conversionAction: string
  conversionDateTime: string
  orderId: string
  currencyCode: string
  conversionValue?: number
  gclid?: string
  gbraid?: string
  wbraid?: string
  userIdentifiers?: Array<{ hashedEmail: string } | { hashedPhoneNumber: string }>
  consent: { adUserData: 'GRANTED' | 'DENIED' }
}

/** "yyyy-mm-dd hh:mm:ss+00:00" em UTC, formato exigido pela API. */
export function formatConversionDateTime(epochSeconds: number): string {
  const iso = new Date(epochSeconds * 1000).toISOString() // 2026-09-26T18:04:05.000Z
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)}+00:00`
}

export function conversionActionResource(cfg: GoogleAdsServerConfig): string {
  return `customers/${cfg.customerId}/conversionActions/${cfg.conversionActionId}`
}

export function buildClickConversion(ev: ServerEvent, cfg: GoogleAdsServerConfig): ClickConversion | null {
  const a = ev.attribution
  const conv: ClickConversion = {
    conversionAction: conversionActionResource(cfg),
    conversionDateTime: formatConversionDateTime(ev.eventTime),
    orderId: ev.eventId,
    currencyCode: CURRENCY,
    consent: { adUserData: ev.consentGranted ? 'GRANTED' : 'DENIED' },
  }
  if (typeof ev.custom?.value === 'number') conv.conversionValue = ev.custom.value

  // A API aceita exatamente UM click id.
  if (a.gclid) conv.gclid = a.gclid
  else if (a.gbraid) conv.gbraid = a.gbraid
  else if (a.wbraid) conv.wbraid = a.wbraid

  // user identifiers não são aceitos junto com gbraid/wbraid.
  const canUseIdentifiers = !conv.gbraid && !conv.wbraid && ev.consentGranted
  if (canUseIdentifiers) {
    const ids: NonNullable<ClickConversion['userIdentifiers']> = []
    const em = sha256(normalizeEmail(ev.user.email))
    const ph = sha256(toE164(normalizePhoneBR(ev.user.phone)))
    if (em) ids.push({ hashedEmail: em })
    if (ph) ids.push({ hashedPhoneNumber: ph })
    if (ids.length) conv.userIdentifiers = ids
  }

  const hasClickId = !!(conv.gclid || conv.gbraid || conv.wbraid)
  if (!hasClickId && !conv.userIdentifiers) return null
  return conv
}

// --- OAuth (refresh token → access token), com cache em memória da função ---

let tokenCache: { token: string; expiresAt: number; key: string } | undefined

export function resetGoogleTokenCache() {
  tokenCache = undefined
}

export async function getGoogleAccessToken(cfg: GoogleAdsServerConfig, fetchImpl: FetchLike = fetch): Promise<string> {
  const key = `${cfg.clientId}:${cfg.refreshToken.slice(-6)}`
  if (tokenCache && tokenCache.key === key && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token

  const res = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: cfg.refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  })
  if (!res.ok) throw new Error(`OAuth Google: ${await errorDetail(res)}`)
  const json = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!json.access_token) throw new Error('OAuth Google: resposta sem access_token')
  tokenCache = { token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000, key }
  return json.access_token
}

export function googleAdsHeaders(cfg: GoogleAdsServerConfig, accessToken: string): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'developer-token': cfg.developerToken,
  }
  if (cfg.loginCustomerId) h['login-customer-id'] = cfg.loginCustomerId
  return h
}

export async function sendGoogleAdsConversion(
  ev: ServerEvent,
  cfg: GoogleAdsServerConfig | undefined,
  fetchImpl: FetchLike = fetch,
): Promise<DestinationResult> {
  if (!cfg) return skipped('google ads api não configurada')
  if (ev.key !== 'lead') return skipped(`evento ${ev.key} não é conversão do Google Ads`)
  const conversion = buildClickConversion(ev, cfg)
  if (!conversion) return skipped('sem gclid/gbraid/wbraid nem e-mail/telefone')

  const token = await getGoogleAccessToken(cfg, fetchImpl)
  const url = `https://googleads.googleapis.com/${cfg.apiVersion}/customers/${cfg.customerId}:uploadClickConversions`
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: googleAdsHeaders(cfg, token),
    body: JSON.stringify({ conversions: [conversion], partialFailure: true }),
  })
  if (!res.ok) return failed(await errorDetail(res))

  // Com partialFailure=true a API responde 200 mesmo quando a conversão falha.
  const json = (await res.json().catch(() => ({}))) as { partialFailureError?: { message?: string } }
  if (json.partialFailureError) return failed(`partialFailure: ${json.partialFailureError.message ?? 'erro'}`)
  return sent(conversion.gclid ? 'gclid' : conversion.gbraid ? 'gbraid' : conversion.wbraid ? 'wbraid' : 'enhanced (sem click id)')
}

/** Check ao vivo: a ação de conversão existe, está ativa e é de importação de clique? */
export async function checkGoogleAdsConversionAction(cfg: GoogleAdsServerConfig, fetchImpl: FetchLike = fetch) {
  const token = await getGoogleAccessToken(cfg, fetchImpl)
  const url = `https://googleads.googleapis.com/${cfg.apiVersion}/customers/${cfg.customerId}/googleAds:search`
  const query = `SELECT conversion_action.id, conversion_action.name, conversion_action.status, conversion_action.type FROM conversion_action WHERE conversion_action.id = ${Number(cfg.conversionActionId)}`
  const res = await fetchImpl(url, { method: 'POST', headers: googleAdsHeaders(cfg, token), body: JSON.stringify({ query }) })
  if (!res.ok) return failed(await errorDetail(res))
  const json = (await res.json()) as {
    results?: Array<{ conversionAction?: { name?: string; status?: string; type?: string } }>
  }
  const ca = json.results?.[0]?.conversionAction
  if (!ca) return failed(`ação de conversão ${cfg.conversionActionId} não encontrada na conta ${cfg.customerId}`)
  if (ca.status !== 'ENABLED') return failed(`ação "${ca.name}" está ${ca.status}`)
  if (ca.type !== 'UPLOAD_CLICKS') return failed(`ação "${ca.name}" é do tipo ${ca.type}; precisa ser UPLOAD_CLICKS (importação de cliques)`)
  return sent(`ação "${ca.name}" ativa`)
}
