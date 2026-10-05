/**
 * Dados da casa. Tudo que muda com o negócio (telefone, link de reserva,
 * horário) fica aqui — as páginas só leem.
 */

export const SITE = {
  name: 'Strike Berlin',
  tagline: 'Boliche Sport Bar',
  legalName: 'Strike Berlin Boliche e Choperia Ltda',
  cnpj: '30.132.833/0001-77',
  city: 'São Leopoldo',
  address: {
    street: 'Av. João Corrêa, 1008',
    district: 'Centro',
    city: 'São Leopoldo',
    state: 'RS',
    zip: '93020-668',
  },
  /** Número do WhatsApp da casa, só dígitos com DDI. */
  whatsapp: '5551997875096',
  phoneDisplay: '(51) 99787-5096',
  instagram: 'https://www.instagram.com/strikeberlinsl/',
  instagramHandle: '@strikeberlinsl',
  /** Reserva online (Eleven Tickets). O link recebe UTM/gclid/fbclid no clique. */
  reservationUrl: 'https://eleventickets.com/strike-berlin/strike-berlin',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Strike+Berlin+Av.+Jo%C3%A3o+Corr%C3%AAa+1008+S%C3%A3o+Leopoldo+RS',
  mapsEmbed: 'https://www.google.com/maps?q=Strike+Berlin,+Av.+Jo%C3%A3o+Corr%C3%AAa,+1008,+S%C3%A3o+Leopoldo+-+RS&output=embed',
  reviewsUrl: 'https://www.google.com/maps/search/?api=1&query=Strike+Berlin+S%C3%A3o+Leopoldo',
  rating: { value: 4.5, count: 1200 },
  /**
   * Horário de funcionamento. Vazio = o site manda consultar no WhatsApp.
   * ⚠️ A CONFIRMAR com a Roseli: Google e diretórios mostram horários diferentes.
   * Ex.: [{ days: 'Terça a sábado', hours: '18h à 1h' }]
   */
  hours: [] as Array<{ days: string; hours: string }>,
  entryFee: 'R$ 10 por pessoa, com 1 água 500 ml de cortesia',
} as const

/**
 * Regras da casa publicadas no Eleven Tickets (conferidas em 05/10/2026).
 * São a fonte para FAQ e páginas — não invente regra fora desta lista.
 */
export const RULES = {
  entry: 'A entrada custa R$ 10 por pessoa e inclui 1 água de 500 ml de cortesia.',
  onlineFreeEntry: 'Reservando online, você ganha 1 entrada gratuita (com 1 água de 500 ml).',
  kidsFree: 'Crianças menores de 9 anos não pagam entrada (é preciso apresentar documento).',
  minors: 'Menores de 18 anos ficam acompanhados por um responsável maior de idade o tempo todo.',
  noOutsideFood: 'Não é permitido trazer alimentos ou bebidas de fora.',
  perLane: 'Cada pista recebe até 12 pessoas, jogando em até 6 duplas revezando.',
  birthday: 'Aniversariante ganha um petit gâteau no mês do aniversário (de 3 dias antes a 3 dias depois da data).',
  combosWhatsapp: 'Combos são fechados só pelo WhatsApp.',
  late: 'Atrasou? Avise pelo WhatsApp para tentar manter a pista; o tempo perdido não é acrescentado.',
  cancel: 'Não há reembolso da reserva. Com aviso de até 4 horas antes, dá para remarcar ou deixar o valor como crédito por 30 dias.',
} as const

export const WHATSAPP_TEXT = {
  default: 'Oi! Vim pelo site e quero reservar uma pista no Strike.',
  aniversario: 'Oi! Vim pelo site e quero fazer um aniversário no Strike.',
  empresas: 'Oi! Vim pelo site e quero uma proposta de confraternização para a minha empresa.',
  vr: 'Oi! Vim pelo site e quero saber da realidade virtual.',
  pacotes: 'Oi! Vim pelo site e quero saber dos pacotes.',
  diaCriancas: 'Oi! Vim pelo site e quero a oferta de Dia das Crianças com doce extra.',
  halloween: 'Oi! Vim pelo site e quero reservar para o Halloween no Strike.',
  grupos: 'Oi! Vim pelo site e quero uma proposta de confraternização para um grupo.',
  duvida: 'Oi! Vim pelo site e tenho uma dúvida.',
} as const

export type WhatsAppContext = keyof typeof WHATSAPP_TEXT

export function whatsappHref(text: string = WHATSAPP_TEXT.default): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`
}

export const NAV = [
  { href: '/#atracoes', label: 'Atrações' },
  { href: '/pacotes', label: 'Pacotes' },
  { href: '/aniversario', label: 'Aniversários' },
  { href: '/confraternizacao', label: 'Confraternização' },
  { href: '/realidade-virtual', label: 'Realidade virtual' },
] as const

export const FOOTER_EXTRA = [
  { href: '/empresas', label: 'Empresas' },
  { href: '/dia-das-criancas', label: 'Dia das Crianças' },
  { href: '/halloween', label: 'Halloween' },
] as const

export const fullAddress = `${SITE.address.street} · ${SITE.address.district} · ${SITE.address.city}/${SITE.address.state}`
