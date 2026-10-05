'use client'
/**
 * Atrações. No desktop a seção prende na tela e os cards correm na horizontal
 * conforme o scroll; no celular é um carrossel de arrastar (scroll-snap).
 */
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import { ATTRACTIONS, type ArtKey } from '@/content/attractions'
import { MOTION_OK, gsap, useGSAP } from '@/components/motion/gsap'
import { GastroArt, KaraokeArt, PoolArt, VrArt } from '@/components/ui/Illustrations'

const ART: Record<ArtKey, () => React.JSX.Element> = { vr: VrArt, pool: PoolArt, karaoke: KaraokeArt, gastro: GastroArt }

export function Attractions() {
  const section = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(`(min-width: 1024px) and ${MOTION_OK}`, () => {
        const track = section.current!.querySelector<HTMLElement>('.attr__track')!
        const distance = () => track.scrollWidth - window.innerWidth + 48
        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: section.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        })
        // Cada card gira levemente ao passar — dá peso ao movimento.
        gsap.utils.toArray<HTMLElement>('.attr-card', section.current).forEach((card) => {
          gsap.fromTo(
            card.querySelector('.attr-card__media'),
            { scale: 1.18 },
            {
              scale: 1,
              ease: 'none',
              scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'center center', scrub: true },
            },
          )
        })
      })
    },
    { scope: section },
  )

  return (
    <section className="attr" id="atracoes" ref={section} aria-labelledby="attr-title">
      <div className="attr__track">
        <header className="attr__intro">
          <p className="eyebrow">A casa</p>
          <h2 id="attr-title" className="display" data-split>
            Seis jeitos de ganhar a noite.
          </h2>
          <p className="attr__lead">
            Boliche é o começo. Depois tem realidade virtual, fliperama, sinuca, karaokê e um gastrobar com chopp bem
            gelado — tudo no mesmo endereço.
          </p>
          <p className="attr__hint" aria-hidden="true">
            <span className="attr__hint-desk">Role para ver</span>
            <span className="attr__hint-mob">Arraste para o lado</span> <ArrowRight size={16} />
          </p>
        </header>
        <div className="attr__cards">
        {ATTRACTIONS.map((a, i) => {
          const Art = a.art ? ART[a.art] : null
          const body = (
            <>
              <div className="attr-card__media">
                {a.photo ? (
                  <Image src={a.photo.src} alt={a.photo.alt} fill sizes="(min-width: 1024px) 380px, 80vw" />
                ) : (
                  Art && <Art />
                )}
              </div>
              <div className="attr-card__body">
                <span className="attr-card__num">{String(i + 1).padStart(2, '0')}</span>
                <p className="attr-card__kicker">{a.kicker}</p>
                <h3>{a.title}</h3>
                <p>{a.text}</p>
                {a.href && (
                  <span className="attr-card__more">
                    Saiba mais <ArrowRight size={16} aria-hidden="true" />
                  </span>
                )}
              </div>
            </>
          )
          return a.href ? (
            <Link key={a.id} href={a.href} className="attr-card" id={a.id}>
              {body}
            </Link>
          ) : (
            <article key={a.id} className="attr-card" id={a.id}>
              {body}
            </article>
          )
        })}
        </div>
      </div>
    </section>
  )
}
