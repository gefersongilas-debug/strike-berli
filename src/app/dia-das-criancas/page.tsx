import { Baby, CalendarDays, Gamepad2, Glasses, Sparkles, Ticket, Utensils } from 'lucide-react'
import type { Metadata } from 'next'
import { CandyRain } from '@/components/motion/SeasonDecor'
import { CtaBand, FaqSection, WhatsAppSection, SectionHead, Visit } from '@/components/sections/Blocks'
import { Packages } from '@/components/sections/Packages'
import { SeasonHero } from '@/components/sections/SeasonHero'
import { ReserveButton, WhatsAppButton } from '@/components/ui/Actions'
import { UntilDate } from '@/components/ui/UntilDate'
import { FAQ_DIA_CRIANCAS } from '@/content/faq'
import { OFFERS } from '@/content/offers'
import { LANE_PRICES, brl } from '@/content/packages'
import { RULES } from '@/content/site'

export const metadata: Metadata = {
  title: 'Dia das Crianças com boliche e doce extra',
  description:
    'Dia das Crianças no Strike Berlin, em São Leopoldo: boliche com canaleta automática, fliperama e realidade virtual. Menores de 9 anos não pagam entrada e a festa fechada pelo WhatsApp ganha doce extra.',
  alternates: { canonical: '/dia-das-criancas' },
}

const offer = OFFERS.diaDasCriancas

const WHY = [
  { icon: Baby, title: 'Criança joga de verdade', text: 'Canaletas automáticas e lançador de bola: a bola não some na canaleta e todo mundo derruba pino.' },
  { icon: Ticket, title: 'Menor de 9 não paga entrada', text: RULES.kidsFree },
  { icon: Gamepad2, title: 'Fliperama e pelúcia', text: 'Air hockey, jogos eletrônicos e máquina de pelúcia pra levar lembrança.' },
  { icon: Glasses, title: 'Realidade virtual', text: 'Todo pacote já traz uma partida de realidade virtual para dois.' },
  { icon: Utensils, title: 'Doce e salgado resolvidos', text: 'O Combo Festa vem com 100 salgados e 50 doces. Pros adultos, gastrobar com chopp.' },
  { icon: Sparkles, title: 'Climatizado e acessível', text: 'Ambiente climatizado, elevador e mesas e camarotes pra família inteira.' },
]

export default function DiaDasCriancas() {
  return (
    <>
      <SeasonHero
        theme="kids"
        eyebrow="Dia das Crianças · 12 de outubro"
        title="Dia das Crianças é dia de"
        accent="strike!"
        lead="Boliche com canaleta automática, fliperama e realidade virtual num ambiente climatizado em São Leopoldo. Menores de 9 anos não pagam entrada — e a festa fechada pelo WhatsApp ganha doce extra."
        decor={<CandyRain />}
        badge={
          <UntilDate end={offer.until}>
            <span className="season-pill season-pill--static season-pill--candy">
              <span className="season-pill__dot" /> Oferta: doce extra
            </span>
          </UntilDate>
        }
      >
        <WhatsAppButton id="dc-hero" size="lg" variant="primary" context="diaCriancas">
          Quero o doce extra
        </WhatsAppButton>
        <ReserveButton id="dc-hero" size="lg" variant="ghost">
          Reservar pista
        </ReserveButton>
      </SeasonHero>

      <UntilDate end={offer.until}>
        <section className="section section--cream offer-sec" aria-labelledby="offer-title">
          <div className="container offer">
            <div className="offer__art" aria-hidden="true">
              <span className="offer__sticker">+ doce</span>
              <svg viewBox="0 0 200 120">
                <path d="M10 30l40 30-40 30zM190 30l-40 30 40 30z" fill="#FF5FA2" />
                <rect x="40" y="22" width="120" height="76" rx="38" fill="#FF5FA2" />
                <path d="M70 26c12 20 12 48 0 68M100 23c12 22 12 52 0 74M130 26c12 20 12 48 0 68" stroke="#fff" strokeWidth="8" fill="none" opacity="0.5" />
              </svg>
            </div>
            <div>
              <p className="eyebrow eyebrow--dark">Oferta de Dia das Crianças</p>
              <h2 id="offer-title" className="display display--dark" data-split>
                {offer.title}
              </h2>
              <p className="lead-dark" data-reveal>
                {offer.text}
              </p>
              <p className="offer__fine" data-reveal>
                {offer.fine}
              </p>
              <div className="btn-row" data-reveal>
                <WhatsAppButton id="dc-oferta" context="diaCriancas" variant="dark">
                  Garantir o doce extra
                </WhatsAppButton>
              </div>
            </div>
          </div>
        </section>
      </UntilDate>

      <section className="section section--white" aria-labelledby="dc-why">
        <div className="container">
          <SectionHead dark eyebrow="Por que aqui" title="A criançada se diverte. Os adultos também." />
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

      <section className="section section--night" aria-labelledby="dc-quando">
        <div className="container">
          <SectionHead
            eyebrow="Quando vir"
            title="Feriado prolongado: escolha o seu dia."
            lead="Preços da pista avulsa no site de reservas, por hora, para até 12 pessoas (mais a taxa do site)."
          />
          <ul className="when" data-stagger>
            <li className="when__item">
              <CalendarDays size={22} aria-hidden="true" />
              <h3>Sábado, 10/10</h3>
              <p className="when__price">{brl(LANE_PRICES.sabado)} a hora</p>
              <p>Reserve online e ganhe 1 entrada gratuita. Sábado lota: garanta a pista antes.</p>
              <ReserveButton id="dc-sabado" size="sm">
                Reservar sábado
              </ReserveButton>
            </li>
            <li className="when__item">
              <CalendarDays size={22} aria-hidden="true" />
              <h3>Domingo 11 e feriado 12/10</h3>
              <p className="when__price">Pelo WhatsApp</p>
              <p>O site de reservas não abre esses dias. Chama no WhatsApp que o atendimento confirma o horário.</p>
              <WhatsAppButton id="dc-feriado" size="sm" variant="secondary" context="diaCriancas">
                Consultar horário
              </WhatsAppButton>
            </li>
            <li className="when__item when__item--hot">
              <CalendarDays size={22} aria-hidden="true" />
              <h3>Segunda a quinta</h3>
              <p className="when__price">{brl(LANE_PRICES.semana)} a hora</p>
              <p>Depois do feriado a pista é mais tranquila e o Combo Festa sai pelo melhor preço da semana.</p>
              <ReserveButton id="dc-semana" size="sm">
                Ver horários
              </ReserveButton>
            </li>
          </ul>
        </div>
      </section>

      <section className="section section--night" aria-labelledby="dc-pacotes">
        <div className="container">
          <SectionHead eyebrow="Pacotes" title="Combos pra festa da criançada." lead={RULES.combosWhatsapp} />
          <Packages only={['festa', 'pista-1h', 'pista-2h']} />
        </div>
      </section>

      <WhatsAppSection
        context="diaCriancas"
        eyebrow="Monte a festa"
        title="Conta quantas crianças vêm. A gente cuida do resto."
        lead="O atendimento responde pelo WhatsApp com pacote, horário, valor e o doce extra."
        bullets={['Resposta pelo WhatsApp', 'Doce extra na festa fechada pelo WhatsApp', 'Menores de 9 anos não pagam entrada', 'Combo Festa com 100 salgados e 50 doces']}
      />

      <FaqSection items={FAQ_DIA_CRIANCAS} title="Antes de trazer a criançada." id="faq-dc" />
      <Visit />
      <CtaBand title="Doce extra e strike garantido. Bora?" context="diaCriancas" />
    </>
  )
}
