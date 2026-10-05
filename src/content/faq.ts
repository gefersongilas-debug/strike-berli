import { RULES } from './site'

export interface Faq {
  q: string
  a: string
}

export const FAQ_GERAL: Faq[] = [
  { q: 'É cobrada entrada?', a: `Sim. ${RULES.entry} ${RULES.onlineFreeEntry} ${RULES.kidsFree}` },
  {
    q: 'Preciso reservar?',
    a: 'Não é obrigatório, mas a reserva garante o horário. Sem reserva pode não ter pista livre quando você chegar — principalmente sexta e sábado.',
  },
  {
    q: 'Como funciona o pagamento da reserva?',
    a: 'Para confirmar, é cobrado um pagamento antecipado de 50% do valor. Na reserva online o pagamento é feito no próprio site de reservas; pelo WhatsApp, o atendimento envia as opções.',
  },
  { q: 'Menores de idade podem entrar?', a: `Sim. ${RULES.minors}` },
  {
    q: 'Fliperama e sinuca estão inclusos no boliche?',
    a: 'Não, são cobrados à parte. O fliperama funciona com fichas de valores variados e a sinuca tem valor conforme o dia. Os combos de festa já trazem 10 fichas de game, e todo pacote inclui uma partida de realidade virtual.',
  },
  {
    q: 'Criança consegue jogar boliche?',
    a: 'Consegue. As pistas têm canaletas automáticas (a bola não cai na canaleta) e lançador de bola para crianças e pessoas com deficiência.',
  },
  { q: 'O espaço é acessível?', a: 'Sim: elevador até o mezanino, lançador de bola para PcD e ambiente climatizado.' },
  { q: 'Quantas pessoas cabem numa pista?', a: RULES.perLane },
  { q: 'Posso levar bolo, comida ou bebida?', a: `${RULES.noOutsideFood} O Strike tem kits com torta, doces e salgados, petiscos e gastrobar.` },
  { q: 'E se eu atrasar ou precisar remarcar?', a: `${RULES.late} ${RULES.cancel}` },
]

export const FAQ_ANIVERSARIO: Faq[] = [
  {
    q: 'O que vem no Combo Festa?',
    a: '2 horas de boliche, 100 salgados e 50 doces, 10 refris ou uma torre de 2,5 L de chopp, 10 fichas de game, 1 partida de realidade virtual para 2 e 2 entradas cortesia.',
  },
  { q: 'Aniversariante ganha alguma coisa?', a: RULES.birthday },
  { q: 'Posso levar o bolo?', a: `${RULES.noOutsideFood} Para a festa, o Strike tem kits com torta, doces e salgados — combine pelo WhatsApp.` },
  {
    q: 'Qual o melhor dia para fazer a festa?',
    a: 'De segunda a quinta: o pacote sai mais em conta e a casa está mais tranquila. Fim de semana as datas acabam rápido, então reserve com antecedência.',
  },
  FAQ_GERAL[3],
  FAQ_GERAL[5],
  FAQ_GERAL[2],
]

export const FAQ_EMPRESAS: Faq[] = [
  { q: 'Vocês emitem nota fiscal para empresa?', a: 'Sim. É só pedir na hora de fechar a proposta.' },
  {
    q: 'Cabe a equipe inteira?',
    a: 'São 4 pistas de boliche, 5 mesas de sinuca, fliperama, karaokê e gastrobar com mesas e camarotes. Conta quantas pessoas são no formulário que a gente monta o formato certo.',
  },
  {
    q: 'Dá pra fechar a casa ou um horário só para a empresa?',
    a: 'Fala com a gente pelo WhatsApp ou pelo formulário com data e número de pessoas — o atendimento responde com as opções.',
  },
  FAQ_GERAL[2],
  FAQ_GERAL[0],
]

export const FAQ_VR: Faq[] = [
  {
    q: 'Como funciona a partida de realidade virtual?',
    a: 'Você coloca o óculos e joga dentro do jogo. A partida é para 2 jogadores — dá pra disputar com quem veio junto.',
  },
  {
    q: 'A realidade virtual está inclusa nos pacotes?',
    a: 'Sim. Todos os pacotes de boliche trazem 1 partida de realidade virtual para 2 jogadores.',
  },
  {
    q: 'Tem idade mínima? Quais jogos tem?',
    a: 'Chama no WhatsApp que o atendimento te passa a idade indicada e os jogos disponíveis no dia.',
  },
  FAQ_GERAL[0],
]

export const FAQ_DIA_CRIANCAS: Faq[] = [
  { q: 'Criança paga entrada?', a: `${RULES.kidsFree} Acima disso, ${RULES.entry.charAt(0).toLowerCase()}${RULES.entry.slice(1)}` },
  {
    q: 'Dá para reservar online no feriado de 12/10?',
    a: 'O site de reservas não abre horários para domingo nem para o feriado de 12/10. Para esses dias, chama no WhatsApp que o atendimento confirma o horário.',
  },
  { q: 'Como funciona o doce extra?', a: 'Vale para festa e combos fechados pelo WhatsApp no Dia das Crianças. O atendimento passa a quantidade e as condições.' },
  FAQ_GERAL[5],
  { q: 'Posso levar doces ou bolo de casa?', a: `${RULES.noOutsideFood} Os combos de festa já trazem doces e salgados.` },
]

export const FAQ_HALLOWEEN: Faq[] = [
  {
    q: 'Quanto custa a pista no Halloween?',
    a: 'Sábado, 31/10, a pista sai R$ 129 a hora no site de reservas (mais a taxa do site), para até 12 pessoas. Sexta, 30/10, R$ 99 a hora.',
  },
  { q: 'Precisa reservar?', a: 'Fim de semana lota rápido, e o Halloween cai num sábado. Reservando online, a pista fica garantida — e você ganha 1 entrada gratuita.' },
  FAQ_GERAL[0],
  { q: 'Menores de idade podem ir?', a: `Sim. ${RULES.minors}` },
]

export const FAQ_GRUPOS: Faq[] = [
  {
    q: 'Quantas pessoas jogam ao mesmo tempo?',
    a: `São 4 pistas. ${RULES.perLane} Com a casa toda, até 48 pessoas jogam boliche ao mesmo tempo — e o resto da turma curte sinuca, fliperama, karaokê e o gastrobar enquanto reveza.`,
  },
  { q: 'Vocês emitem nota fiscal?', a: 'Sim, é só pedir na hora de fechar a proposta.' },
  { q: 'Como fecho comida e bebida para o grupo?', a: `${RULES.combosWhatsapp} Para grupo grande, o atendimento monta a proposta com os combos e o gastrobar.` },
  FAQ_GERAL[2],
  { q: 'Posso levar comida ou bebida?', a: RULES.noOutsideFood },
]
