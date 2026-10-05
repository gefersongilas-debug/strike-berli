import { Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Marquee } from '@/components/motion/Marquee'
import { StrikeScene } from '@/components/motion/StrikeScene'
import { Attractions } from '@/components/sections/Attractions'
import { CtaBand, EventTypes, FaqSection, Gallery, LeadSection, Proof, SectionHead, Visit } from '@/components/sections/Blocks'
import { HowToBook } from '@/components/sections/HowToBook'
import { Packages } from '@/components/sections/Packages'
import { ReserveButton, WhatsAppButton } from '@/components/ui/Actions'
import { UntilDate } from '@/components/ui/UntilDate'
import { FAQ_GERAL } from '@/content/faq'
import { SEASON } from '@/content/offers'
import { SITE } from '@/content/site'

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero__media">
          <div className="hero__img" data-parallax="0.12">
            <Image src="/img/pistas-neon.jpg" alt="Pistas de boliche iluminadas em neon azul no Strike Berlin" fill priority sizes="100vw" />
          </div>
          <div className="hero__shade" />
          <div className="hero__grid-lines" aria-hidden="true" />
        </div>

        <div className="container hero__inner">
          <UntilDate end={SEASON.diaDasCriancas.until}>
            <Link href="/dia-das-criancas" className="season-pill">
              <span className="season-pill__dot" /> Dia das Crianças no Strike: tem doce extra <span aria-hidden="true">→</span>
            </Link>
          </UntilDate>
          <UntilDate from={SEASON.halloween.from} end={SEASON.halloween.until}>
            <Link href="/halloween" className="season-pill season-pill--halloween">
              <span className="season-pill__dot" /> Halloween no Strike · 30 e 31/10 <span aria-hidden="true">→</span>
            </Link>
          </UntilDate>
          <p className="eyebrow" data-hero>
            Boliche em São Leopoldo · Centro
          </p>
          <h1 className="hero__title" data-hero="title">
            Tudo num só{' '}
            <span className="accent accent--sweep" data-strike-word>
              strike.
            </span>
          </h1>
          <p className="hero__lead" data-hero>
            Boliche com telão interativo, realidade virtual, fliperama, sinuca, karaokê e gastrobar com chopp gelado. Pra
            família, pros amigos e pra firma.
          </p>
          <div className="btn-row" data-hero>
            <ReserveButton id="hero" size="lg">
              Reservar minha pista
            </ReserveButton>
            <WhatsAppButton id="hero" size="lg" variant="ghost" />
          </div>
          <ul className="hero__proof" data-hero>
            <li>
              <span className="hero__stars" aria-hidden="true">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={14} />
                ))}
              </span>
              <span>
                <strong>{SITE.rating.value.toLocaleString('pt-BR')}</strong> no Google · +{SITE.rating.count.toLocaleString('pt-BR')} avaliações
              </span>
            </li>
            <li>4 pistas profissionais</li>
            <li>Climatizado e acessível</li>
          </ul>
          <div className="hero__polaroids" aria-hidden="true">
            <div className="polaroid-wrap polaroid--a" data-hero data-parallax="0.25">
              <figure className="polaroid">
              <Image src="/img/coracao-neon.jpg" alt="" width={480} height={854} sizes="220px" />
              <figcaption>Foto da festa</figcaption>
              </figure>
            </div>
            <div className="polaroid-wrap polaroid--b" data-hero data-parallax="0.45">
              <figure className="polaroid">
              <Image src="/img/bolas-coloridas.jpg" alt="" width={720} height={1280} sizes="240px" />
              <figcaption>Escolhe a sua</figcaption>
              </figure>
            </div>
            <div className="polaroid-wrap polaroid--c" data-hero data-parallax="0.15">
              <figure className="polaroid">
              <Image src="/img/pelucias.jpg" alt="" width={720} height={1280} sizes="200px" />
              <figcaption>Máquina de pelúcia</figcaption>
              </figure>
            </div>
          </div>
        </div>

        <StrikeScene />
      </section>

      <Marquee items={['Boliche', 'Realidade virtual', 'Fliperama', 'Sinuca', 'Karaokê', 'Gastrobar', 'Chopp gelado']} />

      <Attractions />

      <EventTypes />

      <HowToBook />

      <section className="section section--night" id="pacotes" aria-labelledby="pacotes-home-title">
        <div className="container">
          <SectionHead
            eyebrow="Pacotes"
            title="Escolha o dia. O preço acompanha."
            lead="Todo pacote já vem com uma partida de realidade virtual para dois. De segunda a quinta sai mais em conta."
          />
          <Packages />
        </div>
      </section>

      <Proof />

      <Gallery />

      <LeadSection page="home" />

      <FaqSection items={FAQ_GERAL} />

      <Visit />

      <CtaBand />
    </>
  )
}
