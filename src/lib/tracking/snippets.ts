/**
 * Scripts de inicialização por modo. Gerados como string pura para poderem ser
 * testados sem browser: o teste garante que "direct" carrega pixel/gtag e não
 * GTM, e que "gtm" carrega só o GTM.
 */
import type { PublicConfig } from '@/lib/config'
import { COOKIES } from './cookies'

const j = (v: string) => JSON.stringify(v)

function base(cfg: PublicConfig): string {
  let s = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;`
  if (cfg.consentMode === 'banner') {
    s +=
      `var trkG=document.cookie.split('; ').indexOf(${j(`${COOKIES.consent}=granted`)})>-1?'granted':'denied';` +
      `gtag('consent','default',{ad_storage:trkG,ad_user_data:trkG,ad_personalization:trkG,analytics_storage:trkG,wait_for_update:500});`
  }
  s += `dataLayer.push({trk_mode:${j(cfg.mode)}});`
  return s
}

function metaPixel(pixelId: string, cfg: PublicConfig): string {
  return (
    `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};` +
    `if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;` +
    `s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');` +
    // PageView é disparado pelo PageViewTracker (com eventID), não pelo histórico automático.
    `fbq.disablePushState=true;` +
    (cfg.consentMode === 'banner' ? `if(trkG!=='granted')fbq('consent','revoke');` : '') +
    `fbq('init',${j(pixelId)});`
  )
}

function gtagLoader(ids: string[], cfg: PublicConfig): string {
  let s =
    `(function(){var t=document.createElement('script');t.async=true;t.src='https://www.googletagmanager.com/gtag/js?id='+${j(ids[0])};` +
    `document.head.appendChild(t)})();gtag('js',new Date());`
  // Linker: leva o _gl (client id do GA4 e gclid) para o site de reservas.
  if (cfg.linkerDomains.length) s += `gtag('set','linker',{domains:${JSON.stringify(cfg.linkerDomains)}});`
  if (cfg.ga4Id) s += `gtag('config',${j(cfg.ga4Id)});`
  if (cfg.googleAdsId) s += `gtag('config',${j(cfg.googleAdsId)},{allow_enhanced_conversions:true});`
  return s
}

function gtmLoader(gtmId: string): string {
  return (
    `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});` +
    `var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;` +
    `j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${j(gtmId)});`
  )
}

export function buildInitScript(cfg: PublicConfig): string {
  let s = base(cfg)
  if (cfg.mode === 'gtm') {
    if (cfg.gtmId) s += gtmLoader(cfg.gtmId)
    return s
  }
  if (cfg.metaPixelId) s += metaPixel(cfg.metaPixelId, cfg)
  const googleIds = [cfg.ga4Id, cfg.googleAdsId].filter((v): v is string => !!v)
  if (googleIds.length) s += gtagLoader(googleIds, cfg)
  return s
}

export function gtmNoscriptSrc(cfg: PublicConfig): string | null {
  return cfg.mode === 'gtm' && cfg.gtmId ? `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(cfg.gtmId)}` : null
}
