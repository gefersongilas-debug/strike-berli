/**
 * Atrações da casa. `photo` usa foto real de /public/img; sem foto, entra a
 * ilustração (`art`). Fatos não confirmados ficam de fora: idade mínima do VR,
 * "único VR da região", karaokê novo.
 */
export type ArtKey = 'vr' | 'pool' | 'karaoke' | 'gastro'

export interface Attraction {
  id: string
  title: string
  kicker: string
  text: string
  photo?: { src: string; alt: string }
  art?: ArtKey
  href?: string
}

export const ATTRACTIONS: Attraction[] = [
  {
    id: 'boliche',
    title: 'Boliche',
    kicker: '4 pistas profissionais',
    text: 'Telão interativo, canaletas automáticas e lançador de bola para crianças e PcD. Do primeiro strike ao último, todo mundo joga.',
    photo: { src: '/img/pistas-vertical.jpg', alt: 'Pistas de boliche iluminadas em neon azul no Strike Berlin' },
    href: '/pacotes',
  },
  {
    id: 'realidade-virtual',
    title: 'Realidade virtual',
    kicker: 'Partida para dois',
    text: 'Coloca o óculos e cai dentro do jogo. Dá pra disputar com quem veio junto — e todo pacote já inclui uma partida.',
    art: 'vr',
    href: '/realidade-virtual',
  },
  {
    id: 'fliperama',
    title: 'Fliperama',
    kicker: 'Games e air hockey',
    text: 'Air hockey, máquina de pelúcia e jogos eletrônicos com fichas. A criançada some aqui — e os adultos também.',
    photo: { src: '/img/air-hockey.jpg', alt: 'Mesa de air hockey iluminada no fliperama do Strike Berlin' },
  },
  {
    id: 'sinuca',
    title: 'Sinuca',
    kicker: '5 mesas',
    text: 'Três mesas oficiais brasileiras e duas de caçapa, pra quem prefere tacada a arremesso.',
    art: 'pool',
  },
  {
    id: 'karaoke',
    title: 'Karaokê',
    kicker: 'Microfone aberto',
    text: 'Pra quem canta bem, pra quem acha que canta e pra quem só vai depois do segundo chopp.',
    art: 'karaoke',
  },
  {
    id: 'gastrobar',
    title: 'Gastrobar',
    kicker: 'Chopp Imigração gelado',
    text: 'Petiscos, hambúrguer e kits de festa com torta, doces e salgados. Drinks, vinhos e espumante pra brindar o strike.',
    art: 'gastro',
    href: '/pacotes',
  },
]

export const STRUCTURE = [
  'Ambiente climatizado',
  'Elevador até o mezanino',
  'Lançador de bola para crianças e PcD',
  'Canaletas automáticas',
  'Mesas e camarotes',
  'Nota fiscal para empresa',
]
