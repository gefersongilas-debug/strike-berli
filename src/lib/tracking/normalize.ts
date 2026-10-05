/**
 * Normalização de dados pessoais no formato que Meta e Google exigem antes do hash.
 * Sem dependência de Node — também roda no browser (enhanced conversions do gtag).
 */

export function normalizeEmail(v: string | undefined): string | undefined {
  const t = v?.trim().toLowerCase()
  return t && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? t : undefined
}

/**
 * Telefone brasileiro → só dígitos com DDI 55 (formato da Meta: "5511999998888").
 * Aceita "(11) 99999-8888", "011 99999-8888", "+55 11 99999-8888".
 */
export function normalizePhoneBR(v: string | undefined): string | undefined {
  if (!v) return undefined
  let d = v.replace(/\D/g, '').replace(/^0+/, '')
  if (d.length === 10 || d.length === 11) d = `55${d}`
  if (!d.startsWith('55') || (d.length !== 12 && d.length !== 13)) return undefined
  return d
}

/** E.164 com "+" — formato do Google (Ads e GA4). */
export function toE164(normalizedDigits: string | undefined): string | undefined {
  return normalizedDigits ? `+${normalizedDigits}` : undefined
}

export function normalizeName(v: string | undefined): string | undefined {
  const t = v
    ?.trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\s'-]/gu, '')
  return t || undefined
}

export function splitName(full: string | undefined): { first?: string; last?: string } {
  const n = normalizeName(full)
  if (!n) return {}
  const [first, ...rest] = n.split(' ')
  return { first, last: rest.length ? rest[rest.length - 1] : undefined }
}
