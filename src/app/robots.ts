import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.strikeberlin.com.br').replace(/\/+$/, '')
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/obrigado'] }], sitemap: `${base}/sitemap.xml` }
}
