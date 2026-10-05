import { buildInitScript, gtmNoscriptSrc } from '@/lib/tracking/snippets'
import { publicConfig } from '@/lib/tracking/public-config'

/**
 * Vai no <head> do layout raiz. É um <script> inline renderizado no HTML do
 * servidor, então roda antes da hidratação: fbq/gtag/dataLayer já existem quando
 * o primeiro componente dispara um evento.
 */
export function TrackingHead() {
  return <script id="trk-init" dangerouslySetInnerHTML={{ __html: buildInitScript(publicConfig) }} />
}

/** Vai logo no início do <body> (só renderiza no modo gtm). */
export function GtmNoscript() {
  const src = gtmNoscriptSrc(publicConfig)
  if (!src) return null
  return (
    <noscript>
      <iframe src={src} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} />
    </noscript>
  )
}
