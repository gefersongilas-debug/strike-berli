import type { Metadata, Viewport } from 'next'
import { Montserrat } from 'next/font/google'
import { Suspense, type ReactNode } from 'react'
import { ConsentBanner } from '@/components/ConsentBanner'
import { MobileCtaBar } from '@/components/layout/MobileCtaBar'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { PageViewTracker } from '@/components/tracking/PageViewTracker'
import { GtmNoscript, TrackingHead } from '@/components/tracking/TrackingScripts'
import { SITE } from '@/content/site'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-sans',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

export const metadata: Metadata = {
  title: {
    default: 'Strike Berlin · Boliche, realidade virtual e gastrobar em São Leopoldo',
    template: '%s · Strike Berlin São Leopoldo',
  },
  description:
    'Boliche com telão interativo, realidade virtual, fliperama, sinuca, karaokê e gastrobar no Centro de São Leopoldo. Reserve sua pista online ou pelo WhatsApp.',
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: SITE.name,
    images: [{ url: '/img/pistas-neon.jpg', width: 1080, height: 1080, alt: 'Pistas de boliche em neon do Strike Berlin' }],
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#0B0D2A',
  width: 'device-width',
  initialScale: 1,
}

const localBusiness = {
  '@context': 'https://schema.org',
  '@type': 'BowlingAlley',
  name: SITE.name,
  alternateName: `${SITE.name} ${SITE.tagline}`,
  url: siteUrl,
  image: siteUrl ? `${siteUrl}/img/fachada.jpg` : undefined,
  logo: siteUrl ? `${siteUrl}/img/logo-strike.png` : undefined,
  telephone: `+${SITE.whatsapp}`,
  priceRange: 'R$',
  address: {
    '@type': 'PostalAddress',
    streetAddress: SITE.address.street,
    addressLocality: SITE.address.city,
    addressRegion: SITE.address.state,
    postalCode: SITE.address.zip,
    addressCountry: 'BR',
  },
  sameAs: [SITE.instagram],
  amenityFeature: ['Realidade virtual', 'Fliperama', 'Sinuca', 'Karaokê', 'Gastrobar', 'Ambiente climatizado', 'Elevador'].map(
    (name) => ({ '@type': 'LocationFeatureSpecification', name, value: true }),
  ),
  potentialAction: { '@type': 'ReserveAction', target: SITE.reservationUrl },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={montserrat.variable} suppressHydrationWarning>
      <head>
        {/* Antes da primeira pintura: esconde o que o GSAP vai animar na entrada (ver globals.css). */}
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add('js')` }} />
        <TrackingHead />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
      </head>
      <body>
        <GtmNoscript />
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <SiteHeader />
        <main id="conteudo">{children}</main>
        <SiteFooter />
        <MobileCtaBar />
        <ConsentBanner />
      </body>
    </html>
  )
}
