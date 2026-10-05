import type { Metadata } from 'next'
import { CtaBand, FaqSection, LeadSection, PageHero, SectionHead } from '@/components/sections/Blocks'
import { Packages } from '@/components/sections/Packages'
import { FAQ_GERAL } from '@/content/faq'

export const metadata: Metadata = {
  title: 'Pacotes de boliche e preços',
  description:
    'Pacotes de boliche do Strike Berlin com fritas, chopp, hambúrguer ou salgados e uma partida de realidade virtual. De segunda a quinta a partir de R$ 169.',
  alternates: { canonical: '/pacotes' },
}

export default function Pacotes() {
  return (
    <>
      <PageHero
        eyebrow="Pacotes e preços"
        title="Pista, petisco e chopp."
        accent="Já resolvido."
        lead="Quatro pacotes, do casal à festa inteira. Todos com uma partida de realidade virtual para dois — e de segunda a quinta sai mais em conta."
        photo={{ src: '/img/bolas-coloridas.jpg', alt: 'Bolas de boliche coloridas no retorno da pista' }}
        context="pacotes"
      />
      <section className="section section--night" aria-labelledby="pk-title">
        <div className="container">
          <SectionHead eyebrow="Escolha o dia" title="O preço muda com o dia da visita." lead="Toque no dia para ver o valor de cada pacote." />
          <Packages />
        </div>
      </section>
      <LeadSection page="pacotes" title="Grupo grande? A gente ajusta o pacote." />
      <FaqSection items={FAQ_GERAL} id="faq-pacotes" />
      <CtaBand context="pacotes" />
    </>
  )
}
