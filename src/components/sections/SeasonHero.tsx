import type { ReactNode } from 'react'
import { StrikeScene, type SceneVariant } from '@/components/motion/StrikeScene'

/** Topo das páginas sazonais: fundo temático, decoração animada e a cena do strike. */
export function SeasonHero({
  theme,
  eyebrow,
  title,
  accent,
  lead,
  badge,
  decor,
  children,
}: {
  theme: Exclude<SceneVariant, 'classic'>
  eyebrow: string
  title: string
  accent: string
  lead: ReactNode
  badge?: ReactNode
  decor?: ReactNode
  children: ReactNode
}) {
  return (
    <section className={`season-hero season-hero--${theme}`}>
      {decor}
      <div className="container season-hero__inner">
        {badge && (
          <div className="page-hero__badge" data-hero>
            {badge}
          </div>
        )}
        <p className="eyebrow" data-hero>
          {eyebrow}
        </p>
        <h1 className="hero__title season-hero__title" data-hero="title">
          {title} <span className="accent">{accent}</span>
        </h1>
        <p className="hero__lead" data-hero>
          {lead}
        </p>
        <div className="btn-row" data-hero>
          {children}
        </div>
      </div>
      <StrikeScene variant={theme} />
    </section>
  )
}
