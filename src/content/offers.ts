/**
 * Ofertas sazonais. Cada uma some sozinha do site depois de `until` (fim do dia,
 * horário de Brasília). Só entra aqui oferta confirmada pelo cliente.
 */
export const OFFERS = {
  diaDasCriancas: {
    title: 'Doce extra para a criançada',
    // ⚠️ Confirmar com a Roseli: quantidade de doces, em quais combos vale e até quando.
    text: 'Fechando a festa ou o combo da criançada pelo WhatsApp no Dia das Crianças, tem doce extra por nossa conta.',
    fine: 'Condições e quantidade com o atendimento, pelo WhatsApp.',
    until: '2026-10-12',
  },
} as const

export const SEASON = {
  diaDasCriancas: { date: '2026-10-12', until: '2026-10-12', label: 'Dia das Crianças' },
  halloween: { date: '2026-10-31', from: '2026-10-13', until: '2026-10-31', label: 'Halloween' },
} as const
