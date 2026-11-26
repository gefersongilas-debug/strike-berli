import { NextResponse, type NextRequest } from 'next/server'
import { parsePublicConfig } from '@/lib/config'
import { captureTrackingCookies } from '@/lib/tracking/capture'

const publicConfig = parsePublicConfig(process.env)

export function proxy(request: NextRequest) {
  // Link da bio sem UTM (ex.: /bio puro): marca a origem antes de gravar os cookies.
  if (request.nextUrl.pathname === '/bio' && !request.nextUrl.searchParams.has('utm_source') && request.method === 'GET') {
    const url = request.nextUrl.clone()
    url.searchParams.set('utm_source', 'instagram')
    url.searchParams.set('utm_medium', 'bio')
    url.searchParams.set('utm_campaign', 'link-bio')
    return NextResponse.redirect(url, 307)
  }

  const response = NextResponse.next()

  // Só navegação de página (não prefetch, não fetch de dados).
  const dest = request.headers.get('sec-fetch-dest')
  if (request.method !== 'GET' || (dest && dest !== 'document') || request.headers.has('next-router-prefetch')) {
    return response
  }

  const cookies = captureTrackingCookies({
    url: request.nextUrl,
    referrer: request.headers.get('referer') ?? undefined,
    get: (name) => request.cookies.get(name)?.value,
    cfg: publicConfig,
    now: Date.now(),
    random: Math.random,
    uuid: () => crypto.randomUUID(),
  })

  const secure = request.nextUrl.protocol === 'https:'
  for (const c of cookies) {
    response.cookies.set({ name: c.name, value: c.value, maxAge: c.maxAge, path: '/', sameSite: 'lax', secure })
  }
  return response
}

export const config = {
  // Tudo, menos API, assets do Next e arquivos estáticos.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.[a-zA-Z0-9]+$).*)'],
}
