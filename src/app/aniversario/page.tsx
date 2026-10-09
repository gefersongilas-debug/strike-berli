import { Baby, Cake, Gamepad2, Glasses, Sparkles, Utensils } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { CtaBand, FaqSection, WhatsAppSection, PageHero, SectionHead, Visit } from '@/components/sections/Blocks'
import { Packages } from '@/components/sections/Packages'
import { ReserveButton, WhatsAppButton } from '@/components/ui/Actions'
import { UntilDate } from '@/components/ui/UntilDate'
import { FAQ_ANIVERSARIO } from '@/content/faq'
import { RULES } from '@/content/site'

export const metadata: Metadata = {
  title: 'Aniversário infantil com boliche',
  description:
    'Festa de aniversário no Strike Berlin: boliche com canaleta para criança, realidade virtual, fliperama e Combo Festa com salgados, doces e refri. Outubro é Mês da Criança.',
  alternates: { canonical: '/aniversario' },
}

const WHY = [
  { icon: Baby, title: 'Criança joga de verdade', text: 'Canaletas automáticas e lançador de bola: a bola não some na canaleta e todo mundo derruba pino.' },
  { icon: Glasses, title: 'Realidade virtual', text: 'Uma partida para dois já vem em todo pacote — pra criançada disputar quem joga primeiro.' },
  { icon: Gamepad2, title: 'Fliperama e air hockey', text: '10 fichas de game no Combo Festa e máquina de pelúcia pra levar lembrança.' },
  { icon: Utensils, title: 'Comida resolvida', text: '100 salgados, 50 doces e refri. Pros adultos, gastrobar com chopp e drinks.' },
  { icon: Cake, title: 'Kit com torta', text: 'Também tem kits com torta, doces e salgados. A gente conversa o formato certo pra sua festa.' },
  { icon: Sparkles, title: 'Presente do aniversariante', text: RULES.birthday },
]

export default function Aniversario() {
  return (
    <>
      <PageHero
        eyebrow="Aniversário no Strike"
        title="Aniversário da criançada é no"
        accent="Strike."
        lead="Boliche, realidade virtual e fliperama no mesmo lugar, com Combo Festa pra criançada e gastrobar pros adultos. De segunda a quinta tem mais horário livre."
        photo={{ src: '/img/coracao-neon.jpg', alt: 'Painel de coração em neon Strike Berlin, cenário das fotos da festa' }}
        context="aniversario"
        badge={
          <UntilDate end="2026-10-31">
            <span className="season-pill season-pill--static">
              <span className="season-pill__dot" /> Outubro é Mês da Criança
            </span>
          </UntilDate>
        }
      >
        <a href="#proposta" className="btn btn--primary btn--lg" data-magnetic>
          <span>Montar a festa</span>
        </a>
        <WhatsAppButton id="aniversario-hero" size="lg" variant="ghost" context="aniversario">
          Falar no WhatsApp
        </WhatsAppButton>
      </PageHero>

      <section className="section section--cream" aria-labelledby="why-title">
        <div className="container">
          <SectionHead
            dark
            eyebrow="Por que aqui"
            title="Festa que ninguém fica olhando o celular."
            lead="Tem atração pra cada idade, e os pais aproveitam junto em vez de ficar de babá."
          />
          <ul className="why" data-stagger>
            {WHY.map(({ icon: Icon, title, text }) => (
              <li key={title} className="why__item">
                <span className="why__icon">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--night split-photo" aria-labelledby="semana-title">
        <div className="container split-photo__grid">
          <div className="split-photo__media" data-reveal>
            <div className="split-photo__img" data-parallax="0.2">
              <Image src="/img/bolas-coloridas.jpg" alt="Bolas de boliche coloridas" fill sizes="(min-width: 1024px) 45vw, 100vw" />
            </div>
          </div>
          <div>
            <p className="eyebrow">Dica de quem organiza</p>
            <h2 id="semana-title" className="display" data-split>
              De segunda a quinta, a pista é da família.
            </h2>
            <p className="lead-light" data-reveal>
              Sábado lota e as datas acabam rápido. No meio da semana o Combo Festa sai a partir de R$ 459, a casa está
              mais tranquila e a criançada joga sem fila.
            </p>
            <div className="btn-row" data-reveal>
              <ReserveButton id="aniversario-semana">Ver horários livres</ReserveButton>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--night" aria-labelledby="pk-aniv-title">
        <div className="container">
          <SectionHead eyebrow="Pacotes de festa" title="Os combos que mais saem em aniversário." />
          <Packages only={['festa', 'burger']} />
        </div>
      </section>

      <WhatsAppSection
        context="aniversario"
        eyebrow="Monte a festa"
        title="Conta a data. A gente cuida do resto."
        lead="Diz quantas crianças e adultos vêm e o dia que você pensou. O atendimento responde pelo WhatsApp com pacote, horário e valor."
        bullets={['Resposta pelo WhatsApp', 'Combo Festa ou formato sob medida', 'Agende uma visita antes de fechar', 'Sinal de 50% confirma a data']}
      />

      <FaqSection items={FAQ_ANIVERSARIO} title="Antes de fechar a festa." id="faq-aniversario" />
      <Visit />
      <CtaBand title="A criançada já escolheu. Falta você marcar." context="aniversario" />
    </>
  )
}
