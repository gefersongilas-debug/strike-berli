export interface Faq {
  q: string
  a: string
}

export const FAQ_GERAL: Faq[] = [
  { q: 'É cobrada entrada?', a: 'Sim. A entrada custa R$ 10 por pessoa e inclui 1 água de 500 ml de cortesia.' },
  {
    q: 'Preciso reservar?',
    a: 'Não é obrigatório, mas a reserva garante o horário. Sem reserva pode não ter pista livre quando você chegar — principalmente sexta e sábado.',
  },
  {
    q: 'Como funciona o pagamento da reserva?',
    a: 'Para confirmar, é cobrado um pagamento antecipado de 50% do valor. Na reserva online o pagamento é feito no próprio site de reservas; pelo WhatsApp, o atendimento envia as opções.',
  },
  { q: 'Menores de idade podem entrar?', a: 'Sim, desde que acompanhados por um responsável legal.' },
  {
    q: 'Fliperama e sinuca estão inclusos no boliche?',
    a: 'Não, são cobrados à parte. O fliperama funciona com fichas de valores variados e a sinuca tem valor conforme o dia. Os combos de festa já trazem 10 fichas de game, e todo pacote inclui uma partida de realidade virtual.',
  },
  {
    q: 'Criança consegue jogar boliche?',
    a: 'Consegue. As pistas têm canaletas automáticas (a bola não cai na canaleta) e lançador de bola para crianças e pessoas com deficiência.',
  },
  { q: 'O espaço é acessível?', a: 'Sim: elevador até o mezanino, lançador de bola para PcD e ambiente climatizado.' },
]

export const FAQ_ANIVERSARIO: Faq[] = [
  {
    q: 'O que vem no Combo Festa?',
    a: '2 horas de boliche, 100 salgados e 50 doces, 10 refris ou uma torre de 2,5 L de chopp, 10 fichas de game, 1 partida de realidade virtual para 2 e 2 entradas cortesia.',
  },
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
