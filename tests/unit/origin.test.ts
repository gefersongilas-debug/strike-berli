import { describe, expect, it } from 'vitest'
import { textForOrigin, visitOrigin } from '@/lib/tracking/origin'
import type { Attribution } from '@/lib/tracking/attribution'

const base = (o: Partial<Attribution>): Attribution => o as Attribution

describe('origem da visita', () => {
  it('gclid ou utm google = google', () => {
    expect(visitOrigin(base({ gclid: 'abc' }))).toBe('google')
    expect(visitOrigin(base({ lastTouch: { utm_source: 'google', ts: 1 } as never }))).toBe('google')
  })
  it('fbc ou utm instagram/facebook = meta', () => {
    expect(visitOrigin(base({ fbc: 'fb.1.1700000000000.x' }))).toBe('meta')
    expect(visitOrigin(base({ lastTouch: { utm_source: 'ig', ts: 1 } as never }))).toBe('meta')
  })
  it('utm_medium=bio = link da bio', () => {
    expect(visitOrigin(base({ lastTouch: { utm_source: 'instagram', utm_medium: 'bio', ts: 1 } as never }))).toBe('bio')
    expect(textForOrigin('Oi! Vim pelo site e quero reservar.', 'bio')).toBe('Oi! Vim pelo link do Instagram e quero reservar.')
  })
  it('sem sinal = site', () => {
    expect(visitOrigin(base({}))).toBe('site')
  })
  it('troca a origem na mensagem pronta', () => {
    expect(textForOrigin('Oi! Vim pelo site e quero reservar.', 'google')).toBe('Oi! Vim pelo Google e quero reservar.')
    expect(textForOrigin('Oi! Vim pelo site e quero reservar.', 'site')).toBe('Oi! Vim pelo site e quero reservar.')
  })
})
