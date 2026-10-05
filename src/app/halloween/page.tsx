import { CalendarDays, Ghost, Glasses, Moon, Users } from 'lucide-react'
import type { Metadata } from 'next'
import { Bats } from '@/components/motion/SeasonDecor'
import { CtaBand, FaqSection, LeadSection, SectionHead, Visit } from '@/components/sections/Blocks'
import { Packages } from '@/components/sections/Packages'
import { SeasonHero } from '@/components/sections/SeasonHero'
import { ReserveButton, WhatsAppButton } from '@/components/ui/Actions'
import { FAQ_HALLOWEEN } from '@/content/faq'
import { LANE_FEE_PCT, LANE_PRICES, brl } from '@/content/packages'
import { RULES } from '@/content/site'

export const metadata: Metadata = {
  title: 'Halloween no boliche',
  description:
    'Halloween no Strike Berlin, em São Leopoldo: boliche em pista neon, realidade virtual, fliperama e gastrobar. Sábado, 31 de outubro — reserve a pista online.',
  alternates: { canonical: '/halloween' },
}

const WHY = [
  { icon: Moon, title: 'Pista neon', text: 'As pistas acendem em azul neon: o clima de Halloween já vem de fábrica.' },
  { icon: Glasses, title: 'Realidade virtual', text: 'Coloca o óculos e cai dentro do jogo. Todo pacote traz uma partida para dois.' },
  { icon: Ghost, title: 'Vem fantasiado', text: 'Não é obrigatório — mas strike fantasiado de vampiro é outro nível.' },
  { icon: Users, title: 'Turma inteira', text: 'Até 12 pessoas por pista, sinuca, fliperama, karaokê e gastrobar pra quem reveza.' },
]

export default function Halloween() {
  return (
    <div className="theme-halloween">
      <SeasonHero
        theme="halloween"
        eyebrow="Halloween · sábado, 31 de outubro"
        title="Halloween é"
        accent="no Strike."
        lead="Pista neon, realidade virtual, fliperama e gastrobar na noite mais assustadora do ano. Junta a turma — e, se quiser, vem fantasiado."
        decor={<Bats />}
      >
        <ReserveButton id="hw-hero" size="lg">
          Reservar pista
        </ReserveButton>
        <WhatsAppButton id="hw-hero" size="lg" variant="ghost" context="halloween" />
      </SeasonHero>

      <section className="section section--night" aria-labelledby="hw-quando">
        <div className="container">
          <SectionHead
            eyebrow="Quando"
            title="Sexta ou sábado de Halloween?"
            lead={`Preço da pista avulsa no site de reservas, por hora, para até 12 pessoas (mais ${LANE_FEE_PCT}% de taxa do site). Reservando online, você ganha 1 entrada gratuita.`}
          />
          <ul className="when" data-stagger>
            <li className="when__item">
              <CalendarDays size={22} aria-hidden="true" />
              <h3>Sexta, 30/10</h3>
              <p className="when__price">{brl(LANE_PRICES.sexta)} a hora</p>
              <p>Esquenta de Halloween com a turma. Sexta também esgota — garanta a pista antes.</p>
              <ReserveButton id="hw-sexta" size="sm">
                Reservar sexta
              </ReserveButton>
            </li>
            <li className="when__item when__item--hot">
              <CalendarDays size={22} aria-hidden="true" />
              <h3>Sábado, 31/10</h3>
              <p className="when__price">{brl(LANE_PRICES.sabado)} a hora</p>
              <p>A noite de Halloween. Sábado é o dia mais disputado da casa — reserve antes.</p>
              <ReserveButton id="hw-sabado" size="sm">
                Reservar sábado
              </ReserveButton>
            </li>
          </ul>
        </div>
      </section>

      <section className="section section--white" aria-labelledby="hw-why">
        <div className="container">
          <SectionHead dark eyebrow="A noite" title="Boliche, susto e chopp gelado." />
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

      <section className="section section--night" aria-labelledby="hw-pacotes">
        <div className="container">
          <SectionHead eyebrow="Pacotes" title="Pista, petisco e chopp. Já resolvido." lead={RULES.combosWhatsapp} />
          <Packages />
        </div>
      </section>

      <LeadSection
        page="halloween"
        defaultType="Halloween"
        eyebrow="Halloween em grupo"
        title="Vai trazer a turma toda? Monta a noite com a gente."
        lead="Conta quantas pessoas vêm e o atendimento responde pelo WhatsApp com pistas, combos e valor."
        bullets={['Resposta pelo WhatsApp', 'Até 12 pessoas por pista', 'Combos com comida e chopp', 'Nota fiscal para empresa']}
      />

      <FaqSection items={FAQ_HALLOWEEN} title="Antes do susto." id="faq-hw" />
      <Visit />
      <CtaBand title="Corre que sábado lota. Até de assombração." context="halloween" />
    </div>
  )
}
