'use client'
/**
 * Link interno da página /bio. As UTMs (instagram / bio / link-bio) já estão nos
 * cookies de atribuição desde a entrada na página (src/proxy.ts), então os
 * formulários e o WhatsApp seguintes herdam a origem; aqui só contamos o clique.
 */
import Link from 'next/link'
import type { ReactNode } from 'react'
import { trackEvent } from '../tracking/track'

export function BioLink({ id, href, title, hint }: { id: string; href: string; title: string; hint?: ReactNode }) {
  return (
    <Link
      href={href}
      className="bio__link"
      onClick={() => trackEvent('link_bio_click', { link_tipo: id, page: '/bio' })}
    >
      <strong>{title}</strong>
      {hint && <span>{hint}</span>}
    </Link>
  )
}
