'use client'
/**
 * "Quantas pistas a turma precisa?" — calcula pistas, quem joga ao mesmo tempo e
 * uma estimativa de pista + entrada, só com dados conferidos (12 pessoas por
 * pista, 4 pistas, preço da pista no Eleven Tickets). Comida fica para a proposta.
 */
import { useRef, useState } from 'react'
import { DAYS, LANE_FEE_PCT, LANE_PRICES, LANES, PEOPLE_PER_LANE, brl, type DayKey } from '@/content/packages'
import { WhatsAppButton } from '@/components/ui/Actions'
import { trackEvent } from '@/components/tracking/track'

const HOURS = [1, 2, 3] as const
const ENTRY = 10

export function GroupPlanner() {
  const [people, setPeople] = useState(30)
  const [day, setDay] = useState<DayKey>('semana')
  const [hours, setHours] = useState<(typeof HOURS)[number]>(2)
  const tracked = useRef(false)

  const touch = () => {
    if (tracked.current) return
    tracked.current = true
    trackEvent('view_content', { content_name: 'calculadora-grupo' })
  }

  const lanes = Math.min(LANES, Math.ceil(people / PEOPLE_PER_LANE))
  const playing = Math.min(people, lanes * PEOPLE_PER_LANE)
  const lanePrice = LANE_PRICES[day] * lanes * hours
  const lanesTotal = lanePrice * (1 + LANE_FEE_PCT / 100)
  const entries = people * ENTRY
  const dayLabel = DAYS.find((d) => d.key === day)!.label.toLowerCase()

  return (
    <div className="planner">
      <div className="planner__controls">
        <label className="planner__field">
          <span>
            Quantas pessoas? <strong>{people}</strong>
          </span>
          <input
            type="range"
            min={6}
            max={200}
            step={1}
            value={people}
            onChange={(e) => {
              setPeople(Number(e.target.value))
              touch()
            }}
            aria-valuetext={`${people} pessoas`}
          />
        </label>
        <div className="planner__field">
          <span>Qual dia?</span>
          <div className="pkgs__toggle planner__toggle" role="radiogroup" aria-label="Dia">
            {DAYS.map((d) => (
              <button
                key={d.key}
                type="button"
                role="radio"
                aria-checked={day === d.key}
                className={day === d.key ? 'is-on' : undefined}
                onClick={() => {
                  setDay(d.key)
                  touch()
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div className="planner__field">
          <span>Quanto tempo de boliche?</span>
          <div className="pkgs__toggle planner__toggle" role="radiogroup" aria-label="Horas">
            {HOURS.map((h) => (
              <button
                key={h}
                type="button"
                role="radio"
                aria-checked={hours === h}
                className={hours === h ? 'is-on' : undefined}
                onClick={() => {
                  setHours(h)
                  touch()
                }}
              >
                {h} hora{h > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="planner__result" aria-live="polite">
        <div className="planner__lanes" aria-hidden="true">
          {Array.from({ length: LANES }, (_, i) => (
            <span key={i} className={i < lanes ? 'is-on' : undefined} />
          ))}
        </div>
        <p className="planner__big">
          <strong>{lanes}</strong> {lanes === 1 ? 'pista' : 'pistas'}
        </p>
        <p className="planner__sub">
          {playing} jogando ao mesmo tempo (até {PEOPLE_PER_LANE} por pista)
          {people > LANES * PEOPLE_PER_LANE &&
            ` — os outros ${people - playing} revezam e curtem sinuca, fliperama, karaokê e gastrobar`}
        </p>
        <dl className="planner__est">
          <div>
            <dt>
              {lanes} {lanes === 1 ? 'pista' : 'pistas'} × {hours}h ({dayLabel})
            </dt>
            <dd>{brl(Math.round(lanesTotal))}</dd>
          </div>
          <div>
            <dt>Entradas ({people} × R$ 10)</dt>
            <dd>até {brl(entries)}</dd>
          </div>
        </dl>
        <p className="planner__fine">
          Estimativa com a pista avulsa do site de reservas ({brl(LANE_PRICES[day])} a hora, mais {LANE_FEE_PCT}% de taxa do
          site). Menores de 9 anos não pagam entrada. Comida e bebida entram na proposta: os combos são fechados pelo
          WhatsApp.
        </p>
        <WhatsAppButton
          id="calculadora-grupo"
          variant="primary"
          text={`Oi! Vim pelo site e quero uma proposta de confraternização para ${people} pessoas (${dayLabel}, ${hours}h de boliche).`}
        >
          Pedir proposta para {people} pessoas
        </WhatsAppButton>
      </div>
    </div>
  )
}
