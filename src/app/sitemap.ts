import type { MetadataRoute } from 'next'

const PAGES = [
  '',
  '/pacotes',
  '/aniversario',
  '/dia-das-criancas',
  '/halloween',
  '/confraternizacao',
  '/empresas',
  '/realidade-virtual',
  '/privacidade',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.strikeberlin.com.br').replace(/\/+$/, '')
  return PAGES.map((p) => ({ url: `${base}${p}`, changeFrequency: 'monthly', priority: p === '' ? 1 : 0.7 }))
}
