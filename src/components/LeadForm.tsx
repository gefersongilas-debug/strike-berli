'use client'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { newEventId } from '@/lib/tracking/client'
import { trackLeadInBrowser } from './tracking/track'

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'message' | 'fields' | '_', string>>

const FIELD_PREFIX = 'fields.'

export const EVENT_TYPES = [
  'Aniversário infantil',
  'Aniversário adulto',
  'Confraternização de empresa',
  'Happy hour / turma de amigos',
  'Programa em família',
  'Outro',
] as const

const PEOPLE = ['Até 10', '11 a 20', '21 a 40', '41 a 80', 'Mais de 80']

const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

/** Chave sob a qual o resumo do pedido passa para a página /obrigado (fica só nesta aba). */
export const LEAD_SUMMARY_KEY = 'strike_lead_summary'

/** Todo input `name="fields.<chave>"` vira fields[chave] — é assim que perguntas extras chegam ao CRM. */
function extraFields(form: FormData): Record<string, string> | undefined {
  const out: Record<string, string> = {}
  for (const [name, value] of form.entries()) {
    if (!name.startsWith(FIELD_PREFIX) || typeof value !== 'string' || !value.trim()) continue
    out[name.slice(FIELD_PREFIX.length)] = value.trim()
  }
  // Dia da semana sai da data: é o que separa a oferta de segunda a quinta no CRM.
  if (out.data && /^\d{4}-\d{2}-\d{2}$/.test(out.data)) {
    const [y, m, d] = out.data.split('-').map(Number)
    out.dia_semana = WEEKDAYS[new Date(y, m - 1, d).getDay()]
  }
  return Object.keys(out).length ? out : undefined
}

function todayISO(): string {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

/**
 * Pedido de proposta (aniversário, empresa, grupo).
 * 1. gera o event_id no browser
 * 2. POST /api/lead → CRM + CAPI + GA4 MP + Google Ads API (mesmo event_id)
 * 3. se deu certo, dispara o Lead no browser com o mesmo id e vai para /obrigado,
 *    que oferece continuar a conversa no WhatsApp com o resumo do pedido
 */
export function LeadForm({
  defaultType,
  page,
  submitLabel = 'Pedir proposta',
  redirectTo = '/obrigado',
}: {
  defaultType?: (typeof EVENT_TYPES)[number]
  /** Vai para o CRM em fields.pagina (ex.: "aniversario"). */
  page: string
  submitLabel?: string
  redirectTo?: string
}) {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (sending) return
    const form = new FormData(e.currentTarget)
    const eventId = newEventId()
    const fields = extraFields(form)
    const data = {
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      phone: String(form.get('phone') ?? ''),
      message: String(form.get('message') ?? '') || undefined,
      consent: form.get('consent') === 'on',
      fields,
      website: String(form.get('website') ?? ''),
      eventId,
      pageUrl: window.location.href,
    }

    setSending(true)
    setErrors({})
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; errors?: Errors; error?: string }
      if (!res.ok || !json.ok) {
        setErrors(json.errors ?? { _: json.error ?? 'Não foi possível enviar. Tente novamente.' })
        return
      }
      trackLeadInBrowser(eventId, { email: data.email, phone: data.phone })
      try {
        sessionStorage.setItem(
          LEAD_SUMMARY_KEY,
          JSON.stringify({ name: data.name.split(' ')[0], tipo: fields?.tipo, data: fields?.data, pessoas: fields?.pessoas }),
        )
      } catch {
        // aba anônima sem storage: a página de obrigado mostra a versão genérica
      }
      router.push(redirectTo)
    } catch {
      setErrors({ _: 'Sem conexão. Tente novamente.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="lead-form" data-testid="lead-form">
      <div className="lead-form__row">
        <label className="field">
          <span>Nome</span>
          <input name="name" autoComplete="name" required placeholder="Como podemos te chamar?" />
          {errors.name && <span className="field__error">{errors.name}</span>}
        </label>
        <label className="field">
          <span>WhatsApp</span>
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(51) 99999-9999" required />
          {errors.phone && <span className="field__error">{errors.phone}</span>}
        </label>
      </div>
      <div className="lead-form__row">
        <label className="field">
          <span>Tipo de evento</span>
          <select name="fields.tipo" defaultValue={defaultType ?? ''}>
            <option value="" disabled>
              Escolha
            </option>
            {EVENT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Quantas pessoas</span>
          <select name="fields.pessoas" defaultValue="">
            <option value="" disabled>
              Mais ou menos
            </option>
            {PEOPLE.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="lead-form__row">
        <label className="field">
          <span>Data que você pensou</span>
          <input name="fields.data" type="date" min={todayISO()} />
        </label>
        <label className="field">
          <span>
            E-mail <em>(opcional)</em>
          </span>
          <input name="email" type="email" autoComplete="email" placeholder="voce@email.com" />
          {errors.email && <span className="field__error">{errors.email}</span>}
        </label>
      </div>
      <label className="field">
        <span>
          Conta mais <em>(opcional)</em>
        </span>
        <textarea name="message" rows={3} placeholder="Ex.: aniversário de 8 anos, queremos o Combo Festa num sábado à tarde" />
      </label>
      <input type="hidden" name="fields.pagina" value={page} />
      {/* honeypot: escondido de humanos */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
      <label className="check">
        <input name="consent" type="checkbox" /> <span>Aceito receber novidades e promoções da Strike Berlin.</span>
      </label>
      {errors.fields && <p className="field__error">{errors.fields}</p>}
      {errors._ && (
        <p className="field__error field__error--box" role="alert">
          {errors._}
        </p>
      )}
      <button type="submit" className="btn btn--primary btn--lg lead-form__submit" disabled={sending}>
        <span>{sending ? 'Enviando…' : submitLabel}</span>
        <ArrowRight size={20} aria-hidden="true" />
      </button>
      <p className="lead-form__fine">
        A gente responde pelo WhatsApp. Seus dados ficam só com a Strike Berlin — veja a{' '}
        <a href="/privacidade">política de privacidade</a>.
      </p>
    </form>
  )
}
