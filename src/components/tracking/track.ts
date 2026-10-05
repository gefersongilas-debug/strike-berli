'use client'
/** Atalhos para componentes client — já ligados à config pública e ao `window`. */
import { applyConsent, fireBrowserEvent, readConsent, trackEventWith, type BrowserUser, type Params, type TrackingWindow } from '@/lib/tracking/client'
import type { ConsentValue } from '@/lib/tracking/cookies'
import type { EventKey } from '@/lib/tracking/events'
import { publicConfig } from '@/lib/tracking/public-config'

const win = () => window as unknown as TrackingWindow

export function trackEvent(key: EventKey, params?: Params): string {
  return trackEventWith(key, publicConfig, win(), params)
}

/** Lead: o servidor já enviou CAPI/GA4/Ads; aqui só o disparo do browser com o mesmo id. */
export function trackLeadInBrowser(eventId: string, user: BrowserUser): void {
  fireBrowserEvent('lead', eventId, publicConfig, win(), { user })
}

export function getConsent(): ConsentValue | undefined {
  return readConsent(win())
}

export function setConsent(value: ConsentValue): void {
  applyConsent(value, win())
}
