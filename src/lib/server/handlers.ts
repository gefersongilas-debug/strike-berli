/**
 * Lógica das rotas /api/lead e /api/track, separada do Next para ser testável.
 * As rotas em src/app/api só injetam as dependências (config, fetch, after()).
 */
import { z } from 'zod'
import type { ServerConfig } from '@/lib/config'
import { buildCrmAttribution, sendLeadToCrm, type CrmLead } from '@/lib/crm'
import { EVENTS, isEventKey } from '@/lib/tracking/events'
import { dispatchServerEvent } from './dispatch'
import { normalizePhoneBR } from '@/lib/tracking/normalize'
import { clientIp, consentGranted, originAllowed, requestAttribution, sameSiteUrl } from './request'
import type { FetchLike, ServerEvent } from './types'
import { failed, withTimeout } from './types'

export interface HandlerDeps {
  cfg: ServerConfig
  fetch?: FetchLike
  /** Roda depois da resposta (na Vercel: `after` do next/server). */
  defer: (task: () => Promise<unknown>) => void
  now?: () => number
}

const EVENT_ID = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/, 'eventId inválido')

/** Perguntas extras do formulário (`name="fields.<chave>"` no LeadForm) — vão para o CRM. */
const FieldsSchema = z
  .record(z.string().regex(/^[a-z0-9_]{1,40}$/, 'chave de campo inválida'), z.string().trim().max(300))
  .refine((o) => Object.keys(o).length <= 20, 'campos extras demais')

export const LeadSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome').max(120),
  /** Opcional: o atendimento da Strike é pelo WhatsApp. Vazio = sem e-mail. */
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === '' || z.email().safeParse(v).success, 'E-mail inválido')
    .optional()
    .transform((v) => v || undefined),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => normalizePhoneBR(v) !== undefined, 'Telefone inválido (use DDD + número)'),
  message: z.string().trim().max(2000).optional(),
  consent: z.boolean().optional(),
  fields: FieldsSchema.optional(),
  eventId: EVENT_ID,
  pageUrl: z.string().max(2000),
  /** honeypot — humanos não veem este campo */
  website: z.string().optional(),
})

export type LeadInput = z.infer<typeof LeadSchema>

const CustomSchema = z
  .record(z.string().max(40), z.union([z.string().max(200), z.number(), z.boolean()]))
  .refine((o) => Object.keys(o).length <= 10, 'custom com chaves demais')

export const TrackSchema = z.object({
  event: z.string(),
  eventId: EVENT_ID,
  pageUrl: z.string().max(2000),
  custom: CustomSchema.optional(),
})

const json = (body: unknown, status = 200) => Response.json(body, { status })

async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    return undefined
  }
}

export async function handleLead(req: Request, deps: HandlerDeps): Promise<Response> {
  const { cfg } = deps
  const fetchImpl = deps.fetch ?? fetch
  const now = deps.now ?? Date.now

  if (!originAllowed(req, cfg)) return json({ ok: false, error: 'origem não permitida' }, 403)

  const parsed = LeadSchema.safeParse(await readJson(req))
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? '_')] ??= issue.message
    return json({ ok: false, errors }, 400)
  }
  const input = parsed.data

  // Bot preencheu o honeypot: finge sucesso e não envia nada.
  if (input.website) return json({ ok: true, eventId: input.eventId })

  const sourceUrl = sameSiteUrl(input.pageUrl, req, cfg) ?? cfg.public.siteUrl ?? new URL(req.url).origin
  const attribution = requestAttribution(req, cfg)
  const createdAt = new Date(now()).toISOString()

  const lead: CrmLead = {
    eventId: input.eventId,
    createdAt,
    name: input.name,
    email: input.email?.toLowerCase(),
    phone: input.phone,
    message: input.message || undefined,
    pageUrl: sourceUrl,
    consent: input.consent ?? false,
    fields: nonEmpty(input.fields),
    attribution: buildCrmAttribution(attribution),
  }

  const crm = await withTimeout(sendLeadToCrm(lead, cfg.crm, fetchImpl), 8000, 'crm').catch((e) =>
    failed(e instanceof Error ? e.message : String(e)),
  )
  if (crm.status === 'failed') {
    // O lead não pode sumir: fica no log da Vercel para recuperação manual.
    console.error(`[lead] CRM falhou (${crm.detail}). Lead para recuperação: ${JSON.stringify(lead)}`)
    return json({ ok: false, error: 'Não foi possível enviar agora. Tente novamente em instantes.' }, 502)
  }
  console.info(`[lead] evt=${lead.eventId} crm=${crm.status}${crm.detail ? `(${crm.detail})` : ''}`)

  const ev: ServerEvent = {
    key: 'lead',
    eventId: input.eventId,
    eventTime: Math.floor(now() / 1000),
    user: { email: input.email, phone: input.phone, name: input.name },
    attribution,
    context: { ip: clientIp(req.headers), userAgent: req.headers.get('user-agent') ?? undefined, sourceUrl },
    consentGranted: consentGranted(req, cfg),
  }
  deps.defer(() => dispatchServerEvent(ev, cfg, fetchImpl))

  return json({ ok: true, eventId: input.eventId })
}

function nonEmpty(fields: Record<string, string> | undefined): Record<string, string> | undefined {
  const entries = Object.entries(fields ?? {}).filter(([, v]) => v !== '')
  return entries.length ? Object.fromEntries(entries) : undefined
}

export async function handleTrack(req: Request, deps: HandlerDeps): Promise<Response> {
  const { cfg } = deps
  const fetchImpl = deps.fetch ?? fetch
  const now = deps.now ?? Date.now

  if (!originAllowed(req, cfg)) return new Response(null, { status: 403 })

  const parsed = TrackSchema.safeParse(await readJson(req))
  if (!parsed.success) return json({ ok: false, error: 'payload inválido' }, 400)
  const { event, eventId, pageUrl, custom } = parsed.data

  if (!isEventKey(event) || !EVENTS[event].publicServer)
    return json({ ok: false, error: `evento "${event}" não aceito neste endpoint` }, 400)
  if (event === 'page_view' && !cfg.public.serverPageview) return new Response(null, { status: 204 })

  const sourceUrl = sameSiteUrl(pageUrl, req, cfg)
  if (!sourceUrl) return json({ ok: false, error: 'pageUrl fora do domínio do site' }, 400)

  const ev: ServerEvent = {
    key: event,
    eventId,
    eventTime: Math.floor(now() / 1000),
    user: {},
    attribution: requestAttribution(req, cfg),
    context: { ip: clientIp(req.headers), userAgent: req.headers.get('user-agent') ?? undefined, sourceUrl },
    consentGranted: consentGranted(req, cfg),
    custom,
  }
  deps.defer(() => dispatchServerEvent(ev, cfg, fetchImpl))
  return new Response(null, { status: 204 })
}
