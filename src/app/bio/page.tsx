import Image from 'next/image'
import type { Metadata } from 'next'
import { DirectionsButton, ReserveButton, WhatsAppButton } from '@/components/ui/Actions'
import { BioLink } from '@/components/ui/BioLink'
import { SITE } from '@/content/site'

/** Página do link da bio do Instagram. Fora do Google (noindex) e do sitemap. */
export const metadata: Metadata = {
  title: 'Links',
  description: 'Reserve sua pista, peça combo de aniversário ou confraternização e fale com o Strike Berlin.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/bio' },
}

export default function Bio() {
  return (
    <section className="bio" aria-labelledby="bio-title">
      <div className="bio__card">
        <Image src="/img/logo-strike.png" alt={SITE.name} width={160} height={160} priority className="bio__logo" />
        <h1 id="bio-title" className="bio__title">
          {SITE.name}
        </h1>
        <p className="bio__lead">Boliche, realidade virtual e gastrobar em {SITE.city}.</p>

        <div className="bio__actions">
          <ReserveButton id="bio-reservar" size="lg" className="bio__btn">
            Reservar pista
          </ReserveButton>
          <WhatsAppButton id="bio-whatsapp" size="lg" className="bio__btn">
            Falar no WhatsApp
          </WhatsAppButton>
        </div>

        <nav className="bio__links" aria-label="Mais opções">
          <BioLink id="aniversario" href="/aniversario" title="Aniversário" hint="Combo Aniversário e Combo Festa" />
          <BioLink id="empresas" href="/empresas" title="Confraternização de empresa" hint="Proposta com nota fiscal" />
          <BioLink id="pacotes" href="/pacotes" title="Pacotes e preços" />
          <BioLink id="realidade-virtual" href="/realidade-virtual" title="Realidade virtual" />
        </nav>

        <DirectionsButton id="bio-como-chegar" variant="ghost" className="bio__btn" />
        <p className="bio__fine">
          {SITE.address.street}, {SITE.address.district} · {SITE.address.city}/{SITE.address.state}
        </p>
      </div>
    </section>
  )
}
