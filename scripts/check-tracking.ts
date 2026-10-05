/**
 * Checagem de configuração do tracking.
 *
 *   npm run check:tracking          valida as envs (roda sozinho antes de todo `next build`)
 *   npm run check:tracking:live     + testa as credenciais nas APIs reais, sem sujar dados:
 *                                     - GTM publicado? - token da Meta alcança o pixel?
 *                                     - payload GA4 válido (endpoint /debug)?
 *                                     - ação de conversão do Google Ads existe e é UPLOAD_CLICKS?
 *                                     - site no ar carrega os scripts do modo certo?
 *                                     - Kommo: token, funil/etapa e campos do KOMMO_FIELD_MAP existem?
 *   ... --live --crm                + envia um lead de TESTE para o CRM
 *
 * Nunca imprime valor de token/secret.
 */
import nextEnv from '@next/env'
import { parseServerConfig, validateTrackingConfig } from '@/lib/config'
import { checkKommoAccess, sendLeadToCrm } from '@/lib/crm'
import { buildGa4Payload, validateGa4Payload } from '@/lib/server/ga4-mp'
import { checkGoogleAdsConversionAction } from '@/lib/server/google-ads'
import { checkMetaPixelAccess, sendMetaEvent } from '@/lib/server/meta-capi'
import type { DestinationResult, ServerEvent } from '@/lib/server/types'

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV === 'development')

const args = new Set(process.argv.slice(2))
const live = args.has('--live')
const color = (c: number) => (s: string) => (process.stdout.isTTY ? `\x1b[${c}m${s}\x1b[0m` : s)
const red = color(31)
const yellow = color(33)
const green = color(32)
const dim = color(2)

async function main() {
  if (process.env.SKIP_TRACKING_CHECK && !live) {
    console.warn(yellow('⚠ SKIP_TRACKING_CHECK definido — checagem de tracking pulada.'))
    return 0
  }

  const { errors, warnings, summary } = validateTrackingConfig(process.env)

  console.log('\nTracking — configuração')
  for (const [k, v] of Object.entries(summary)) console.log(`  ${dim(k.padEnd(24))} ${v}`)
  for (const w of warnings) console.log(yellow(`  ⚠ ${w}`))
  for (const e of errors) console.log(red(`  ✖ ${e}`))

  if (errors.length) {
    console.log(red(`\n${errors.length} erro(s) de configuração. Corrija as envs (Vercel → Settings → Environment Variables).\n`))
    return 1
  }
  console.log(green('  ✔ configuração válida'))

  if (!live) return 0
  return (await liveChecks()) ? 0 : 1
}

async function liveChecks(): Promise<boolean> {
  const cfg = parseServerConfig(process.env)
  const results: Array<[string, DestinationResult]> = []
  const run = async (label: string, fn: () => Promise<DestinationResult>) => {
    try {
      results.push([label, await fn()])
    } catch (e) {
      results.push([label, { status: 'failed', detail: e instanceof Error ? e.message : String(e) }])
    }
  }

  const now = Math.floor(Date.now() / 1000)
  const sample: ServerEvent = {
    key: 'lead',
    eventId: `check-${now}`,
    eventTime: now,
    user: { email: 'teste@example.com', phone: '11999998888', name: 'Teste Tracking' },
    attribution: { gaClientId: '123456789.1700000000', gaSessionId: String(now) },
    context: { sourceUrl: cfg.public.siteUrl ?? 'https://example.com', userAgent: 'check-tracking', ip: '200.200.200.200' },
    consentGranted: true,
  }

  if (cfg.public.mode === 'gtm' && cfg.public.gtmId) {
    await run('GTM container publicado', async () => {
      const res = await fetch(`https://www.googletagmanager.com/gtm.js?id=${cfg.public.gtmId}`)
      return res.ok
        ? { status: 'sent', detail: cfg.public.gtmId }
        : { status: 'failed', detail: `HTTP ${res.status} — id errado ou container nunca publicado` }
    })
  }

  if (cfg.meta) {
    const meta = cfg.meta
    await run('Meta: token alcança o pixel', () => checkMetaPixelAccess(meta))
    if (meta.testEventCode) {
      await run('Meta: evento de teste (Testar eventos)', () => sendMetaEvent(sample, meta))
    } else {
      results.push(['Meta: evento de teste', { status: 'skipped', detail: 'defina META_TEST_EVENT_CODE (só fora de produção) para enviar um' }])
    }
  }

  if (cfg.ga4) {
    const ga4 = cfg.ga4
    await run('GA4: payload do generate_lead', () => validateGa4Payload(buildGa4Payload(sample)!, ga4))
  }

  if (cfg.googleAds) {
    const gads = cfg.googleAds
    await run('Google Ads: ação de conversão', () => checkGoogleAdsConversionAction(gads))
  }

  if (cfg.crm.provider === 'kommo') {
    const kommo = cfg.crm
    await run('Kommo: token, funil e campos', () => checkKommoAccess(kommo))
  }

  if (args.has('--crm')) {
    await run(`CRM (${cfg.crm.provider}): lead de teste`, () =>
      sendLeadToCrm(
        {
          eventId: sample.eventId,
          createdAt: new Date().toISOString(),
          name: 'Teste Tracking (apagar)',
          email: `teste+${now}@example.com`,
          phone: '11999998888',
          message: 'Lead de teste enviado por npm run check:tracking:live --crm',
          pageUrl: sample.context.sourceUrl,
          consent: false,
          fields: { exemplo: 'resposta de teste' },
          attribution: { utm_source: 'check-tracking', utm_medium: 'test' },
        },
        cfg.crm,
      ),
    )
  }

  if (cfg.public.siteUrl && !/localhost|127\.0\.0\.1/.test(cfg.public.siteUrl)) {
    await run('Site no ar carrega o modo certo', () => checkDeployedSite(cfg.public.siteUrl!, cfg.public))
  }

  console.log('\nTracking — checagem ao vivo')
  let ok = true
  for (const [label, r] of results) {
    const icon = r.status === 'sent' ? green('✔') : r.status === 'skipped' ? yellow('–') : red('✖')
    if (r.status === 'failed') ok = false
    console.log(`  ${icon} ${label}${r.detail ? dim(` — ${r.detail}`) : ''}`)
  }
  console.log()
  return ok
}

async function checkDeployedSite(
  siteUrl: string,
  pub: ReturnType<typeof parseServerConfig>['public'],
): Promise<DestinationResult> {
  const res = await fetch(siteUrl, { headers: { 'User-Agent': 'check-tracking' } })
  if (!res.ok) return { status: 'failed', detail: `HTTP ${res.status}` }
  const html = await res.text()
  const problems: string[] = []
  if (!html.includes('id="trk-init"')) problems.push('script trk-init ausente (deploy é deste template?)')
  if (pub.mode === 'gtm') {
    if (pub.gtmId && !html.includes(pub.gtmId)) problems.push(`GTM ${pub.gtmId} não aparece no HTML`)
    if (html.includes('fbevents.js')) problems.push('modo gtm mas o HTML carrega o pixel direto (duplicidade)')
  } else {
    if (pub.metaPixelId && !html.includes(pub.metaPixelId)) problems.push('pixel da env não aparece no HTML (deploy antigo?)')
    if (pub.ga4Id && !html.includes(pub.ga4Id)) problems.push('GA4 da env não aparece no HTML (deploy antigo?)')
    if (/gtm\.js\?id=/.test(html)) problems.push('modo direct mas o HTML carrega GTM (duplicidade)')
  }
  return problems.length ? { status: 'failed', detail: problems.join('; ') } : { status: 'sent', detail: `modo ${pub.mode}` }
}

main().then(
  (code) => process.exit(code),
  (e) => {
    console.error(red(`check-tracking falhou: ${e instanceof Error ? e.message : String(e)}`))
    process.exit(1)
  },
)
