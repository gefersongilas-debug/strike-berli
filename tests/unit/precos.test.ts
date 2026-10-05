/**
 * Preços conferidos nas fontes em 05/10/2026. Se este teste quebrar, alguém mudou
 * um preço: confira a fonte de novo e atualize os dois lugares, com a data.
 *   - combos: strikeberlin.com.br (GreatPages), seção "Tipos de grupo"
 *   - pista avulsa: eleventickets.com/strike-berlin/strike-berlin (1 hora, sem taxa)
 */
import { describe, expect, it } from 'vitest'
import { LANE_FEE_PCT, LANE_PRICES, PACKAGES, PEOPLE_PER_LANE } from '@/content/packages'

const CONFERIDO = {
  'pista-1h': { semana: [198, 169], sexta: [218, 189], sabado: [248, 209] },
  'pista-2h': { semana: [307, 239], sexta: [347, 279], sabado: [407, 339] },
  festa: { semana: [553, 459], sexta: [593, 499], sabado: [653, 549] },
  burger: { semana: [716, 599], sexta: [756, 649], sabado: [816, 699] },
} as const

describe('preços conferidos (05/10/2026)', () => {
  it('combos batem com o site atual', () => {
    for (const p of PACKAGES) {
      const ref = CONFERIDO[p.id as keyof typeof CONFERIDO]
      expect(ref, `pacote ${p.id} sem conferência`).toBeDefined()
      for (const day of ['semana', 'sexta', 'sabado'] as const) {
        expect([p.prices[day].from, p.prices[day].to], `${p.id} ${day}`).toEqual(ref[day])
      }
    }
  })

  it('itens do Combo Festa batem com o site atual', () => {
    const festa = PACKAGES.find((p) => p.id === 'festa')!
    expect(festa.items.join(' | ')).toMatch(/100 salgados e 50 doces/)
    expect(festa.items.join(' | ')).toMatch(/2 entradas cortesia/)
  })

  it('pista avulsa bate com o Eleven Tickets', () => {
    expect(LANE_PRICES).toEqual({ semana: 79, sexta: 99, sabado: 129 })
    expect(LANE_FEE_PCT).toBe(10)
    expect(PEOPLE_PER_LANE).toBe(12)
  })
})
