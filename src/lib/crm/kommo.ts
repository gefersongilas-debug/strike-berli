/**
 * Kommo (ex-amoCRM) via integração privada com token de longa duração.
 *
 * Um lead do site vira, numa única chamada (`/leads/complex`):
 *   contato (nome, telefone, e-mail) + negócio no funil/etapa configurados + tags
 * e, em seguida, uma nota no negócio com TODAS as respostas e a atribuição —
 * assim nada se perde mesmo sem mapear campo personalizado.
 *
 * Campos personalizados: `KOMMO_FIELD_MAP` liga uma chave (de `fields` ou da
 * atribuição, ex.: utm_source, gclid) ao id do campo do negócio no Kommo.
 */
import type { KommoConfig } from '@/lib/config'
import type { DestinationResult, FetchLike } from '@/lib/server/types'
import { errorDetail, failed, sent } from '@/lib/server/types'
import { normalizePhoneBR } from '@/lib/tracking/normalize'
import type { CrmLead } from './index'

/** Limite de texto dos campos do Kommo; valores maiores são cortados. */
const MAX_VALUE = 256

export function kommoBaseUrl(cfg: Pick<KommoConfig, 'subdomain'>): string {
  return `https://${cfg.subdomain}.kommo.com/api/v4`
}

function headers(cfg: KommoConfig): Record<string, string> {
  return {
    Authorization: `Bearer ${cfg.accessToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

/** Valores que podem ir para campo personalizado: respostas do formulário + atribuição. */
function mappableValues(lead: CrmLead): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(lead.attribution)) if (v) out[k] = String(v)
  for (const [k, v] of Object.entries(lead.fields ?? {})) if (v) out[k] = v
  out.event_id = lead.eventId
  out.page_url = lead.pageUrl
  return out
}

export function buildKommoLead(lead: CrmLead, cfg: KommoConfig) {
  const values = mappableValues(lead)
  const customFields = Object.entries(cfg.fieldMap).flatMap(([key, fieldId]) =>
    values[key] ? [{ field_id: fieldId, values: [{ value: values[key].slice(0, MAX_VALUE) }] }] : [],
  )

  const phone = normalizePhoneBR(lead.phone)
  const contact = dropEmpty({
    name: lead.name,
    responsible_user_id: cfg.responsibleUserId,
    custom_fields_values: [
      { field_code: 'PHONE', values: [{ value: phone ? `+${phone}` : lead.phone, enum_code: 'WORK' }] },
      ...(lead.email ? [{ field_code: 'EMAIL', values: [{ value: lead.email, enum_code: 'WORK' }] }] : []),
    ],
  })

  return [
    dropEmpty({
      name: `${lead.name} · site`.slice(0, MAX_VALUE),
      pipeline_id: cfg.pipelineId,
      status_id: cfg.statusId,
      responsible_user_id: cfg.responsibleUserId,
      custom_fields_values: customFields.length ? customFields : undefined,
      _embedded: {
        tags: cfg.tags.map((name) => ({ name })),
        contacts: [contact],
      },
    }),
  ]
}

const ATTRIBUTION_ORDER: Array<keyof CrmLead['attribution']> = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'first_utm_source',
  'first_utm_medium',
  'first_utm_campaign',
  'landing_page',
  'referrer',
  'gclid',
  'gbraid',
  'wbraid',
  'fbc',
  'fbp',
  'ga_client_id',
]

export function buildKommoNote(lead: CrmLead): string {
  const lines = ['Lead do site', `Página: ${lead.pageUrl}`, `Consentimento LGPD: ${lead.consent ? 'sim' : 'não'}`]
  if (lead.message) lines.push(`Mensagem: ${lead.message}`)

  const fields = Object.entries(lead.fields ?? {}).filter(([, v]) => v)
  if (fields.length) lines.push('', 'Respostas do formulário', ...fields.map(([k, v]) => `- ${k}: ${v}`))

  const attribution = ATTRIBUTION_ORDER.flatMap((k) => (lead.attribution[k] ? [`- ${k}: ${lead.attribution[k]}`] : []))
  if (attribution.length) lines.push('', 'Origem', ...attribution)

  lines.push('', `event_id: ${lead.eventId}`)
  return lines.join('\n')
}

export async function sendKommo(lead: CrmLead, cfg: KommoConfig, fetchImpl: FetchLike): Promise<DestinationResult> {
  const base = kommoBaseUrl(cfg)
  const res = await fetchImpl(`${base}/leads/complex`, {
    method: 'POST',
    headers: headers(cfg),
    body: JSON.stringify(buildKommoLead(lead, cfg)),
  })
  if (!res.ok) return failed(await errorDetail(res))

  // Daqui em diante o negócio JÁ existe: nenhuma falha pode virar `failed`,
  // senão o visitante reenvia e o comercial recebe o lead duplicado.
  const created = (await res.json().catch(() => undefined)) as Array<{ id?: number; merged?: boolean }> | undefined
  const leadId = created?.[0]?.id
  if (!leadId) return sent('negócio criado, mas a resposta veio sem id; nota não enviada')
  const label = `negócio ${leadId}${created?.[0]?.merged ? ' (mesclado com duplicado)' : ''}`

  try {
    const note = await fetchImpl(`${base}/leads/notes`, {
      method: 'POST',
      headers: headers(cfg),
      body: JSON.stringify([{ entity_id: leadId, note_type: 'common', params: { text: buildKommoNote(lead) } }]),
    })
    if (!note.ok) return sent(`${label}; nota falhou: ${await errorDetail(note)}`)
  } catch (e) {
    return sent(`${label}; nota falhou: ${e instanceof Error ? e.message : String(e)}`)
  }
  return sent(label)
}

/**
 * Checagem ao vivo (npm run check:tracking:live): token e subdomínio valem, funil
 * e etapa existem, campos do KOMMO_FIELD_MAP existem. Sugere o mapa das UTMs a
 * partir dos campos de rastreamento da conta. Não cria nada.
 */
export async function checkKommoAccess(cfg: KommoConfig, fetchImpl: FetchLike = fetch): Promise<DestinationResult> {
  const base = kommoBaseUrl(cfg)
  const get = (path: string) => fetchImpl(`${base}${path}`, { headers: headers(cfg) })

  const account = await get('/account')
  if (!account.ok) return failed(`conta: ${await errorDetail(account)}`)
  const { name } = (await account.json()) as { name?: string }
  const notes = [`conta "${name ?? cfg.subdomain}"`]

  if (cfg.pipelineId) {
    const pipeline = await get(`/leads/pipelines/${cfg.pipelineId}`)
    if (!pipeline.ok) return failed(`funil ${cfg.pipelineId} não encontrado (${pipeline.status})`)
    const body = (await pipeline.json()) as { name?: string; _embedded?: { statuses?: Array<{ id: number }> } }
    if (cfg.statusId && !body._embedded?.statuses?.some((s) => s.id === cfg.statusId))
      return failed(`etapa ${cfg.statusId} não pertence ao funil ${cfg.pipelineId}`)
    notes.push(`funil "${body.name ?? cfg.pipelineId}"`)
  }

  const fieldsRes = await get('/leads/custom_fields?limit=250')
  if (!fieldsRes.ok) return failed(`campos: ${await errorDetail(fieldsRes)}`)
  const fields =
    ((await fieldsRes.json().catch(() => ({}))) as {
      _embedded?: { custom_fields?: Array<{ id: number; name?: string; type?: string; code?: string | null }> }
    })._embedded?.custom_fields ?? []

  const missing = Object.entries(cfg.fieldMap).filter(([, id]) => !fields.some((f) => f.id === id))
  if (missing.length)
    return failed(`KOMMO_FIELD_MAP aponta para campo inexistente: ${missing.map(([k, id]) => `${k}=${id}`).join(', ')}`)

  const mapped = new Set(Object.keys(cfg.fieldMap))
  const suggestion = Object.fromEntries(
    fields
      .filter((f) => f.type === 'tracking_data' && f.code)
      .map((f) => [f.code === 'UTM_REFERRER' ? 'referrer' : f.code!.toLowerCase(), f.id] as const)
      .filter(([key]) => !mapped.has(key) && (key.startsWith('utm_') || ['gclid', 'referrer'].includes(key))),
  )
  if (Object.keys(suggestion).length) notes.push(`campos de UTM ainda não mapeados: ${JSON.stringify(suggestion)}`)

  return sent(notes.join('; '))
}

function dropEmpty<T extends object>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '')) as T
}
