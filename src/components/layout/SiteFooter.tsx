import Image from 'next/image'
import Link from 'next/link'
import { FOOTER_EXTRA, NAV, SITE, fullAddress } from '@/content/site'
import { InstagramIcon } from '@/components/ui/BrandIcons'
import { PhoneLink, ReserveButton, WhatsAppButton } from '@/components/ui/Actions'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <Image src="/img/logo-strike.png" alt="Strike Berlin — Boliche Sport Bar" width={96} height={102} />
          <p>Boliche, realidade virtual, fliperama, sinuca, karaokê e gastrobar no Centro de São Leopoldo.</p>
        </div>
        <nav aria-label="Rodapé">
          <h2>Navegue</h2>
          <ul>
            <li>
              <Link href="/">Início</Link>
            </li>
            {[...NAV, ...FOOTER_EXTRA].map((n) => (
              <li key={n.href}>
                <Link href={n.href}>{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2>Visite</h2>
          <address>
            {SITE.address.street}
            <br />
            {SITE.address.district} · {SITE.address.city}/{SITE.address.state}
            <br />
            CEP {SITE.address.zip}
          </address>
          <p>
            <PhoneLink id="footer" />
          </p>
          <p>
            <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" className="link-inline">
              <InstagramIcon size={16} /> {SITE.instagramHandle}
            </a>
          </p>
        </div>
        <div className="site-footer__cta">
          <h2>Bora marcar?</h2>
          <ReserveButton id="footer" />
          <WhatsAppButton id="footer" variant="ghost" />
        </div>
      </div>
      <div className="container site-footer__legal">
        <p>
          © {new Date().getFullYear()} {SITE.legalName} · CNPJ {SITE.cnpj} · {fullAddress}
        </p>
        <p>
          <Link href="/privacidade">Privacidade e cookies</Link>
        </p>
      </div>
    </footer>
  )
}
