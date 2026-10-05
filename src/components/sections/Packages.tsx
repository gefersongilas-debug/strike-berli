'use client'
/**
 * Pacotes com seletor de dia. Trocar o dia anima os preços; o botão de cada
 * pacote abre o WhatsApp já dizendo qual pacote e qual dia.
 */
import { Check } from 'lucide-react'
import { useRef, useState } from 'react'
import { DAYS, PACKAGES, brl, type DayKey } from '@/content/packages'
import { MOTION_OK, gsap, useGSAP } from '@/components/motion/gsap'
import { WhatsAppButton } from '@/components/ui/Actions'
import { trackEvent } from '@/components/tracking/track'

export function Packages({ only, tone = 'dark' }: { only?: string[]; tone?: 'dark' | 'cream' }) {
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
        gsap.fromTo('.pkg__from', { opacity: 0 }, { opacity: 1, duration: 0.4, overwrite: true })
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

      <div className="pkgs__grid" data-stagger>
        {list.map((p) => {
          const price = p.prices[day]
          return (
            <article key={p.id} className={`pkg${p.highlight ? ' pkg--hot' : ''}`} id={`pacote-${p.id}`}>
              {p.highlight && <span className="pkg__badge">Mais pedido para festa</span>}
              <h3 className="pkg__name">{p.name}</h3>
              <p className="pkg__ideal">{p.idealFor}</p>
              <p className="pkg__price">
                <span className="pkg__from">
                  de <s>{brl(price.from)}</s> por
                </span>
                <strong data-price={p.id}>{brl(price.to)}</strong>
                <span className="pkg__day">{dayLabel}</span>
              </p>
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
        Valores por pista, sujeitos a disponibilidade. A reserva é confirmada com 50% antecipado. Entrada R$ 10 por pessoa
        (com água de cortesia), exceto as entradas cortesia do pacote.
      </p>
    </div>
  )
}
