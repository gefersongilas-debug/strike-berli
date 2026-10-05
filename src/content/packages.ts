/**
 * Pacotes e preços, copiados do site antigo (GreatPages) em 05/10/2026.
 * ⚠️ Confirmar a vigência com a Roseli antes de anunciar preço.
 */

export type DayKey = 'semana' | 'sexta' | 'sabado'

export const DAYS: Array<{ key: DayKey; label: string; short: string }> = [
  { key: 'semana', label: 'Segunda a quinta', short: 'Seg–Qui' },
  { key: 'sexta', label: 'Sexta', short: 'Sexta' },
  { key: 'sabado', label: 'Sábado', short: 'Sábado' },
]

export interface Package {
  id: string
  name: string
  /** Para quem o pacote foi pensado. */
  idealFor: string
  items: string[]
  /** Preço cheio → preço do pacote, por dia. */
  prices: Record<DayKey, { from: number; to: number }>
  highlight?: boolean
}

export const PACKAGES: Package[] = [
  {
    id: 'pista-1h',
    name: 'Pista 1 hora',
    idealFor: 'Casal, amigos ou família pequena',
    items: ['1 hora de boliche', '1 fritas 500 g', '1,5 L de chopp ou 4 refris lata', '1 partida de realidade virtual para 2'],
    prices: {
      semana: { from: 198, to: 169 },
      sexta: { from: 218, to: 189 },
      sabado: { from: 248, to: 209 },
    },
  },
  {
    id: 'pista-2h',
    name: 'Pista 2 horas',
    idealFor: 'A turma inteira jogando sem pressa',
    items: ['2 horas de boliche', '1 fritas 500 g', '2,5 L de chopp ou 6 refris lata', '1 partida de realidade virtual para 2'],
    prices: {
      semana: { from: 307, to: 239 },
      sexta: { from: 347, to: 279 },
      sabado: { from: 407, to: 339 },
    },
  },
  {
    id: 'festa',
    name: 'Combo Festa',
    idealFor: 'Aniversário e confraternização',
    items: [
      '2 horas de boliche',
      '100 salgados e 50 doces',
      '10 refris ou torre de 2,5 L de chopp Imigração',
      '10 fichas de game',
      '1 partida de realidade virtual para 2',
      '2 entradas cortesia',
    ],
    prices: {
      semana: { from: 553, to: 459 },
      sexta: { from: 593, to: 499 },
      sabado: { from: 653, to: 549 },
    },
    highlight: true,
  },
  {
    id: 'burger',
    name: 'Combo Burger',
    idealFor: 'Happy hour e turma de amigos',
    items: [
      '2 horas de boliche',
      '10 hambúrgueres (carne ou frango) e 2 fritas 500 g',
      '10 refris ou torre de 2,5 L de chopp Imigração',
      '10 fichas de game',
      '1 partida de realidade virtual para 2',
      '2 entradas cortesia',
    ],
    prices: {
      semana: { from: 716, to: 599 },
      sexta: { from: 756, to: 649 },
      sabado: { from: 816, to: 699 },
    },
  },
]

export function brl(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}
