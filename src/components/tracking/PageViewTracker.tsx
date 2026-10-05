'use client'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { trackEvent } from './track'

/** PageView a cada troca de rota (App Router não recarrega a página). */
export function PageViewTracker() {
  const pathname = usePathname()
  const search = useSearchParams()
  const last = useRef<string | null>(null)

  useEffect(() => {
    const url = `${pathname}?${search.toString()}`
    if (last.current === url) return // StrictMode roda o efeito duas vezes em dev
    last.current = url
    trackEvent('page_view')
  }, [pathname, search])

  return null
}
