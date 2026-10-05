/**
 * Orquestra o envio server-side: todas as plataformas em paralelo, uma falha
 * não derruba as outras, e o log diz exatamente o que saiu e o que não saiu.
 */
import type { ServerConfig } from '@/lib/config'
import { sendGa4Event } from './ga4-mp'
import { sendGoogleAdsConversion } from './google-ads'
import { sendMetaEvent } from './meta-capi'
import type { DestinationResult, FetchLike, ServerEvent } from './types'
import { failed, skipped, withTimeout } from './types'

export type Destination = 'meta' | 'ga4' | 'googleAds'
export type DispatchResult = Record<Destination, DestinationResult>

const TIMEOUT_MS = 5000

export function shouldSendGa4(ev: ServerEvent, cfg: ServerConfig): boolean {
  // page_view etc. o GA4 coleta pelo browser. Lead vai pelo servidor só se configurado assim.
  return ev.key === 'lead' && cfg.public.ga4LeadSource === 'server'
}

export async function dispatchServerEvent(
  ev: ServerEvent,
  cfg: ServerConfig,
  fetchImpl: FetchLike = fetch,
): Promise<DispatchResult> {
  const run = async (label: Destination, fn: () => Promise<DestinationResult>) => {
    try {
      return await withTimeout(fn(), TIMEOUT_MS, label)
    } catch (e) {
      return failed(e instanceof Error ? e.message : String(e))
    }
  }

  const [meta, ga4, googleAds] = await Promise.all([
    run('meta', () => sendMetaEvent(ev, cfg.meta, fetchImpl)),
    run('ga4', () =>
      shouldSendGa4(ev, cfg) ? sendGa4Event(ev, cfg.ga4, fetchImpl) : Promise.resolve(skipped('ga4 coleta pelo browser')),
    ),
    run('googleAds', () => sendGoogleAdsConversion(ev, cfg.googleAds, fetchImpl)),
  ])

  const result: DispatchResult = { meta, ga4, googleAds }
  logDispatch(ev, result)
  return result
}

export function logDispatch(ev: ServerEvent, r: DispatchResult) {
  const parts = (Object.entries(r) as [Destination, DestinationResult][]).map(
    ([k, v]) => `${k}=${v.status}${v.detail ? `(${v.detail})` : ''}`,
  )
  const anyFailed = Object.values(r).some((v) => v.status === 'failed')
  const line = `[tracking] ${ev.key} evt=${ev.eventId} ${parts.join(' ')}`
  if (anyFailed) console.error(line)
  else console.info(line)
}
