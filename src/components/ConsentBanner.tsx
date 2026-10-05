'use client'
import { useEffect, useState } from 'react'
import { publicConfig } from '@/lib/tracking/public-config'
import { getConsent, setConsent } from './tracking/track'

/** Só aparece com NEXT_PUBLIC_CONSENT_MODE=banner e enquanto a pessoa não escolheu. */
export function ConsentBanner() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (publicConfig.consentMode === 'banner' && !getConsent()) setOpen(true)
  }, [])

  if (!open) return null
  const choose = (v: 'granted' | 'denied') => {
    setConsent(v)
    setOpen(false)
  }
  return (
    <div role="dialog" aria-label="Cookies" className="consent">
      <p>
        Usamos cookies para medir resultados e melhorar anúncios. Você pode aceitar ou recusar os cookies de
        marketing. <a href="/privacidade">Saiba mais</a>.
      </p>
      <div className="consent-actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => choose('denied')}>
          Recusar
        </button>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => choose('granted')}>
          Aceitar
        </button>
      </div>
    </div>
  )
}
