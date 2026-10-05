/**
 * Envio do lead para o CRM. Para trocar de CRM, crie um adapter com a mesma
 * assinatura de `sendWebhook` e registre em `sendLeadToCrm`.
 */
import { createHmac } from 'node:crypto'
import type { CrmConfig } from '@/lib/config'
import type { Attribution } from '@/lib/tracking/attribution'
import type { DestinationResult, FetchLike } from '@/lib/server/types'
import { errorDetail, failed, sent, skipped } from '@/lib/server/types'
import { normalizePhoneBR } from '@/lib/tracking/normalize'
import { sendKommo } from './kommo'

export { buildKommoLead, buildKommoNote, checkKommoAccess, kommoBaseUrl, sendKommo } from './kommo'

export interface CrmLead {
  eventId: string
  createdAt: string
  name: string
  email?: string
  phone: string
  message?: string
  pageUrl: string
  consent: boolean
  /** Perguntas extras do formulário (inputs `name="fields.<chave>"`), ex.: { entrada: "R$ 70 a 100 mil" }. */
  fields?: Record<string, string>
  attribution: {
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_content?: string
    utm_term?: string
    first_utm_source?: string
    first_utm_medium?: string
    first_utm_campaign?: string
    landing_page?: string
    referrer?: string
    gclid?: string
    gbraid?: string
    wbraid?: string
    fbc?: string
    fbp?: string
    ga_client_id?: string
  }
}

export function buildCrmAttribution(a: Attribution): CrmLead['attribution'] {
  const last = a.lastTouch
  const first = a.firstTouch
  return clean({
    utm_source: last?.utm_source,
    utm_medium: last?.utm_medium,
    utm_campaign: last?.utm_campaign,
    utm_content: last?.utm_content,
    utm_term: last?.utm_term,
    first_utm_source: first?.utm_source,
    first_utm_medium: first?.utm_medium,
    first_utm_campaign: first?.utm_campaign,
    landing_page: first?.landing_page ?? last?.landing_page,
    referrer: first?.referrer ?? last?.referrer,
    gclid: a.gclid,
    gbraid: a.gbraid,
    wbraid: a.wbraid,
    fbc: a.fbc,
    fbp: a.fbp,
    ga_client_id: a.gaClientId,
  })
}

export async function sendLeadToCrm(
  lead: CrmLead,
  cfg: CrmConfig,
  fetchImpl: FetchLike = fetch,
): Promise<DestinationResult> {
  switch (cfg.provider) {
    case 'webhook':
      return sendWebhook(lead, cfg, fetchImpl)
    case 'rdstation':
      return sendRdStation(lead, cfg, fetchImpl)
    case 'kommo':
      return sendKommo(lead, cfg, fetchImpl)
    case 'none':
      return skipped('CRM_PROVIDER=none')
  }
}

// --- Webhook genérico (n8n, Make, Zapier, backend próprio) ---

export function signWebhookBody(body: string, secret: string): string {
  return `sha256=${createHmac('sha256', secret).update(body, 'utf8').digest('hex')}`
}

export async function sendWebhook(
  lead: CrmLead,
  cfg: Extract<CrmConfig, { provider: 'webhook' }>,
  fetchImpl: FetchLike,
): Promise<DestinationResult> {
  const body = JSON.stringify({ type: 'lead', ...lead })
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (cfg.secret) headers['X-Signature'] = signWebhookBody(body, cfg.secret)
  const res = await fetchImpl(cfg.url, { method: 'POST', headers, body })
  return res.ok ? sent() : failed(await errorDetail(res))
}

// --- RD Station Marketing (API de conversões) ---

export const RD_ENDPOINT = 'https://api.rd.services/platform/conversions'

export function buildRdStationPayload(lead: CrmLead, conversionIdentifier: string) {
  const a = lead.attribution
  const phone = normalizePhoneBR(lead.phone)
  return {
    event_type: 'CONVERSION',
    event_family: 'CDP',
    payload: clean({
      conversion_identifier: conversionIdentifier,
      email: lead.email,
      name: lead.name,
      mobile_phone: phone ? `+${phone}` : lead.phone,
      traffic_source: a.utm_source,
      traffic_medium: a.utm_medium,
      traffic_campaign: a.utm_campaign,
      traffic_value: a.utm_term,
      cf_mensagem: lead.message,
      cf_gclid: a.gclid,
      cf_fbc: a.fbc,
      ...Object.fromEntries(Object.entries(lead.fields ?? {}).map(([k, v]) => [`cf_${k}`, v])),
      available_for_mailing: lead.consent,
      legal_bases: lead.consent
        ? [{ category: 'communications', type: 'consent', status: 'granted' }]
        : [{ category: 'communications', type: 'legitimate_interest', status: 'granted' }],
    }),
  }
}

export async function sendRdStation(
  lead: CrmLead,
  cfg: Extract<CrmConfig, { provider: 'rdstation' }>,
  fetchImpl: FetchLike,
): Promise<DestinationResult> {
  const res = await fetchImpl(`${RD_ENDPOINT}?api_key=${encodeURIComponent(cfg.apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(buildRdStationPayload(lead, cfg.conversionIdentifier)),
  })
  return res.ok ? sent() : failed(await errorDetail(res))
}

function clean<T extends object>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '')) as T
}
