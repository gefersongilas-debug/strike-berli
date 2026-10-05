/** Extrai do request o que as plataformas precisam (IP, UA, cookies, consentimento). */
import type { ServerConfig } from '@/lib/config'
import { cookieReaderFromHeader, readAttribution, type Attribution } from '@/lib/tracking/attribution'
import { COOKIES } from '@/lib/tracking/cookies'

export function clientIp(headers: Headers): string | undefined {
  const xff = headers.get('x-forwarded-for')
  const ip = xff?.split(',')[0]?.trim() || headers.get('x-real-ip')?.trim()
  return ip || undefined
}

export function requestAttribution(req: Request, cfg: ServerConfig): Attribution {
  return readAttribution(cookieReaderFromHeader(req.headers.get('cookie')), cfg.public.ga4Id)
}

export function consentGranted(req: Request, cfg: ServerConfig): boolean {
  if (cfg.public.consentMode === 'off') return true
  return cookieReaderFromHeader(req.headers.get('cookie'))(COOKIES.consent) === 'granted'
}

/**
 * Garante que a URL do evento é do próprio site (evita que terceiros usem o
 * endpoint para injetar eventos de outro domínio no seu pixel).
 */
export function sameSiteUrl(candidate: string | undefined, req: Request, cfg: ServerConfig): string | null {
  const bare = (host: string) => host.replace(/^www\./, '')
  const allowedHost = bare(cfg.public.siteUrl ? new URL(cfg.public.siteUrl).host : new URL(req.url).host)
  try {
    const u = new URL(candidate ?? '')
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    const ok = bare(u.host) === allowedHost || (!cfg.isProduction && u.host === new URL(req.url).host)
    return ok ? u.toString() : null
  } catch {
    return null
  }
}

export function originAllowed(req: Request, cfg: ServerConfig): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true // sendBeacon de mesma origem pode vir sem Origin em alguns browsers
  return sameSiteUrl(origin, req, cfg) !== null
}
