/**
 * Quem já preencheu o formulário do WhatsApp (localStorage 'strike_wa_lead').
 * Só vai direto ao WhatsApp se voltar pela mesma origem em até 30 dias; origem
 * nova mostra o formulário de novo, para o CRM receber a origem nova.
 */
import type { VisitOrigin } from './origin'

const TTL_MS = 30 * 24 * 60 * 60 * 1000

export interface Saved {
  name: string
  phone: string
  ts: number
  /** ausente nos valores gravados antes de a origem ser guardada */
  origin?: VisitOrigin
}

export function parseSaved(raw: string | null): Saved | undefined {
  try {
    const v = JSON.parse(raw ?? 'null') as Partial<Saved> | null
    if (!v || typeof v.ts !== 'number') return undefined
    return {
      name: typeof v.name === 'string' ? v.name : '',
      phone: typeof v.phone === 'string' ? v.phone : '',
      ts: v.ts,
      origin: v.origin,
    }
  } catch {
    return undefined
  }
}

export function skipsForm(saved: Saved | undefined, origin: VisitOrigin, now: number): boolean {
  return !!saved && now - saved.ts < TTL_MS && saved.origin === origin
}
