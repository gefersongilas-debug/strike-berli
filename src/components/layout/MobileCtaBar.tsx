'use client'
import { useEffect, useState } from 'react'
import { ReserveButton, WhatsAppButton } from '@/components/ui/Actions'

/** Barra fixa no celular com as duas conversões. Aparece depois do topo da página. */
export function MobileCtaBar() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const nearEnd = window.innerHeight + window.scrollY > document.body.scrollHeight - 140
      setShow(window.scrollY > window.innerHeight * 0.7 && !nearEnd)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={`mobile-cta${show ? ' is-on' : ''}`} aria-hidden={!show} inert={!show}>
      <ReserveButton id="barra-mobile" size="md">
        Reservar
      </ReserveButton>
      <WhatsAppButton id="barra-mobile" size="md" variant="whatsapp">
        WhatsApp
      </WhatsAppButton>
    </div>
  )
}
