'use client'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { NAV, SITE } from '@/content/site'
import { ReserveButton, WhatsAppButton } from '@/components/ui/Actions'

/** Transparente sobre o topo; ganha fundo ao rolar, some descendo e volta subindo. */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 24)
      setHidden(y > 480 && y > last + 4)
      if (y < last - 4) setHidden(false)
      last = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}${hidden && !open ? ' is-hidden' : ''}${open ? ' is-open' : ''}`}>
      <div className="site-header__bar container">
        <Link href="/" className="site-header__logo" aria-label={`${SITE.name} — início`}>
          <Image src="/img/logo-strike.png" alt="" width={52} height={55} priority />
          <span>
            <strong>Strike Berlin</strong>
            <small>{SITE.tagline}</small>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Principal">
          <ul>
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} aria-current={pathname === n.href ? 'page' : undefined}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="site-header__cta">
          <ReserveButton id="header" size="sm">
            Reservar
          </ReserveButton>
          <button
            type="button"
            className="menu-btn"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      <div className="menu-mobile" id="menu-mobile" hidden={!open}>
        <ul>
          {NAV.map((n, i) => (
            <li key={n.href} style={{ transitionDelay: `${0.04 * i + 0.05}s` }}>
              <Link href={n.href}>{n.label}</Link>
            </li>
          ))}
        </ul>
        <div className="menu-mobile__cta">
          <ReserveButton id="menu" size="lg" />
          <WhatsAppButton id="menu" size="lg" />
        </div>
      </div>
    </header>
  )
}
