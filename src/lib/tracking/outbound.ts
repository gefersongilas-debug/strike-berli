/**
 * Link de saída para o site de reservas (Eleven Tickets) carregando a origem da
 * visita. O Eleven Tickets tem o pixel da Strike e o GA4 que o Google Ads importa
 * como compra: sem isto, toda reserva que passa pelo site chega lá como
 * "strikeberlin.com.br / referral" e a campanha que trouxe a pessoa some.
 *
 * - click ids (gclid/gbraid/wbraid/fbclid) vão sempre que existirem — é o mesmo
 *   comportamento dos cookies _gcl_aw/_fbc das próprias plataformas (90 dias);
 * - UTMs só se o último toque com campanha for recente, para uma visita orgânica
 *   de hoje não herdar a campanha de semanas atrás;
 * - com banner de consentimento e sem "Aceitar", nenhum click id sai do site.
 */
import { UTM_KEYS, type Attribution } from './attribution'

export const UTM_FRESH_MS = 24 * 60 * 60 * 1000

/** `_fbc` = fb.1.<ms>.<fbclid> → fbclid */
export function fbclidFromFbc(fbc: string | undefined): string | undefined {
  const m = fbc ? /^fb\.\d\.\d{10,13}\.(.+)$/.exec(fbc) : null
  return m?.[1]
}

export function decorateOutboundUrl(
  href: string,
  a: Attribution,
  opts: { now: number; adsAllowed: boolean },
): string {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return href
  }
  const setIfAbsent = (k: string, v: string | undefined) => {
    if (v && !url.searchParams.has(k)) url.searchParams.set(k, v)
  }

  const touch = a.lastTouch
  if (touch && opts.now - touch.ts <= UTM_FRESH_MS) {
    for (const k of UTM_KEYS) setIfAbsent(k, touch[k])
  }
  if (opts.adsAllowed) {
    setIfAbsent('gclid', a.gclid)
    setIfAbsent('gbraid', a.gbraid)
    setIfAbsent('wbraid', a.wbraid)
    setIfAbsent('fbclid', fbclidFromFbc(a.fbc))
  }
  return url.toString()
}
