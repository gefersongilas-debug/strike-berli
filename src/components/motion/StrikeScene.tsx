'use client'
/**
 * Faixa do topo da home: a bola entra rolando, derruba os 10 pinos e explode um
 * "STRIKE!". Toca uma vez na chegada; "Jogar de novo" repete. Com
 * prefers-reduced-motion, fica a cena parada com os pinos em pé.
 */
import { RotateCcw } from 'lucide-react'
import { useRef } from 'react'
import { MOTION_OK, gsap, useGSAP } from './gsap'

const PIN_PATH =
  'M20 0c7 0 10 7 9 15-1 7-4 11-4 16 0 6 11 21 11 39s-6 30-16 30S4 88 4 70s11-33 11-39c0-5-3-9-4-16C10 7 13 0 20 0Z'

const FLOOR = 222
const BALL_R = 30

/** Fileiras de trás para a frente: as da frente são maiores e ficam por cima. */
const ROWS = [
  { n: 4, scale: 0.7, bottom: 200, gap: 36 },
  { n: 3, scale: 0.78, bottom: 207, gap: 38 },
  { n: 2, scale: 0.86, bottom: 214, gap: 40 },
  { n: 1, scale: 0.95, bottom: FLOOR, gap: 0 },
]
const PINS_CX = 1062

const PINS = ROWS.flatMap((row, r) =>
  Array.from({ length: row.n }, (_, i) => {
    const cx = PINS_CX + (i - (row.n - 1) / 2) * row.gap
    return { cx, row: r, scale: row.scale, bottom: row.bottom }
  }),
)

// Para onde cada pino voa (determinístico: a repetição fica igual).
const SCATTER = [
  [150, -90, 120], [70, -140, -150], [200, -60, 95], [120, -150, 170],
  [40, -120, -110], [180, -110, 140], [90, -170, -80],
  [-30, -130, -130], [160, -150, 160],
  [110, -100, 200],
]

const CONFETTI = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2
  return { dx: Math.cos(a) * (90 + (i % 3) * 30), dy: Math.sin(a) * (60 + (i % 4) * 18), c: ['#FAC838', '#DB1C28', '#F4EDDF'][i % 3], r: (i * 47) % 360 }
})

const IMPACT_X = PINS_CX - 70

/** Explosão em estrela, levemente achatada, centrada em (0, 0). */
const BURST_PATH = (() => {
  const n = 14
  let d = ''
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? 56 : 80
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2
    d += `${i ? 'L' : 'M'}${(Math.cos(a) * r * 1.4).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`
  }
  return `${d}Z`
})()

export function StrikeScene() {
  const scope = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)

  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const start = -(IMPACT_X + 80)
        const spin = (-start / (2 * Math.PI * BALL_R)) * 360
        const word = document.querySelector<HTMLElement>('[data-strike-word]')

        const t = gsap.timeline({ delay: 0.45 })
        t.fromTo('.ss-roll', { x: start, opacity: 1 }, { x: 0, duration: 1.15, ease: 'power1.in' })
          .fromTo('.ss-spin', { rotation: 0 }, { rotation: spin, duration: 1.15, ease: 'power1.in', transformOrigin: '50% 50%' }, 0)
          .fromTo('.ss-trail', { opacity: 0, scaleX: 0.2 }, { opacity: 0.8, scaleX: 1, duration: 0.9, ease: 'power1.in', transformOrigin: '100% 50%' }, 0.15)
          .addLabel('hit')
          .to('.ss-roll', { x: 320, opacity: 0, duration: 0.7, ease: 'power2.out' }, 'hit')
          .to('.ss-spin', { rotation: `+=${spin * 0.25}`, duration: 0.7, ease: 'power2.out' }, 'hit')
          .to('.ss-trail', { opacity: 0, duration: 0.2 }, 'hit')

        gsap.utils.toArray<SVGGElement>('.ss-pin', scope.current).forEach((pin, i) => {
          const [x, y, rot] = SCATTER[i]
          const delay = (3 - Number(pin.dataset.row)) * 0.03
          t.fromTo(
            pin,
            { x: 0, y: 0, rotation: 0, opacity: 1 },
            {
              keyframes: [
                { x: x * 0.6, y, rotation: rot * 0.6, duration: 0.45, ease: 'power2.out' },
                { x, y: 40, rotation: rot, opacity: 0, duration: 0.55, ease: 'power2.in' },
              ],
              transformOrigin: '50% 100%',
            },
            `hit+=${0.02 + delay}`,
          )
        })

        t.fromTo('.ss-flash', { opacity: 0, scale: 0.4 }, { opacity: 0.9, scale: 1.4, duration: 0.18, ease: 'power2.out', transformOrigin: '50% 50%' }, 'hit')
          .to('.ss-flash', { opacity: 0, duration: 0.6 }, 'hit+=0.18')
          .fromTo('.ss-burst', { scale: 0, rotation: -40, opacity: 1 }, { scale: 1, rotation: -7, duration: 0.7, ease: 'back.out(2.6)', transformOrigin: '50% 50%' }, 'hit+=0.08')
          .fromTo(
            '.ss-confetti',
            { x: 0, y: 0, scale: 0, rotation: 0, opacity: 1 },
            {
              x: (i) => CONFETTI[i].dx,
              y: (i) => CONFETTI[i].dy,
              rotation: (i) => CONFETTI[i].r,
              scale: 1,
              duration: 0.9,
              ease: 'expo.out',
              stagger: 0.008,
              transformOrigin: '50% 50%',
            },
            'hit+=0.05',
          )
          .to('.ss-confetti', { opacity: 0, duration: 0.5 }, 'hit+=0.9')
          // A máquina recoloca os pinos: caem do alto e quicam no lugar.
          .addLabel('rack', 'hit+=1.7')
          .to('.ss-burst', { scale: 0.6, opacity: 0, duration: 0.35, ease: 'power2.in' }, 'rack')
          .fromTo(
            '.ss-pin',
            { x: 0, y: -160, rotation: 0, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, ease: 'bounce.out', stagger: { each: 0.04, from: 'end' }, immediateRender: false },
            'rack+=0.15',
          )
          .fromTo('.ss-replay', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 'rack+=0.6')
        if (word) t.fromTo(word, { '--sweep': 0 }, { '--sweep': 1, duration: 0.55, ease: 'expo.out' }, 'hit+=0.05')

        tl.current = t
        return () => {
          tl.current = null
        }
      })
    },
    { scope },
  )

  const replay = contextSafe(() => tl.current?.restart(true))

  return (
    <div className="strike-scene" ref={scope}>
      <svg viewBox="0 0 1200 240" preserveAspectRatio="xMaxYMax slice" role="img" aria-label="Bola de boliche derrubando os dez pinos: strike!">
        <defs>
          <filter id="ss-glow" x="-20%" y="-200%" width="140%" height="500%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="ss-trail" x1="0" x2="1">
            <stop offset="0" stopColor="#4C6BFF" stopOpacity="0" />
            <stop offset="1" stopColor="#7C93FF" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="ss-ball" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#3a3a52" />
            <stop offset="0.55" stopColor="#121220" />
            <stop offset="1" stopColor="#050509" />
          </radialGradient>
          <radialGradient id="ss-flash">
            <stop offset="0" stopColor="#FFF6D6" />
            <stop offset="0.4" stopColor="#FAC838" stopOpacity="0.7" />
            <stop offset="1" stopColor="#FAC838" stopOpacity="0" />
          </radialGradient>
          <clipPath id="ss-pin-clip">
            <path d={PIN_PATH} />
          </clipPath>
        </defs>

        {/* pista */}
        <line x1="0" y1={FLOOR + 1} x2="1200" y2={FLOOR + 1} stroke="#4C6BFF" strokeWidth="3" filter="url(#ss-glow)" />
        {[220, 300, 380, 460, 540].map((x, i) => (
          <path key={x} d={`M${x} ${FLOOR - 4} l10 -12 l10 12 Z`} fill="#4C6BFF" opacity={0.25 + i * 0.1} />
        ))}

        <circle className="ss-flash" cx={PINS_CX} cy="150" r="120" fill="url(#ss-flash)" opacity="0" />

        {PINS.map((p, i) => (
          <g key={i} transform={`translate(${p.cx - 20 * p.scale} ${p.bottom - 100 * p.scale}) scale(${p.scale})`}>
            <g className="ss-pin" data-row={p.row}>
              <ellipse cx="20" cy="100" rx="15" ry="3" fill="#000" opacity="0.35" />
              <g clipPath="url(#ss-pin-clip)">
                <rect width="40" height="100" fill="#F7F3EA" />
                <rect x="24" width="16" height="100" fill="#D9D0BE" opacity="0.6" />
                <rect y="22" width="40" height="4" fill="#DB1C28" />
                <rect y="29" width="40" height="4" fill="#DB1C28" />
              </g>
            </g>
          </g>
        ))}

        <g transform={`translate(${IMPACT_X} ${FLOOR - BALL_R})`}>
          <g className="ss-roll">
            <rect className="ss-trail" x={-190} y={-6} width="170" height="12" rx="6" fill="url(#ss-trail)" opacity="0" />
            <g className="ss-spin">
              <circle r={BALL_R} fill="url(#ss-ball)" />
              <circle cx="-9" cy="-11" r="4.2" fill="#FAC838" />
              <circle cx="4" cy="-13" r="4.2" fill="#FAC838" />
              <circle cx="-2" cy="1" r="4.2" fill="#FAC838" />
            </g>
            <ellipse cx="-12" cy="-16" rx="8" ry="4" fill="#fff" opacity="0.14" />
          </g>
        </g>

        {CONFETTI.map((c, i) => (
          <rect key={i} className="ss-confetti" x={PINS_CX - 4} y="110" width="8" height="14" rx="2" fill={c.c} opacity="0" />
        ))}

        <g transform={`translate(${PINS_CX - 20} 96)`}>
          <g className="ss-burst" opacity="0">
            <path d={BURST_PATH} fill="#FAC838" stroke="#0A0A12" strokeWidth="5" strokeLinejoin="round" />
            <text x="0" y="15" textAnchor="middle" className="ss-burst-text">
              STRIKE!
            </text>
          </g>
        </g>
      </svg>
      <button type="button" className="ss-replay" onClick={replay}>
        <RotateCcw size={14} aria-hidden="true" /> Jogar de novo
      </button>
    </div>
  )
}
