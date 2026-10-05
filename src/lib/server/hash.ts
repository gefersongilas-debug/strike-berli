/**
 * SHA-256 de dados pessoais já normalizados. Nunca envie dado pessoal cru para
 * as plataformas — só o hash sai do servidor.
 */
import { createHash } from 'node:crypto'

export { normalizeEmail, normalizeName, normalizePhoneBR, splitName, toE164 } from '@/lib/tracking/normalize'

export function sha256(value: string | undefined): string | undefined {
  if (!value) return undefined
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

export function hashedArray(v: string | undefined): string[] | undefined {
  const h = sha256(v)
  return h ? [h] : undefined
}
