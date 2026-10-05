import type { Attribution } from '@/lib/tracking/attribution'
import type { EventKey } from '@/lib/tracking/events'

/** Dados pessoais crus — só existem dentro do servidor e são hasheados antes de sair. */
export interface UserInput {
  email?: string
  phone?: string
  name?: string
  city?: string
  state?: string
  zip?: string
}

export interface RequestContext {
  ip?: string
  userAgent?: string
  /** URL da página onde o evento aconteceu. */
  sourceUrl: string
}

export interface ServerEvent {
  key: EventKey
  /** Mesmo id do disparo no browser — é o que deduplica na Meta. */
  eventId: string
  /** epoch em segundos */
  eventTime: number
  user: UserInput
  attribution: Attribution
  context: RequestContext
  consentGranted: boolean
  custom?: Record<string, string | number | boolean | undefined>
}

export type DestinationStatus = 'sent' | 'skipped' | 'failed'

export interface DestinationResult {
  status: DestinationStatus
  /** Motivo curto — nunca contém token nem dado pessoal. */
  detail?: string
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

export const sent = (detail?: string): DestinationResult => ({ status: 'sent', detail })
export const skipped = (detail: string): DestinationResult => ({ status: 'skipped', detail })
export const failed = (detail: string): DestinationResult => ({ status: 'failed', detail })

/** Lê o corpo de erro sem estourar e sem vazar nada além da mensagem da API. */
export async function errorDetail(res: Response): Promise<string> {
  let text = ''
  try {
    text = await res.text()
  } catch {
    /* ignora */
  }
  return `HTTP ${res.status} ${text.slice(0, 300)}`.trim()
}

export async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}: timeout ${ms}ms`)), ms)
  })
  try {
    return await Promise.race([p, timeout])
  } finally {
    clearTimeout(timer)
  }
}
