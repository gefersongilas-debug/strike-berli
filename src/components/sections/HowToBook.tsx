'use client'
/**
 * Quatro jeitos de vir. Uma "pista" vertical liga as opções e a bola desce
 * por ela conforme o scroll, acendendo cada passo.
 */
import { CalendarCheck, DoorOpen, MapPinned } from 'lucide-react'
import { useRef } from 'react'
import { MOTION_OK, gsap, useGSAP } from '@/components/motion/gsap'
import { BallIcon, WhatsAppIcon } from '@/components/ui/BrandIcons'
import { DirectionsButton, ReserveButton, WhatsAppButton } from '@/components/ui/Actions'

export function HowToBook() {
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const lane = scope.current!.querySelector<HTMLElement>('.htb__lane')!
        const ball = scope.current!.querySelector<HTMLElement>('.htb__ball')!
        gsap.fromTo(
          ball,
          { y: 0, rotation: 0 },
          {
            y: () => lane.offsetHeight - ball.offsetHeight,
            rotation: 900,
            ease: 'none',
            scrollTrigger: { trigger: lane, start: 'top 60%', end: 'bottom 60%', scrub: 0.5, invalidateOnRefresh: true },
          },
        )
        gsap.fromTo(
          '.htb__lane-fill',
          { scaleY: 0 },
          { scaleY: 1, ease: 'none', transformOrigin: '50% 0%', scrollTrigger: { trigger: lane, start: 'top 60%', end: 'bottom 60%', scrub: 0.5 } },
        )
        gsap.utils.toArray<HTMLElement>('.htb-step', scope.current).forEach((step) => {
          gsap.from(step, { x: 40, opacity: 0, scrollTrigger: { trigger: step, start: 'top 80%', once: true } })
          gsap.to(step, {
            scrollTrigger: { trigger: step, start: 'top 62%', end: 'bottom 62%', toggleClass: 'is-lit' },
          })
        })
      })
    },
    { scope },
  )

  return (
    <section className="htb section section--cream" id="como-reservar" ref={scope} aria-labelledby="htb-title">
      <div className="container htb__grid">
        <header className="htb__head">
          <p className="eyebrow eyebrow--dark">Como funciona</p>
          <h2 id="htb-title" className="display display--dark" data-split>
            Reserva simples. Noite garantida.
          </h2>
          <p className="lead-dark">
            Sábado lota rápido. Reservando, a pista é sua no horário que você escolher — e de segunda a quinta sobra
            horário.
          </p>
          <ul className="htb__facts">
            <li>
              <strong>Combos</strong> fechados pelo WhatsApp, com 50% antecipado
            </li>
            <li>
              <strong>Entrada R$ 10</strong> por pessoa, com água de cortesia — menores de 9 anos não pagam
            </li>
            <li>
              <strong>Até 12 pessoas</strong> por pista
            </li>
            <li>
              <strong>Menores</strong> entram com responsável legal
            </li>
          </ul>
        </header>

        <div className="htb__steps">
          <div className="htb__lane" aria-hidden="true">
            <span className="htb__lane-fill" />
            <span className="htb__ball">
              <BallIcon size={44} />
            </span>
          </div>
          <ol className="htb__list">
            <li className="htb-step">
              <span className="htb-step__icon">
                <CalendarCheck size={22} aria-hidden="true" />
              </span>
              <div>
                <p className="htb-step__tag">Opção 01 · mais rápida</p>
                <h3>Reserva online</h3>
                <p>Escolha o dia, o horário e a pista e pague no site de reservas. Reservando online, você ganha 1 entrada gratuita.</p>
                <ReserveButton id="como-reservar-online" size="sm">
                  Reservar online
                </ReserveButton>
              </div>
            </li>
            <li className="htb-step">
              <span className="htb-step__icon">
                <WhatsAppIcon size={22} />
              </span>
              <div>
                <p className="htb-step__tag">Opção 02</p>
                <h3>Pelo WhatsApp</h3>
                <p>Prefere falar com gente? O atendimento monta a reserva com você, inclusive pacote de festa.</p>
                <WhatsAppButton id="como-reservar-whatsapp" size="sm" variant="dark">
                  Reservar pelo WhatsApp
                </WhatsAppButton>
              </div>
            </li>
            <li className="htb-step">
              <span className="htb-step__icon">
                <MapPinned size={22} aria-hidden="true" />
              </span>
              <div>
                <p className="htb-step__tag">Opção 03 · para eventos</p>
                <h3>Venha conhecer</h3>
                <p>Vai fazer aniversário ou confraternização? Agende uma visita e veja o espaço antes de fechar.</p>
                <WhatsAppButton id="como-reservar-visita" size="sm" variant="secondary" text="Oi! Vim pelo site e quero agendar uma visita para conhecer o espaço.">
                  Agendar visita
                </WhatsAppButton>
              </div>
            </li>
            <li className="htb-step">
              <span className="htb-step__icon">
                <DoorOpen size={22} aria-hidden="true" />
              </span>
              <div>
                <p className="htb-step__tag">Opção 04</p>
                <h3>Chegar sem reserva</h3>
                <p>Pode vir direto — só não dá pra garantir pista livre na hora, principalmente no fim de semana.</p>
                <DirectionsButton id="como-reservar-chegar" size="sm" variant="ghost-dark" />
              </div>
            </li>
          </ol>
        </div>
      </div>
    </section>
  )
}
