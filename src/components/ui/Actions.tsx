'use client'
/**
 * Todo link que é conversão passa por aqui — nenhum componente monta wa.me ou o
 * link do Eleven Tickets na mão, senão o clique sai sem tracking.
 */
import { ArrowUpRight, Navigation, Phone } from 'lucide-react'
import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import { SITE, WHATSAPP_TEXT, whatsappHref, type WhatsAppContext } from '@/content/site'
import { cookieReaderFromHeader, readAttribution } from '@/lib/tracking/attribution'
import { decorateOutboundUrl } from '@/lib/tracking/outbound'
import { publicConfig } from '@/lib/tracking/public-config'
import { WhatsAppIcon } from './BrandIcons'
import { getConsent, trackEvent } from '../tracking/track'

type Variant = 'primary' | 'secondary' | 'ghost' | 'ghost-dark' | 'dark' | 'whatsapp'

interface Common {
  /** Identifica o botão nos relatórios (ex.: "hero", "pacote-festa"). */
  id: string
  variant?: Variant
  size?: 'md' | 'lg' | 'sm'
  className?: string
  children?: ReactNode
}

const cls = (variant: Variant, size: string, extra?: string) =>
  ['btn', `btn--${variant}`, `btn--${size}`, extra].filter(Boolean).join(' ')

function reservationHref(): string {
  const adsAllowed = publicConfig.consentMode !== 'banner' || getConsent() === 'granted'
  const attribution = readAttribution(cookieReaderFromHeader(document.cookie))
  return decorateOutboundUrl(SITE.reservationUrl, attribution, { now: Date.now(), adsAllowed })
}

/** "Reservar" → Eleven Tickets, com a origem da visita na URL. */
export function ReserveButton({ id, variant = 'primary', size = 'md', className, children }: Common) {
  const [href, setHref] = useState<string>(SITE.reservationUrl)
  useEffect(() => setHref(reservationHref()), [])

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    // Lê os cookies de novo no clique: a pessoa pode ter aceitado cookies depois.
    e.currentTarget.href = reservationHref()
    trackEvent('reservation_click', { button: id, page: window.location.pathname })
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={cls(variant, size, className)}
      onClick={onClick}
      // Clique do meio (abrir em nova aba) também conta; botão direito não.
      onAuxClick={(e) => e.button === 1 && onClick(e)}
      data-track="reservation"
      data-magnetic
    >
      <span>{children ?? 'Reservar pista'}</span>
      <ArrowUpRight size={size === 'lg' ? 22 : 18} aria-hidden="true" />
    </a>
  )
}

export function WhatsAppButton({
  id,
  context = 'default',
  text,
  variant = 'whatsapp',
  size = 'md',
  className,
  children,
}: Common & { context?: WhatsAppContext; text?: string }) {
  const href = whatsappHref(text ?? WHATSAPP_TEXT[context])
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cls(variant, size, className)}
      onClick={() => trackEvent('contact', { method: 'whatsapp', button: id, page: window.location.pathname })}
      data-track="whatsapp"
      data-magnetic
    >
      <WhatsAppIcon size={size === 'lg' ? 22 : 18} />
      <span>{children ?? 'Chamar no WhatsApp'}</span>
    </a>
  )
}

export function PhoneLink({ id, className }: { id: string; className?: string }) {
  return (
    <a
      href={`tel:+${SITE.whatsapp}`}
      className={className ?? 'link-inline'}
      onClick={() => trackEvent('contact', { method: 'phone', button: id, page: window.location.pathname })}
    >
      <Phone size={16} aria-hidden="true" /> {SITE.phoneDisplay}
    </a>
  )
}

export function DirectionsButton({ id, variant = 'secondary', size = 'md', className }: Common) {
  return (
    <a
      href={SITE.mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cls(variant, size, className)}
      onClick={() => trackEvent('directions_click', { button: id, page: window.location.pathname })}
    >
      <Navigation size={18} aria-hidden="true" />
      <span>Como chegar</span>
    </a>
  )
}
