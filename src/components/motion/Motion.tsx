'use client'
/**
 * Animações declarativas por atributo — as páginas são server components e só
 * marcam o HTML:
 *
 *   data-hero="title" | data-hero      entrada do topo da página
 *   data-split                          título revelado palavra por palavra no scroll
 *   data-reveal                         sobe e aparece no scroll
 *   data-stagger                        os filhos entram em sequência
 *   data-parallax="0.15"                deslocamento no scroll (fração da altura)
 *   data-count="4.5" data-decimals="1"  contador
 *   data-magnetic                       botão "puxa" o cursor (só mouse)
 *
 * Fica no app/template.tsx, que remonta a cada navegação: o escopo é sempre a
 * página nova. Com prefers-reduced-motion, nada se move e tudo já aparece.
 */
import { useRef, type ReactNode } from 'react'
import { FINE_POINTER, MOTION_OK, ScrollTrigger, SplitText, gsap, useGSAP } from './gsap'

const nf = (n: number, dec: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })

export function Motion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const root = document.documentElement
      root.classList.add('gsap-ready')
      const q = <T extends Element = HTMLElement>(sel: string) => gsap.utils.toArray<T>(sel, scope.current)
      const mm = gsap.matchMedia()

      mm.add(MOTION_OK, () => {
        // --- Entrada do topo ---
        const intro = gsap.timeline({ delay: 0.1 })
        for (const el of q('[data-hero]')) {
          if (el.dataset.hero === 'title') {
            gsap.set(el, { opacity: 1 })
            SplitText.create(el, {
              type: 'words,chars',
              mask: 'words',
              autoSplit: true,
              onSplit: (self) =>
                intro.fromTo(
                  self.chars,
                  { yPercent: 115, rotate: 8 },
                  { yPercent: 0, rotate: 0, duration: 0.85, ease: 'expo.out', stagger: 0.018 },
                  0,
                ),
            })
          } else {
            intro.fromTo(el, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.8 }, '<0.12')
          }
        }

        // --- Títulos ---
        for (const el of q('[data-split]')) {
          SplitText.create(el, {
            type: 'lines,words',
            mask: 'lines',
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.words, {
                yPercent: 110,
                duration: 0.9,
                ease: 'expo.out',
                stagger: 0.035,
                scrollTrigger: { trigger: el, start: 'top 88%', once: true },
              }),
          })
        }

        // --- Blocos ---
        for (const el of q('[data-reveal]')) {
          gsap.from(el, { y: 44, opacity: 0, scrollTrigger: { trigger: el, start: 'top 90%', once: true } })
        }
        for (const el of q('[data-stagger]')) {
          gsap.from(el.children, {
            y: 56,
            opacity: 0,
            stagger: 0.09,
            scrollTrigger: { trigger: el, start: 'top 86%', once: true },
          })
        }

        // --- Parallax ---
        for (const el of q('[data-parallax]')) {
          const speed = Number(el.dataset.parallax) || 0.15
          gsap.fromTo(
            el,
            { yPercent: -speed * 50 },
            {
              yPercent: speed * 50,
              ease: 'none',
              scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
            },
          )
        }
      })

      // --- Contadores (o HTML do servidor já traz o número final) ---
      mm.add(MOTION_OK, () => {
        const finals: Array<() => void> = []
        for (const el of q('[data-count]')) {
          const end = Number(el.dataset.count)
          const dec = Number(el.dataset.decimals ?? 0)
          const prefix = el.dataset.prefix ?? ''
          const suffix = el.dataset.suffix ?? ''
          const box = { v: 0 }
          const render = () => (el.textContent = `${prefix}${nf(box.v, dec)}${suffix}`)
          render()
          gsap.to(box, {
            v: end,
            duration: 1.8,
            ease: 'power2.out',
            onUpdate: render,
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          })
          finals.push(() => {
            box.v = end
            render()
          })
        }
        // Ao reverter (troca de página, reduced-motion ligado), volta ao número final.
        return () => finals.forEach((f) => f())
      })

      // --- Botões magnéticos ---
      mm.add(`${MOTION_OK} and ${FINE_POINTER}`, () => {
        const offs: Array<() => void> = []
        for (const el of q('[data-magnetic]')) {
          const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' })
          const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' })
          const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect()
            x((e.clientX - (r.left + r.width / 2)) * 0.22)
            y((e.clientY - (r.top + r.height / 2)) * 0.3)
          }
          const leave = () => {
            x(0)
            y(0)
          }
          el.addEventListener('pointermove', move)
          el.addEventListener('pointerleave', leave)
          offs.push(() => {
            el.removeEventListener('pointermove', move)
            el.removeEventListener('pointerleave', leave)
          })
        }
        return () => offs.forEach((off) => off())
      })

      // Imagens e fontes mudam a altura da página depois do primeiro cálculo.
      const refresh = () => ScrollTrigger.refresh()
      document.fonts?.ready.then(refresh)
      window.addEventListener('load', refresh, { once: true })
      return () => window.removeEventListener('load', refresh)
    },
    { scope },
  )

  return <div ref={scope}>{children}</div>
}
