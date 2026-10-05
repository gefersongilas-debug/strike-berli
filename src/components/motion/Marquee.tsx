'use client'
/** Faixa infinita. Acelera e inverte o sentido com a velocidade do scroll. */
import { useRef } from 'react'
import { PinIcon } from '@/components/ui/BrandIcons'
import { MOTION_OK, ScrollTrigger, gsap, useGSAP } from './gsap'

export function Marquee({ items, tone = 'yellow', tilt = -2 }: { items: string[]; tone?: 'yellow' | 'red' | 'dark'; tilt?: number }) {
  const scope = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const loop = gsap.to('.marquee__track', { xPercent: -50, duration: 28, ease: 'none', repeat: -1 })
        let dir = 1
        const st = ScrollTrigger.create({
          trigger: scope.current,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            const v = self.getVelocity()
            if (Math.abs(v) < 5) return
            dir = v > 0 ? 1 : -1
            const boost = gsap.utils.clamp(1, 5, Math.abs(v) / 350)
            gsap.to(loop, { timeScale: dir * boost, duration: 0.2, overwrite: true })
            gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.25, ease: 'power2.out' })
          },
        })
        return () => st.kill()
      })
    },
    { scope },
  )

  const row = (hidden: boolean) => (
    <ul className="marquee__group" aria-hidden={hidden || undefined}>
      {items.map((t) => (
        <li key={t}>
          <span>{t}</span>
          <PinIcon size={26} className="marquee__pin" />
        </li>
      ))}
    </ul>
  )

  return (
    <div className={`marquee marquee--${tone}`} ref={scope} style={{ rotate: `${tilt}deg` }}>
      <div className="marquee__track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  )
}
