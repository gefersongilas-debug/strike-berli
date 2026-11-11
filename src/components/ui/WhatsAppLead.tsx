'use client'
/**
 * Formulário curto (nome + telefone) antes de abrir o WhatsApp.
 *
 * Ao enviar: o lead vai para /api/lead (Kommo + cópia de segurança, com as UTMs
 * e click ids lidos dos cookies pelo servidor) e a pessoa é levada ao WhatsApp
 * com a mensagem pronta já marcada pela origem (Google/Instagram). Se ela não
 * chamar, o lead já existe no CRM para o time abordar.
 * Quem já preencheu nos últimos 30 dias vai direto ao WhatsApp.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { whatsappHref } from '@/content/site'
import { cookieReaderFromHeader, readAttribution } from '@/lib/tracking/attribution'
import { normalizePhoneBR } from '@/lib/tracking/normalize'
import { textForOrigin, visitOrigin } from '@/lib/tracking/origin'
import { newEventId } from '@/lib/tracking/client'
import { trackEvent, trackLeadInBrowser } from '../tracking/track'

export interface WhatsAppRequest {
  /** id do botão (relatórios) */
  button: string
  /** mensagem pronta, no formato "Oi! Vim pelo site e …" */
  text: string
}

const STORE = 'strike_wa_lead'
const TTL_MS = 30 * 24 * 60 * 60 * 1000

interface Saved {
  name: string
  phone: string
  ts: number
}

function readSaved(): Saved | undefined {
  try {
    const v = JSON.parse(localStorage.getItem(STORE) ?? 'null') as Saved | null
    return v && typeof v.ts === 'number' ? v : undefined
  } catch {
    return undefined
  }
}
function writeSaved(v: Saved) {
  try {
    localStorage.setItem(STORE, JSON.stringify(v))
  } catch {
    /* sem storage: pede de novo no próximo clique */
  }
}

const Ctx = createContext<((req: WhatsAppRequest) => void) | null>(null)

/** null fora do Provider: o botão cai no link direto (comportamento antigo). */
export const useWhatsAppLead = () => useContext(Ctx)

function goToWhatsApp(text: string) {
  const origin = visitOrigin(readAttribution(cookieReaderFromHeader(document.cookie)))
  const href = whatsappHref(textForOrigin(text, origin))
  const w = window.open(href, '_blank', 'noopener,noreferrer')
  if (!w) window.location.assign(href)
}

export function WhatsAppLeadProvider({ children }: { children: ReactNode }) {
  const [req, setReq] = useState<WhatsAppRequest | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})
  const nameRef = useRef<HTMLInputElement>(null)

  const open = useCallback((r: WhatsAppRequest) => {
    trackEvent('contact', { method: 'whatsapp', button: r.button, page: window.location.pathname })
    const saved = readSaved()
    if (saved && Date.now() - saved.ts < TTL_MS) {
      goToWhatsApp(r.text)
      return
    }
    setErrors({})
    setReq(r)
  }, [])

  useEffect(() => {
    if (!req) return
    nameRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setReq(null)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [req])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!req) return
    const next: typeof errors = {}
    if (name.trim().length < 2) next.name = 'Informe seu nome'
    if (!normalizePhoneBR(phone)) next.phone = 'Telefone inválido (use DDD + número)'
    setErrors(next)
    if (next.name || next.phone) return

    const origin = visitOrigin(readAttribution(cookieReaderFromHeader(document.cookie)))
    const text = textForOrigin(req.text, origin)
    const eventId = newEventId()
    // keepalive: a requisição termina mesmo com a navegação para o WhatsApp.
    // O servidor lê UTMs e click ids dos cookies da própria requisição.
    void fetch('/api/lead', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        phone,
        message: text,
        eventId,
        pageUrl: window.location.href,
        website,
        consent: true,
        fields: { origem: origin, botao: req.button.replace(/[^a-z0-9_-]/gi, '_').slice(0, 60) },
      }),
    }).catch(() => undefined)
    trackLeadInBrowser(eventId, { phone })
    writeSaved({ name: name.trim(), phone, ts: Date.now() })
    setReq(null)
    // Aberto dentro do clique: o navegador não bloqueia como pop-up.
    const href = whatsappHref(text)
    const w = window.open(href, '_blank', 'noopener,noreferrer')
    if (!w) window.location.assign(href)
  }

  return (
    <Ctx.Provider value={open}>
      {children}
      {req && (
        <div className="wa-modal" role="presentation" onClick={(e) => e.target === e.currentTarget && setReq(null)}>
          <form className="wa-modal__card" role="dialog" aria-modal="true" aria-labelledby="wa-modal-title" onSubmit={onSubmit} noValidate>
            <h2 id="wa-modal-title">Falar no WhatsApp</h2>
            <p className="wa-modal__lead">Deixe seu nome e telefone e já abrimos a conversa com a Strike.</p>
            <label>
              Nome
              <input ref={nameRef} name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              {errors.name && <span className="wa-modal__err">{errors.name}</span>}
            </label>
            <label>
              Telefone (com DDD)
              <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(51) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} />
              {errors.phone && <span className="wa-modal__err">{errors.phone}</span>}
            </label>
            <input className="wa-modal__hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} />
            <button type="submit" className="btn btn--whatsapp btn--lg">Continuar no WhatsApp</button>
            <button type="button" className="wa-modal__close" onClick={() => setReq(null)}>Cancelar</button>
            <p className="wa-modal__fine">Usamos seus dados só para atender sua reserva.</p>
          </form>
        </div>
      )}
    </Ctx.Provider>
  )
}
