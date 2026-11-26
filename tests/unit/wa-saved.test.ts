import { describe, expect, it } from 'vitest'
import { parseSaved, skipsForm } from '@/lib/tracking/wa-saved'

const NOW = 1_800_000_000_000
const DAY = 24 * 60 * 60 * 1000
const saved = { name: 'Maria', phone: '51999999999', ts: NOW - DAY, origin: 'google' as const }

describe('formulário antes do WhatsApp: quando pular', () => {
  it('mesma origem dentro de 30 dias vai direto', () => {
    expect(skipsForm(saved, 'google', NOW)).toBe(true)
  })
  it('origem diferente pede de novo', () => {
    expect(skipsForm(saved, 'bio', NOW)).toBe(false)
  })
  it('passados 30 dias pede de novo, mesmo na mesma origem', () => {
    expect(skipsForm({ ...saved, ts: NOW - 30 * DAY }, 'google', NOW)).toBe(false)
  })
  it('quem nunca preencheu vê o formulário', () => {
    expect(skipsForm(undefined, 'site', NOW)).toBe(false)
  })
})

describe('leitura do strike_wa_lead', () => {
  it('valor antigo, sem origem, preenche os campos mas pede de novo', () => {
    const old = parseSaved(JSON.stringify({ name: 'Maria', phone: '51999999999', ts: NOW - DAY }))
    expect(old).toMatchObject({ name: 'Maria', phone: '51999999999' })
    expect(skipsForm(old, 'site', NOW)).toBe(false)
  })
  it('valor vazio ou quebrado é ignorado', () => {
    expect(parseSaved(null)).toBeUndefined()
    expect(parseSaved('{')).toBeUndefined()
    expect(parseSaved('{"name":"x"}')).toBeUndefined()
  })
  it('nome ou telefone que não são texto viram vazio', () => {
    expect(parseSaved(`{"ts":${NOW}}`)).toMatchObject({ name: '', phone: '' })
  })
})
