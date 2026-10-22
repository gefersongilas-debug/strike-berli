/**
 * Tema sazonal do site inteiro (hoje: Halloween). Liga sozinho dentro da janela
 * de `SEASON.halloween` e desliga sozinho depois — sem deploy. O script do
 * <head> (layout.tsx) põe a classe `is-halloween` no <html> antes da primeira
 * pintura; o CSS faz o resto. `?tema=halloween` ou `?tema=normal` força um dos
 * dois, para prévia.
 */
import { SEASON } from '@/content/offers'

export const HALLOWEEN_CLASS = 'is-halloween'

const ms = (d: string, end: boolean) => new Date(`${d}T${end ? '23:59:59' : '00:00:00'}-03:00`).getTime()

export function seasonThemeScript(): string {
  const from = ms(SEASON.halloween.from, false)
  const until = ms(SEASON.halloween.until, true)
  return `(function(){var d=document.documentElement;d.classList.add('js');var t=new URLSearchParams(location.search).get('tema'),n=Date.now();if(t?t==='halloween':n>=${from}&&n<=${until})d.classList.add('${HALLOWEEN_CLASS}')})()`
}
