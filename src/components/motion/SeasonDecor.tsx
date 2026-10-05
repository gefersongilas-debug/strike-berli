'use client'
/**
 * Decoração sazonal do topo: doces caindo (Dia das Crianças) e morcegos voando
 * (Halloween). Puramente decorativo (aria-hidden), atrás do texto, sem clique.
 * Com prefers-reduced-motion, os elementos ficam parados onde estão.
 */
import { useRef } from 'react'
import { MOTION_OK, gsap, useGSAP } from './gsap'

const CANDY_COLORS = ['#FF5FA2', '#3EC6FF', '#FAC838', '#7BE07B', '#DB1C28', '#B07CFF']

function Candy({ color, kind }: { color: string; kind: number }) {
  if (kind === 0)
    return (
      <svg viewBox="0 0 60 30" width="54">
        <path d="M2 6l12 9-12 9zM58 6L46 15l12 9z" fill={color} opacity="0.85" />
        <rect x="12" y="4" width="36" height="22" rx="11" fill={color} />
        <path d="M20 6c4 6 4 12 0 18M30 5c4 7 4 13 0 20M40 6c4 6 4 12 0 18" stroke="#fff" strokeWidth="2.5" fill="none" opacity="0.55" />
      </svg>
    )
  if (kind === 1)
    return (
      <svg viewBox="0 0 40 80" width="34">
        <rect x="18" y="34" width="4" height="44" rx="2" fill="#F4EDDF" />
        <circle cx="20" cy="20" r="18" fill={color} />
        <path d="M20 20m-12 0a12 12 0 1 0 24 0a8 8 0 1 0-16 0a4 4 0 1 0 8 0" stroke="#fff" strokeWidth="3" fill="none" opacity="0.7" />
      </svg>
    )
  return (
    <svg viewBox="0 0 36 36" width="30">
      <circle cx="18" cy="18" r="15" fill={color} />
      <circle cx="12" cy="12" r="4" fill="#fff" opacity="0.5" />
    </svg>
  )
}

export function CandyRain({ count = 14 }: { count?: number }) {
  const scope = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.utils.toArray<HTMLElement>('.candy', scope.current).forEach((el, i) => {
          // Parado (reduced motion) fica espalhado; animado, todo doce nasce acima do topo.
          gsap.set(el, { top: '-12%' })
          const fall = () =>
            gsap.fromTo(
              el,
              { yPercent: -150, y: 0, x: 0, rotation: gsap.utils.random(-60, 60), opacity: 0 },
              {
                y: () => (scope.current?.offsetHeight ?? 800) + 120,
                x: gsap.utils.random(-80, 80),
                rotation: `+=${gsap.utils.random(180, 540)}`,
                opacity: 1,
                duration: gsap.utils.random(6, 11),
                ease: 'none',
                delay: i * 0.55,
                repeat: -1,
                repeatDelay: gsap.utils.random(0, 2),
              },
            )
          fall()
        })
      })
    },
    { scope },
  )
  return (
    <div className="season-decor" ref={scope} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="candy" style={{ left: `${i % 4 === 0 ? (i * 7) % 6 : 50 + ((i * 37) % 46)}%`, top: `${(i * 37) % 70}%` }}>
          <Candy color={CANDY_COLORS[i % CANDY_COLORS.length]} kind={i % 3} />
        </span>
      ))}
    </div>
  )
}

function Bat() {
  return (
    <svg viewBox="0 0 120 50" width="100%">
      <g className="bat__wing bat__wing--l">
        <path d="M58 22C48 6 30 2 6 8c10 4 14 10 12 18 8-6 16-4 20 4 4-8 12-10 20-8Z" fill="#4A2A78" />
      </g>
      <g className="bat__wing bat__wing--r">
        <path d="M62 22c10-16 28-20 52-14-10 4-14 10-12 18-8-6-16-4-20 4-4-8-12-10-20-8Z" fill="#4A2A78" />
      </g>
      <ellipse cx="60" cy="25" rx="8" ry="11" fill="#4A2A78" />
      <path d="M54 16l2-8 4 6 4-6 2 8z" fill="#4A2A78" />
      <circle cx="57" cy="22" r="1.6" fill="#FF7A1A" />
      <circle cx="63" cy="22" r="1.6" fill="#FF7A1A" />
    </svg>
  )
}

export function Bats({ count = 7 }: { count?: number }) {
  const scope = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.utils.toArray<HTMLElement>('.bat', scope.current).forEach((el, i) => {
          const w = scope.current?.offsetWidth ?? 1200
          const dir = i % 2 ? -1 : 1
          gsap.set(el, { left: 0 })
          gsap.fromTo(
            el,
            { x: dir > 0 ? -160 : w + 160, scaleX: dir },
            { x: dir > 0 ? w + 160 : -160, duration: gsap.utils.random(9, 15), ease: 'none', repeat: -1, delay: i * 1.3 },
          )
          gsap.to(el, { y: gsap.utils.random(-40, 40), duration: gsap.utils.random(0.9, 1.6), ease: 'sine.inOut', yoyo: true, repeat: -1 })
          gsap.to(el.querySelectorAll('.bat__wing'), {
            scaleY: 0.35,
            duration: 0.14 + (i % 3) * 0.03,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            transformOrigin: '50% 60%',
          })
        })
      })
    },
    { scope },
  )
  return (
    <div className="season-decor" ref={scope} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="bat" style={{ top: `${8 + ((i * 11) % 55)}%`, width: `${58 + (i % 3) * 34}px`, left: `${(i * 31) % 90}%` }}>
          <Bat />
        </span>
      ))}
    </div>
  )
}
