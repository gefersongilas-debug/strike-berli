import { Beer, Mic, Receipt, Trophy, Users, Utensils } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { CtaBand, FaqSection, WhatsAppSection, PageHero, SectionHead, Visit } from '@/components/sections/Blocks'
import { Packages } from '@/components/sections/Packages'
import { WhatsAppButton } from '@/components/ui/Actions'
import { FAQ_EMPRESAS } from '@/content/faq'

export const metadata: Metadata = {
  title: 'Confraternização de empresa e happy hour',
  description:
    'Confraternização de fim de ano e happy hour no Strike Berlin, em São Leopoldo: boliche, sinuca, karaokê, realidade virtual e gastrobar. Proposta personalizada e nota fiscal para empresa.',
  alternates: { canonical: '/empresas' },
}

const WHY = [
  { icon: Trophy, title: 'Integração que funciona', text: 'Pistas animadas e competição leve: chefe e estagiário no mesmo time, todo mundo conversando.' },
  { icon: Users, title: 'Cabe a equipe', text: '4 pistas, 5 mesas de sinuca, fliperama e karaokê. Ninguém fica parado esperando a vez.' },
  { icon: Utensils, title: 'Comida e bebida no pacote', text: 'Salgados, hambúrguer, fritas e torre de chopp Imigração. Drinks, vinhos e espumante à parte.' },
  { icon: Receipt, title: 'Nota fiscal', text: 'Proposta fechada com nota para a empresa. O financeiro agradece.' },
  { icon: Mic, title: 'Karaokê pro discurso', text: 'Ou pra quem perdeu a aposta da pista. Microfone aberto.' },
  { icon: Beer, title: 'Happy hour toda semana', text: 'De segunda a quinta os pacotes saem mais em conta e a casa está mais tranquila.' },
]

export default function Empresas() {
  return (
    <>
      <PageHero
        eyebrow="Empresas e happy hour"
        title="Confra da empresa do jeito que"
        accent="vale a pena."
        lead="Boliche, sinuca, realidade virtual, karaokê, petiscos e aquele chopp bem gelado. Proposta sob medida para a sua equipe, com nota fiscal."
        photo={{ src: '/img/pistas-neon.jpg', alt: 'Pistas de boliche em neon do Strike Berlin' }}
        context="empresas"
      >
        <a href="#proposta" className="btn btn--primary btn--lg" data-magnetic>
          <span>Pedir proposta</span>
        </a>
        <WhatsAppButton id="empresas-hero" size="lg" variant="ghost" context="empresas">
          Falar no WhatsApp
        </WhatsAppButton>
      </PageHero>

      <section className="section section--cream" aria-labelledby="why-emp-title">
        <div className="container">
          <SectionHead
            dark
            eyebrow="Por que o Strike"
            title="Mais que uma partida e tchau."
            lead="Depois do primeiro strike a equipe se solta. É o tipo de confraternização que vira assunto na segunda-feira."
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

      <section className="section section--night split-photo" aria-labelledby="fim-ano-title">
        <div className="container split-photo__grid split-photo__grid--rev">
          <div>
            <p className="eyebrow">Fim de ano</p>
            <h2 id="fim-ano-title" className="display" data-split>
              Novembro e dezembro enchem rápido.
            </h2>
            <p className="lead-light" data-reveal>
              Confraternização de fim de ano é a época mais disputada. Mande a data e o número de pessoas agora e garanta
              o horário da sua equipe.
            </p>
            <div className="btn-row" data-reveal>
              <a href="#proposta" className="btn btn--primary btn--md">
                <span>Garantir a data</span>
              </a>
            </div>
          </div>
          <div className="split-photo__media" data-reveal>
            <div className="split-photo__img" data-parallax="0.2">
              <Image src="/img/fachada.jpg" alt="Fachada do Strike Berlin na Av. João Corrêa" fill sizes="(min-width: 1024px) 45vw, 100vw" />
            </div>
          </div>
        </div>
      </section>

      <section className="section section--night" aria-labelledby="pk-emp-title">
        <div className="container">
          <SectionHead eyebrow="Pacotes" title="Pra começar a conversa." lead="Para grupos maiores a gente monta a proposta: mais pistas, mais comida e o horário da sua equipe." />
          <Packages only={['festa', 'burger', 'pista-2h']} />
        </div>
      </section>

      <WhatsAppSection
        context="empresas"
        eyebrow="Proposta para empresa"
        title="Manda o tamanho da equipe. A gente devolve a proposta."
        lead="Sem compromisso. O atendimento responde pelo WhatsApp com formato, horário e valor — com nota fiscal."
        bullets={['Proposta personalizada', 'Pacotes por pessoa ou por pista', 'Nota fiscal para empresa', 'Visita para conhecer o espaço']}
      />

      <FaqSection items={FAQ_EMPRESAS} title="O que o RH pergunta." id="faq-empresas" />
      <Visit />
      <CtaBand title="A melhor reunião do ano é na pista." context="empresas" />
    </>
  )
}
