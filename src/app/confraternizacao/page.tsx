import { Briefcase, GraduationCap, Mic, Receipt, Users, Utensils } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CtaBand, FaqSection, WhatsAppSection, PageHero, SectionHead, Visit } from '@/components/sections/Blocks'
import { GroupPlanner } from '@/components/sections/GroupPlanner'
import { Packages } from '@/components/sections/Packages'
import { WhatsAppButton } from '@/components/ui/Actions'
import { FAQ_GRUPOS } from '@/content/faq'

export const metadata: Metadata = {
  title: 'Confraternização para grupos grandes',
  description:
    'Confraternização de grupo no Strike Berlin, em São Leopoldo: 4 pistas de boliche, 5 mesas de sinuca, fliperama, karaokê e gastrobar. Calcule quantas pistas sua turma precisa e peça a proposta.',
  alternates: { canonical: '/confraternizacao' },
}

const WHY = [
  { icon: Users, title: 'Cabe a turma', text: '4 pistas com até 12 pessoas cada: 48 jogando ao mesmo tempo, e o resto curtindo a casa.' },
  { icon: Mic, title: 'Ninguém fica parado', text: 'Sinuca, fliperama, karaokê e realidade virtual pra quem está esperando a vez.' },
  { icon: Utensils, title: 'Comida e bebida', text: 'Combos com salgados e doces ou hambúrguer, torre de chopp Imigração, drinks e espumante.' },
  { icon: Receipt, title: 'Nota fiscal', text: 'Proposta fechada com nota para empresa, quando precisar.' },
  { icon: GraduationCap, title: 'Qualquer turma', text: 'Faculdade, formatura, time, família grande, igreja, condomínio — o formato se ajusta.' },
  { icon: Briefcase, title: 'Também para empresas', text: 'Confraternização de fim de ano e happy hour da equipe.' },
]

export default function Confraternizacao() {
  return (
    <>
      <PageHero
        eyebrow="Confraternização de grupo"
        title="Junta todo mundo."
        accent="A gente cuida do resto."
        lead="Turma da faculdade, família grande, time ou a firma inteira: 4 pistas, 5 mesas de sinuca, fliperama, karaokê e gastrobar no mesmo lugar, com proposta sob medida."
        photo={{ src: '/img/pistas-neon.jpg', alt: 'As 4 pistas de boliche em neon do Strike Berlin' }}
        context="grupos"
      >
        <a href="#calculadora" className="btn btn--primary btn--lg" data-magnetic>
          <span>Quantas pistas preciso?</span>
        </a>
        <WhatsAppButton id="grupos-hero" size="lg" variant="ghost" context="grupos">
          Pedir proposta
        </WhatsAppButton>
      </PageHero>

      <section className="section section--night" id="calculadora" aria-labelledby="calc-title">
        <div className="container">
          <SectionHead
            eyebrow="Calculadora"
            title="Quantas pistas a sua turma precisa?"
            lead="Mexe no número de pessoas, no dia e no tempo de boliche. A conta usa o preço da pista no site de reservas."
          />
          <GroupPlanner />
        </div>
      </section>

      <section className="section section--cream" aria-labelledby="grupos-why">
        <div className="container">
          <SectionHead dark eyebrow="Por que aqui" title="Grupo grande, noite inteira, um endereço só." />
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
          <p className="lead-dark" data-reveal>
            É confraternização de empresa? Veja também a <Link href="/empresas">página para empresas</Link>.
          </p>
        </div>
      </section>

      <section className="section section--night" aria-labelledby="grupos-pacotes">
        <div className="container">
          <SectionHead
            eyebrow="Pacotes"
            title="Pra começar a conta."
            lead="Para grupo grande, o atendimento combina os combos com mais pistas e mais comida. Combos são fechados só pelo WhatsApp."
          />
          <Packages only={['festa', 'burger', 'pista-2h']} />
        </div>
      </section>

      <WhatsAppSection
        context="grupos"
        eyebrow="Proposta para o grupo"
        title="Manda o tamanho da turma. A gente devolve a proposta."
        lead="Sem compromisso. O atendimento responde pelo WhatsApp com pistas, horário, combos e valor."
        bullets={['Proposta personalizada', 'Até 48 pessoas jogando ao mesmo tempo', 'Nota fiscal para empresa', 'Visita para conhecer o espaço']}
      />

      <FaqSection items={FAQ_GRUPOS} title="O que o organizador pergunta." id="faq-grupos" />
      <Visit />
      <CtaBand title="Tira a turma do grupo do Whats e traz pra pista." context="grupos" />
    </>
  )
}
