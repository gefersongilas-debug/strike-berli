'use client'
/**
 * Pacotes com seletor de dia. Trocar o dia anima os preços; o botão de cada
 * pacote abre o WhatsApp já dizendo qual pacote e qual dia.
 */
import { Check, Ticket, Users } from 'lucide-react'
import { useRef, useState } from 'react'
import { DAYS, LANE_FEE_PCT, LANE_PRICES, PACKAGES, PEOPLE_PER_LANE, brl, priceBreakdown, type DayKey } from '@/content/packages'
import { MOTION_OK, gsap, useGSAP } from '@/components/motion/gsap'
import { ReserveButton, WhatsAppButton } from '@/components/ui/Actions'
import { trackEvent } from '@/components/tracking/track'

export function Packages({
  only,
  tone = 'dark',
  showLane = !only,
}: {
  only?: string[]
  tone?: 'dark' | 'cream'
  /** Faixa "Só a pista" acima dos pacotes, para comparar. */
  showLane?: boolean
}) {
  const [day, setDay] = useState<DayKey>('semana')
  const scope = useRef<HTMLDivElement>(null)
  const list = only ? PACKAGES.filter((p) => only.includes(p.id)) : PACKAGES
  const dayLabel = DAYS.find((d) => d.key === day)!.label

  const changed = useRef(false)

  // Troca de dia: o preço novo entra "rolando" de baixo. O texto é do React;
  // o GSAP só mexe em transform/opacidade.
  useGSAP(
    () => {
      if (!changed.current) return
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.fromTo(
          '[data-price]',
          { yPercent: 70, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'back.out(2.2)', overwrite: true },
        )
        gsap.fromTo('.pkg__calc dd, .lane-only__price', { opacity: 0 }, { opacity: 1, duration: 0.4, overwrite: true })
      })
    },
    { scope, dependencies: [day] },
  )

  function choose(next: DayKey) {
    if (next === day) return
    changed.current = true
    setDay(next)
    trackEvent('view_content', { content_name: 'pacotes', day: next })
  }

  return (
    <div className={`pkgs pkgs--${tone}`} ref={scope}>
      <div className="pkgs__toggle" role="radiogroup" aria-label="Dia da visita">
        {DAYS.map((d) => (
          <button
            key={d.key}
            type="button"
            role="radio"
            aria-checked={day === d.key}
            className={day === d.key ? 'is-on' : undefined}
            onClick={() => choose(d.key)}
          >
            {d.label}
          </button>
        ))}
        <span className="pkgs__toggle-hint">{day === 'semana' ? 'Melhor preço da semana' : 'Fim de semana lota: reserve antes'}</span>
      </div>

      {showLane && (
        <div className="lane-only">
          <div>
            <p className="lane-only__kicker">Só quer jogar?</p>
            <p className="lane-only__title">
              Só a pista: <strong className="lane-only__price">{brl(LANE_PRICES[day])}</strong> a hora
            </p>
            <p className="lane-only__text">
              1 pista para até {PEOPLE_PER_LANE} pessoas, sem comida e bebida, reservando online ({dayLabel.toLowerCase()},
              mais {LANE_FEE_PCT}% de taxa do site). Os pacotes abaixo são essa mesma pista com comida, bebida e
              realidade virtual, mais baratos do que comprar tudo separado.
            </p>
          </div>
          <ReserveButton id="pacotes-so-pista" variant="secondary">
            Reservar só a pista
          </ReserveButton>
        </div>
      )}

      <div className="pkgs__grid" data-stagger>
        {list.map((p) => {
          const b = priceBreakdown(p, day)
          return (
            <article key={p.id} className={`pkg${p.highlight ? ' pkg--hot' : ''}`} id={`pacote-${p.id}`}>
              {p.badge && <span className="pkg__badge">{p.badge}</span>}
              <h3 className="pkg__name">{p.name}</h3>
              <p className="pkg__ideal">{p.idealFor}</p>
              <ul className="pkg__who" aria-label="Para quantas pessoas">
                <li>
                  <Users size={16} aria-hidden="true" />
                  <span>
                    <strong>1 pista</strong> por {p.hours === 1 ? '1 hora' : `${p.hours} horas`}, até {PEOPLE_PER_LANE}{' '}
                    jogando
                  </span>
                </li>
                <li>
                  <Ticket size={16} aria-hidden="true" />
                  <span>
                    Entrada à parte: <strong>R$ 10</strong> por pessoa
                    {p.items.some((it) => /entradas cortesia/.test(it)) ? ' (2 já vêm no pacote)' : ''}
                  </span>
                </li>
              </ul>
              <p className="pkg__price">
                <strong data-price={p.id}>{brl(b.pack)}</strong>
                <span className="pkg__day">{dayLabel} · entrada à parte</span>
              </p>
              <dl className="pkg__calc" aria-label="Quanto sairia comprando separado">
                <div>
                  <dt>
                    Pista {p.hours === 1 ? '1 hora' : `${p.hours} horas`}
                    <small>preço do site de reservas</small>
                  </dt>
                  <dd>{brl(b.lane)}</dd>
                </div>
                <div>
                  <dt>{p.extrasLabel}</dt>
                  <dd>{brl(b.extras)}</dd>
                </div>
                <div className="pkg__calc-total">
                  <dt>Separado sairia</dt>
                  <dd>
                    <s>{brl(b.separate)}</s>
                  </dd>
                </div>
                <div className="pkg__calc-save">
                  <dt>No pacote você economiza</dt>
                  <dd>{brl(b.saving)}</dd>
                </div>
              </dl>
              <ul className="pkg__items">
                {p.items.map((it) => (
                  <li key={it}>
                    <Check size={16} aria-hidden="true" /> {it}
                  </li>
                ))}
              </ul>
              <WhatsAppButton
                id={`pacote-${p.id}`}
                variant={p.highlight ? 'primary' : 'secondary'}
                size="sm"
                text={`Oi! Vim pelo site e quero o pacote ${p.name} (${dayLabel.toLowerCase()}).`}
              >
                Quero esse pacote
              </WhatsAppButton>
            </article>
          )
        })}
      </div>
      <p className="pkgs__note">
        Cada pacote é para 1 pista, que recebe até {PEOPLE_PER_LANE} pessoas jogando. A comida e a bebida são as
        quantidades listadas em cada pacote; para grupo maior, o atendimento ajusta pelo WhatsApp. A entrada é à parte:
        R$ 10 por pessoa, com água; menores de 9 anos não pagam e os combos trazem 2 entradas cortesia. A reserva pelo
        WhatsApp é confirmada com 50% antecipado.
      </p>
    </div>
  )
}
