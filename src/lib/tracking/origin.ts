/**
 * Origem da visita (Google x Meta x outras) para a mensagem pronta do WhatsApp.
 * Se a pessoa não preencher o formulário, a primeira frase da conversa mostra
 * de onde ela veio.
 */
import type { Attribution } from './attribution'

export type VisitOrigin = 'google' | 'meta' | 'site'

const META_SOURCES = /^(facebook|fb|instagram|ig|meta)/i
const GOOGLE_SOURCES = /^google/i

export function visitOrigin(a: Attribution): VisitOrigin {
  const src = a.lastTouch?.utm_source ?? a.firstTouch?.utm_source ?? ''
  if (a.gclid || a.gbraid || a.wbraid || GOOGLE_SOURCES.test(src)) return 'google'
  if (a.fbc || META_SOURCES.test(src)) return 'meta'
  return 'site'
}

const LABEL: Record<VisitOrigin, string> = {
  google: 'pelo Google',
  meta: 'pelo Instagram/Facebook',
  site: 'pelo site',
}

/** "Oi! Vim pelo site e quero…" → "Oi! Vim pelo Google e quero…". */
export function textForOrigin(text: string, origin: VisitOrigin): string {
  return text.replace(/Vim pelo site/, `Vim ${LABEL[origin]}`)
}
