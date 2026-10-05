import { Glasses, Swords, Ticket } from 'lucide-react'
import type { Metadata } from 'next'
import { CtaBand, FaqSection, SectionHead, Visit } from '@/components/sections/Blocks'
import { ReserveButton, WhatsAppButton } from '@/components/ui/Actions'
import { VrArt } from '@/components/ui/Illustrations'
import { FAQ_VR } from '@/content/faq'

export const metadata: Metadata = {
  title: 'Realidade virtual em São Leopoldo',
  description:
    'Realidade virtual no Strike Berlin, no Centro de São Leopoldo: partida para dois jogadores, junto com boliche, fliperama, sinuca e gastrobar. Todo pacote inclui uma partida.',
  alternates: { canonical: '/realidade-virtual' },
}

const STEPS = [
  { icon: Glasses, title: 'Coloca o óculos', text: 'Coloca o óculos e o salão some: você está dentro do jogo.' },
  { icon: Swords, title: 'Joga a dois', text: 'A partida é para 2 jogadores: dá pra disputar com quem veio junto.' },
  { icon: Ticket, title: 'Já vem no pacote', text: 'Todo pacote de boliche traz 1 partida de realidade virtual para dois.' },
]

export default function RealidadeVirtual() {
  return (
    <>
      <section className="vr-hero">
        <div className="container vr-hero__grid">
          <div>
            <p className="eyebrow" data-hero>
              Realidade virtual
            </p>
            <h1 className="page-hero__title" data-hero="title">
              Sai da pista e cai <span className="accent">dentro do jogo.</span>
            </h1>
            <p className="page-hero__lead" data-hero>
              No Strike a noite não acaba no boliche: coloca o óculos de realidade virtual e joga uma partida para dois.
              Depois volta pra pista, pro fliperama ou pro chopp.
            </p>
            <div className="btn-row" data-hero>
              <ReserveButton id="vr-hero" size="lg" />
              <WhatsAppButton id="vr-hero" size="lg" variant="ghost" context="vr">
                Tirar dúvida
              </WhatsAppButton>
            </div>
          </div>
          <div className="vr-hero__art" data-hero>
            <div className="vr-hero__float">
              <VrArt />
            </div>
          </div>
        </div>
      </section>

      <section className="section section--cream" aria-labelledby="vr-how">
        <div className="container">
          <SectionHead dark eyebrow="Como funciona" title="Três passos, zero tutorial." />
          <ol className="why why--three" data-stagger>
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="why__item">
                <span className="why__icon">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <span className="why__num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <FaqSection items={FAQ_VR} title="Antes de colocar o óculos." id="faq-vr" />
      <Visit />
      <CtaBand title="Pista, óculos e chopp. Bora?" context="vr" />
    </>
  )
}
