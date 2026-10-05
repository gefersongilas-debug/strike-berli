/**
 * Configuração de tracking/CRM lida do ambiente.
 *
 * Tudo aqui é função pura sobre um objeto de env — assim o mesmo código roda no
 * servidor, no script de pré-build (`npm run check:tracking`) e nos testes.
 */

export type Env = Record<string, string | undefined>

export type TrackingMode = 'direct' | 'gtm'
export type ConsentMode = 'off' | 'banner'
export type Ga4LeadSource = 'server' | 'browser'
export type CrmProvider = 'none' | 'webhook' | 'rdstation' | 'kommo'
export const CRM_PROVIDERS: readonly CrmProvider[] = ['none', 'webhook', 'rdstation', 'kommo']

/** Toda variável que o template lê. O teste de .env.example garante que todas estão documentadas. */
export const ENV_KEYS = {
  public: [
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_TRACKING_MODE',
    'NEXT_PUBLIC_GTM_ID',
    'NEXT_PUBLIC_META_PIXEL_ID',
    'NEXT_PUBLIC_GA4_MEASUREMENT_ID',
    'NEXT_PUBLIC_GA4_LEAD_SOURCE',
    'NEXT_PUBLIC_GOOGLE_ADS_ID',
    'NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL',
    'NEXT_PUBLIC_GOOGLE_ADS_RESERVATION_LABEL',
    'NEXT_PUBLIC_GOOGLE_ADS_CONTACT_LABEL',
    'NEXT_PUBLIC_LINKER_DOMAINS',
    'NEXT_PUBLIC_CONSENT_MODE',
    'NEXT_PUBLIC_SERVER_PAGEVIEW',
  ],
  server: [
    'META_CAPI_ACCESS_TOKEN',
    'META_API_VERSION',
    'META_TEST_EVENT_CODE',
    'GA4_API_SECRET',
    'GOOGLE_ADS_DEVELOPER_TOKEN',
    'GOOGLE_ADS_CLIENT_ID',
    'GOOGLE_ADS_CLIENT_SECRET',
    'GOOGLE_ADS_REFRESH_TOKEN',
    'GOOGLE_ADS_CUSTOMER_ID',
    'GOOGLE_ADS_LOGIN_CUSTOMER_ID',
    'GOOGLE_ADS_CONVERSION_ACTION_ID',
    'GOOGLE_ADS_API_VERSION',
    'CRM_PROVIDER',
    'CRM_WEBHOOK_URL',
    'CRM_WEBHOOK_SECRET',
    'RDSTATION_API_KEY',
    'RDSTATION_CONVERSION_IDENTIFIER',
    'KOMMO_SUBDOMAIN',
    'KOMMO_ACCESS_TOKEN',
    'KOMMO_PIPELINE_ID',
    'KOMMO_STATUS_ID',
    'KOMMO_RESPONSIBLE_USER_ID',
    'KOMMO_TAGS',
    'KOMMO_FIELD_MAP',
    'TRACKING_HEALTH_TOKEN',
    'SKIP_TRACKING_CHECK',
  ],
} as const

export const DEFAULTS = {
  META_API_VERSION: 'v26.0',
  GOOGLE_ADS_API_VERSION: 'v25',
  CURRENCY: 'BRL',
} as const

/** Credenciais do upload de conversão do Google Ads: ou todas, ou nenhuma. */
export const GOOGLE_ADS_SERVER_KEYS = [
  'GOOGLE_ADS_DEVELOPER_TOKEN',
  'GOOGLE_ADS_CLIENT_ID',
  'GOOGLE_ADS_CLIENT_SECRET',
  'GOOGLE_ADS_REFRESH_TOKEN',
  'GOOGLE_ADS_CUSTOMER_ID',
  'GOOGLE_ADS_CONVERSION_ACTION_ID',
] as const

export const PATTERNS = {
  gtmId: /^GTM-[A-Z0-9]{4,12}$/,
  metaPixelId: /^\d{12,20}$/,
  ga4Id: /^G-[A-Z0-9]{6,14}$/,
  googleAdsId: /^AW-\d{6,14}$/,
  googleAdsLabel: /^[A-Za-z0-9_-]{8,40}$/,
  googleCustomerId: /^\d{10}$/,
  numericId: /^\d+$/,
  apiVersionMeta: /^v\d{2}\.\d$/,
  apiVersionGoogleAds: /^v\d{2}$/,
  kommoSubdomain: /^[a-z0-9][a-z0-9-]{0,62}$/,
  hostname: /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/,
} as const

function clean(v: string | undefined): string | undefined {
  if (v === undefined) return undefined
  const t = v.trim()
  return t === '' ? undefined : t
}

function bool(v: string | undefined, fallback: boolean): boolean {
  const t = clean(v)?.toLowerCase()
  if (t === undefined) return fallback
  return t === 'true' || t === '1' || t === 'yes'
}

// ---------------------------------------------------------------------------
// Config pública (vai para o browser)
// ---------------------------------------------------------------------------

export interface PublicConfig {
  siteUrl?: string
  mode: TrackingMode
  gtmId?: string
  metaPixelId?: string
  ga4Id?: string
  ga4LeadSource: Ga4LeadSource
  googleAdsId?: string
  googleAdsLeadLabel?: string
  /** Conversão do clique em "Reservar" (ida ao Eleven Tickets). */
  googleAdsReservationLabel?: string
  /** Conversão do clique no WhatsApp/telefone. */
  googleAdsContactLabel?: string
  /** Domínios para o linker do gtag (_gl) — ex.: o site de reservas. */
  linkerDomains: string[]
  consentMode: ConsentMode
  serverPageview: boolean
}

export function parsePublicConfig(env: Env): PublicConfig {
  const mode = clean(env.NEXT_PUBLIC_TRACKING_MODE) === 'gtm' ? 'gtm' : 'direct'
  return {
    siteUrl: clean(env.NEXT_PUBLIC_SITE_URL)?.replace(/\/+$/, ''),
    mode,
    gtmId: clean(env.NEXT_PUBLIC_GTM_ID),
    metaPixelId: clean(env.NEXT_PUBLIC_META_PIXEL_ID),
    ga4Id: clean(env.NEXT_PUBLIC_GA4_MEASUREMENT_ID),
    ga4LeadSource: clean(env.NEXT_PUBLIC_GA4_LEAD_SOURCE) === 'browser' ? 'browser' : 'server',
    googleAdsId: clean(env.NEXT_PUBLIC_GOOGLE_ADS_ID),
    googleAdsLeadLabel: clean(env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL),
    googleAdsReservationLabel: clean(env.NEXT_PUBLIC_GOOGLE_ADS_RESERVATION_LABEL),
    googleAdsContactLabel: clean(env.NEXT_PUBLIC_GOOGLE_ADS_CONTACT_LABEL),
    linkerDomains: parseDomainList(env.NEXT_PUBLIC_LINKER_DOMAINS),
    consentMode: clean(env.NEXT_PUBLIC_CONSENT_MODE) === 'banner' ? 'banner' : 'off',
    serverPageview: bool(env.NEXT_PUBLIC_SERVER_PAGEVIEW, true),
  }
}

/** "eleventickets.com, outro.com.br" → ["eleventickets.com", "outro.com.br"] */
export function parseDomainList(v: string | undefined): string[] {
  const list = (clean(v) ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return [...new Set(list)]
}

// ---------------------------------------------------------------------------
// Config de servidor (segredos — nunca importar em componente client)
// ---------------------------------------------------------------------------

export interface MetaServerConfig {
  pixelId: string
  accessToken: string
  apiVersion: string
  testEventCode?: string
}

export interface Ga4ServerConfig {
  measurementId: string
  apiSecret: string
}

export interface GoogleAdsServerConfig {
  developerToken: string
  clientId: string
  clientSecret: string
  refreshToken: string
  customerId: string
  loginCustomerId?: string
  conversionActionId: string
  apiVersion: string
}

export type CrmConfig =
  | { provider: 'none' }
  | { provider: 'webhook'; url: string; secret?: string }
  | { provider: 'rdstation'; apiKey: string; conversionIdentifier: string }
  | KommoConfig

export interface KommoConfig {
  provider: 'kommo'
  /** Só o "sub" de sub.kommo.com. */
  subdomain: string
  accessToken: string
  pipelineId?: number
  statusId?: number
  responsibleUserId?: number
  tags: string[]
  /** chave (de `fields` ou da atribuição, ex.: utm_source) → id do campo personalizado do negócio */
  fieldMap: Record<string, number>
}

export interface ServerConfig {
  public: PublicConfig
  meta?: MetaServerConfig
  ga4?: Ga4ServerConfig
  googleAds?: GoogleAdsServerConfig
  crm: CrmConfig
  healthToken?: string
  isProduction: boolean
}

export function isProductionEnv(env: Env): boolean {
  // VERCEL_ENV é a fonte certa na Vercel; NODE_ENV=production também vale em preview.
  const vercelEnv = clean(env.VERCEL_ENV)
  if (vercelEnv) return vercelEnv === 'production'
  return clean(env.NODE_ENV) === 'production'
}

export function parseServerConfig(env: Env): ServerConfig {
  const pub = parsePublicConfig(env)

  const metaToken = clean(env.META_CAPI_ACCESS_TOKEN)
  const meta =
    pub.metaPixelId && metaToken
      ? {
          pixelId: pub.metaPixelId,
          accessToken: metaToken,
          apiVersion: clean(env.META_API_VERSION) ?? DEFAULTS.META_API_VERSION,
          testEventCode: clean(env.META_TEST_EVENT_CODE),
        }
      : undefined

  const ga4Secret = clean(env.GA4_API_SECRET)
  const ga4 = pub.ga4Id && ga4Secret ? { measurementId: pub.ga4Id, apiSecret: ga4Secret } : undefined

  const gadsComplete = GOOGLE_ADS_SERVER_KEYS.every((k) => clean(env[k]))
  const googleAds = gadsComplete
    ? {
        developerToken: clean(env.GOOGLE_ADS_DEVELOPER_TOKEN)!,
        clientId: clean(env.GOOGLE_ADS_CLIENT_ID)!,
        clientSecret: clean(env.GOOGLE_ADS_CLIENT_SECRET)!,
        refreshToken: clean(env.GOOGLE_ADS_REFRESH_TOKEN)!,
        customerId: clean(env.GOOGLE_ADS_CUSTOMER_ID)!,
        loginCustomerId: clean(env.GOOGLE_ADS_LOGIN_CUSTOMER_ID),
        conversionActionId: clean(env.GOOGLE_ADS_CONVERSION_ACTION_ID)!,
        apiVersion: clean(env.GOOGLE_ADS_API_VERSION) ?? DEFAULTS.GOOGLE_ADS_API_VERSION,
      }
    : undefined

  return {
    public: pub,
    meta,
    ga4,
    googleAds,
    crm: parseCrm(env),
    healthToken: clean(env.TRACKING_HEALTH_TOKEN),
    isProduction: isProductionEnv(env),
  }
}

function parseCrm(env: Env): CrmConfig {
  const provider = clean(env.CRM_PROVIDER) ?? 'none'
  if (provider === 'webhook' && clean(env.CRM_WEBHOOK_URL)) {
    return { provider, url: clean(env.CRM_WEBHOOK_URL)!, secret: clean(env.CRM_WEBHOOK_SECRET) }
  }
  if (provider === 'kommo' && clean(env.KOMMO_SUBDOMAIN) && clean(env.KOMMO_ACCESS_TOKEN)) {
    return {
      provider,
      subdomain: clean(env.KOMMO_SUBDOMAIN)!.toLowerCase(),
      accessToken: clean(env.KOMMO_ACCESS_TOKEN)!,
      pipelineId: intOrUndefined(env.KOMMO_PIPELINE_ID),
      statusId: intOrUndefined(env.KOMMO_STATUS_ID),
      responsibleUserId: intOrUndefined(env.KOMMO_RESPONSIBLE_USER_ID),
      tags: parseKommoTags(env.KOMMO_TAGS),
      fieldMap: parseKommoFieldMap(env.KOMMO_FIELD_MAP).map ?? {},
    }
  }
  if (provider === 'rdstation' && clean(env.RDSTATION_API_KEY)) {
    return {
      provider,
      apiKey: clean(env.RDSTATION_API_KEY)!,
      conversionIdentifier: clean(env.RDSTATION_CONVERSION_IDENTIFIER) ?? 'site-lead',
    }
  }
  return { provider: 'none' }
}

function intOrUndefined(v: string | undefined): number | undefined {
  const t = clean(v)
  return t && PATTERNS.numericId.test(t) ? Number(t) : undefined
}

/** "site, lp-imoveis" → ["site", "lp-imoveis"]. Vazio = ["site"]. */
export function parseKommoTags(v: string | undefined): string[] {
  const tags = (clean(v) ?? 'site')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return [...new Set(tags)]
}

/** '{"entrada": 123, "utm_source": 456}' → mapa validado, ou o motivo do erro. */
export function parseKommoFieldMap(v: string | undefined): { map?: Record<string, number>; error?: string } {
  const t = clean(v)
  if (!t) return { map: {} }
  let raw: unknown
  try {
    raw = JSON.parse(t)
  } catch {
    return { error: 'não é JSON válido' }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { error: 'precisa ser um objeto {"chave": id}' }
  const map: Record<string, number> = {}
  for (const [k, id] of Object.entries(raw)) {
    if (!/^[a-z0-9_]{1,40}$/.test(k)) return { error: `chave "${k}" inválida (use minúsculas, números e _)` }
    const n = typeof id === 'string' && PATTERNS.numericId.test(id) ? Number(id) : id
    if (typeof n !== 'number' || !Number.isInteger(n) || n <= 0) return { error: `id do campo "${k}" precisa ser um número` }
    map[k] = n
  }
  return { map }
}

// ---------------------------------------------------------------------------
// Validação — erros quebram o build, avisos só aparecem no log
// ---------------------------------------------------------------------------

export interface ValidationResult {
  errors: string[]
  warnings: string[]
  /** Visão do que está ligado, sem nenhum valor secreto. */
  summary: Record<string, string>
}

const SECRET_HINT = /(TOKEN|SECRET|API_KEY|PASSWORD|REFRESH)/

export function validateTrackingConfig(env: Env): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const pub = parsePublicConfig(env)
  const prod = isProductionEnv(env)
  const has = (k: string) => clean(env[k]) !== undefined

  // --- Higiene dos valores (erro clássico de copiar/colar na Vercel) ---
  for (const key of [...ENV_KEYS.public, ...ENV_KEYS.server]) {
    const raw = env[key]
    if (raw === undefined || raw === '') continue
    if (raw !== raw.trim()) errors.push(`${key} tem espaço ou quebra de linha no início/fim.`)
    if (/^["'].*["']$/.test(raw.trim())) errors.push(`${key} está entre aspas — cole o valor sem aspas na Vercel.`)
  }

  // --- Segredo exposto no browser ---
  for (const key of Object.keys(env)) {
    if (key.startsWith('NEXT_PUBLIC_') && SECRET_HINT.test(key) && has(key)) {
      errors.push(`${key} parece um segredo com prefixo NEXT_PUBLIC_ — isso vai para o JavaScript do site. Remova o prefixo.`)
    }
  }

  // --- Modo ---
  const rawMode = clean(env.NEXT_PUBLIC_TRACKING_MODE)
  if (!rawMode) errors.push('NEXT_PUBLIC_TRACKING_MODE não definido. Use "direct" (pixel/gtag no código) ou "gtm".')
  else if (rawMode !== 'direct' && rawMode !== 'gtm')
    errors.push(`NEXT_PUBLIC_TRACKING_MODE="${rawMode}" inválido. Use "direct" ou "gtm".`)

  const rawConsent = clean(env.NEXT_PUBLIC_CONSENT_MODE)
  if (rawConsent && rawConsent !== 'off' && rawConsent !== 'banner')
    errors.push(`NEXT_PUBLIC_CONSENT_MODE="${rawConsent}" inválido. Use "off" ou "banner".`)

  const rawLeadSource = clean(env.NEXT_PUBLIC_GA4_LEAD_SOURCE)
  if (rawLeadSource && rawLeadSource !== 'server' && rawLeadSource !== 'browser')
    errors.push(`NEXT_PUBLIC_GA4_LEAD_SOURCE="${rawLeadSource}" inválido. Use "server" ou "browser".`)

  // --- URL do site ---
  if (!pub.siteUrl) {
    ;(prod ? errors : warnings).push('NEXT_PUBLIC_SITE_URL não definido (usado em event_source_url e na checagem de origem).')
  } else {
    try {
      const u = new URL(pub.siteUrl)
      if (prod && u.protocol !== 'https:') errors.push('NEXT_PUBLIC_SITE_URL precisa ser https em produção.')
      if (prod && /localhost|127\.0\.0\.1|vercel\.app$/.test(u.hostname))
        warnings.push(`NEXT_PUBLIC_SITE_URL em produção aponta para ${u.hostname} — confira se é o domínio final.`)
    } catch {
      errors.push(`NEXT_PUBLIC_SITE_URL="${pub.siteUrl}" não é uma URL válida (inclua https://).`)
    }
  }

  // --- Formatos de ID ---
  const fmt = (key: string, re: RegExp, example: string) => {
    const v = clean(env[key])
    if (v && !re.test(v)) errors.push(`${key}="${v}" fora do formato esperado (ex.: ${example}).`)
  }
  fmt('NEXT_PUBLIC_GTM_ID', PATTERNS.gtmId, 'GTM-ABC1234')
  fmt('NEXT_PUBLIC_META_PIXEL_ID', PATTERNS.metaPixelId, '123456789012345')
  fmt('NEXT_PUBLIC_GA4_MEASUREMENT_ID', PATTERNS.ga4Id, 'G-ABCDE12345')
  fmt('NEXT_PUBLIC_GOOGLE_ADS_ID', PATTERNS.googleAdsId, 'AW-123456789')
  fmt('NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL', PATTERNS.googleAdsLabel, 'AbCdEfGhIjK12')
  fmt('NEXT_PUBLIC_GOOGLE_ADS_RESERVATION_LABEL', PATTERNS.googleAdsLabel, 'AbCdEfGhIjK12')
  fmt('NEXT_PUBLIC_GOOGLE_ADS_CONTACT_LABEL', PATTERNS.googleAdsLabel, 'AbCdEfGhIjK12')
  for (const d of pub.linkerDomains) {
    if (!PATTERNS.hostname.test(d))
      errors.push(`NEXT_PUBLIC_LINKER_DOMAINS tem "${d}" fora do formato (só o domínio, ex.: eleventickets.com — sem https nem barra).`)
  }
  fmt('META_API_VERSION', PATTERNS.apiVersionMeta, 'v26.0')
  fmt('GOOGLE_ADS_API_VERSION', PATTERNS.apiVersionGoogleAds, 'v25')
  fmt('GOOGLE_ADS_CONVERSION_ACTION_ID', PATTERNS.numericId, '987654321')

  for (const key of ['GOOGLE_ADS_CUSTOMER_ID', 'GOOGLE_ADS_LOGIN_CUSTOMER_ID']) {
    const v = clean(env[key])
    if (v && !PATTERNS.googleCustomerId.test(v))
      errors.push(`${key}="${v}" deve ter 10 dígitos, sem hífens (ex.: 1234567890).`)
  }

  // --- Regras por modo ---
  if (pub.mode === 'gtm') {
    if (!pub.gtmId) errors.push('Modo "gtm" exige NEXT_PUBLIC_GTM_ID.')
  } else {
    if (pub.gtmId)
      warnings.push('NEXT_PUBLIC_GTM_ID definido mas o modo é "direct": o GTM NÃO será carregado. Se o GTM também tiver pixel/GA4, haveria disparo duplicado.')
    if (!pub.metaPixelId && !pub.ga4Id && !pub.googleAdsId)
      errors.push('Modo "direct" sem nenhum destino no browser: defina ao menos NEXT_PUBLIC_META_PIXEL_ID, NEXT_PUBLIC_GA4_MEASUREMENT_ID ou NEXT_PUBLIC_GOOGLE_ADS_ID.')
  }

  // --- Meta ---
  if (has('META_CAPI_ACCESS_TOKEN') && !pub.metaPixelId)
    errors.push('META_CAPI_ACCESS_TOKEN definido sem NEXT_PUBLIC_META_PIXEL_ID — a CAPI precisa do id do pixel/dataset.')
  if (pub.metaPixelId && !has('META_CAPI_ACCESS_TOKEN'))
    (prod ? errors : warnings).push('Pixel da Meta sem META_CAPI_ACCESS_TOKEN: eventos só no browser, sem server side.')
  if (has('META_TEST_EVENT_CODE') && prod)
    errors.push('META_TEST_EVENT_CODE definido em PRODUÇÃO: eventos da CAPI vão para "Testar eventos" e não contam para otimização. Remova da env de Production.')

  // --- GA4 ---
  if (has('GA4_API_SECRET') && !pub.ga4Id)
    errors.push('GA4_API_SECRET definido sem NEXT_PUBLIC_GA4_MEASUREMENT_ID.')
  if (pub.ga4Id && pub.ga4LeadSource === 'server' && !has('GA4_API_SECRET'))
    errors.push('NEXT_PUBLIC_GA4_LEAD_SOURCE="server" (padrão) exige GA4_API_SECRET — senão o generate_lead não chega ao GA4. Crie o secret ou use "browser".')
  if (pub.mode === 'gtm' && pub.ga4Id && pub.ga4LeadSource === 'server')
    warnings.push('Modo gtm + GA4 lead via servidor: NÃO crie tag GA4 de generate_lead no GTM (o GA4 não deduplica e contaria duas vezes).')

  // --- Google Ads ---
  for (const key of ['NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL', 'NEXT_PUBLIC_GOOGLE_ADS_RESERVATION_LABEL', 'NEXT_PUBLIC_GOOGLE_ADS_CONTACT_LABEL']) {
    if (has(key) && !pub.googleAdsId) errors.push(`${key} definido sem NEXT_PUBLIC_GOOGLE_ADS_ID.`)
  }
  const labels = [pub.googleAdsLeadLabel, pub.googleAdsReservationLabel, pub.googleAdsContactLabel].filter(Boolean)
  if (new Set(labels).size < labels.length)
    errors.push('Dois eventos com o mesmo rótulo de conversão do Google Ads: cada um (lead, reserva, contato) precisa da sua própria ação.')
  if (pub.mode === 'gtm' && (pub.googleAdsReservationLabel || pub.googleAdsContactLabel || pub.linkerDomains.length))
    warnings.push('Modo gtm: rótulos de reserva/contato e NEXT_PUBLIC_LINKER_DOMAINS são ignorados — configure essas tags e o linker no GTM.')
  if (pub.mode === 'direct' && pub.googleAdsId && !pub.googleAdsLeadLabel)
    warnings.push('NEXT_PUBLIC_GOOGLE_ADS_ID sem NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL: a tag carrega mas nenhuma conversão de lead é enviada pelo browser.')

  const gadsSet = GOOGLE_ADS_SERVER_KEYS.filter((k) => has(k))
  if (gadsSet.length > 0 && gadsSet.length < GOOGLE_ADS_SERVER_KEYS.length) {
    const missing = GOOGLE_ADS_SERVER_KEYS.filter((k) => !has(k))
    errors.push(`Upload de conversão do Google Ads configurado pela metade. Faltam: ${missing.join(', ')}.`)
  }
  if (has('GOOGLE_ADS_LOGIN_CUSTOMER_ID') && gadsSet.length === 0)
    warnings.push('GOOGLE_ADS_LOGIN_CUSTOMER_ID definido mas o upload do Google Ads não está configurado.')
  if (gadsSet.length === GOOGLE_ADS_SERVER_KEYS.length && pub.googleAdsLeadLabel)
    warnings.push('Lead indo ao Google Ads pela tag (label) E pela API. Use ações de conversão diferentes e só uma como "primária", senão o lance otimiza em dobro.')

  // --- CRM ---
  const rawCrm = clean(env.CRM_PROVIDER) ?? 'none'
  if (!(CRM_PROVIDERS as readonly string[]).includes(rawCrm)) {
    errors.push(`CRM_PROVIDER="${rawCrm}" inválido. Use ${CRM_PROVIDERS.join(', ')}.`)
  } else if (rawCrm === 'webhook') {
    const url = clean(env.CRM_WEBHOOK_URL)
    if (!url) errors.push('CRM_PROVIDER=webhook exige CRM_WEBHOOK_URL.')
    else if (!/^https:\/\//.test(url) && prod) errors.push('CRM_WEBHOOK_URL precisa ser https em produção.')
    else if (!/^https?:\/\//.test(url)) errors.push(`CRM_WEBHOOK_URL="${url}" não é uma URL.`)
    if (!has('CRM_WEBHOOK_SECRET'))
      warnings.push('CRM_WEBHOOK_SECRET vazio: o webhook não é assinado e o receptor não consegue validar a origem.')
  } else if (rawCrm === 'rdstation') {
    if (!has('RDSTATION_API_KEY')) errors.push('CRM_PROVIDER=rdstation exige RDSTATION_API_KEY.')
    if (!has('RDSTATION_CONVERSION_IDENTIFIER'))
      warnings.push('RDSTATION_CONVERSION_IDENTIFIER vazio: usando "site-lead".')
  } else if (rawCrm === 'kommo') {
    const sub = clean(env.KOMMO_SUBDOMAIN)
    if (!sub) errors.push('CRM_PROVIDER=kommo exige KOMMO_SUBDOMAIN (o "sub" de sub.kommo.com).')
    else if (!PATTERNS.kommoSubdomain.test(sub.toLowerCase()))
      errors.push(`KOMMO_SUBDOMAIN="${sub}" inválido: use só o subdomínio (ex.: "minhaempresa" para minhaempresa.kommo.com), sem https nem .kommo.com.`)
    if (!has('KOMMO_ACCESS_TOKEN'))
      errors.push('CRM_PROVIDER=kommo exige KOMMO_ACCESS_TOKEN (token de longa duração da integração privada).')
    fmt('KOMMO_PIPELINE_ID', PATTERNS.numericId, '1234567')
    fmt('KOMMO_STATUS_ID', PATTERNS.numericId, '12345678')
    fmt('KOMMO_RESPONSIBLE_USER_ID', PATTERNS.numericId, '1234567')
    if (has('KOMMO_STATUS_ID') && !has('KOMMO_PIPELINE_ID'))
      errors.push('KOMMO_STATUS_ID definido sem KOMMO_PIPELINE_ID — a etapa pertence a um funil.')
    const fieldMap = parseKommoFieldMap(env.KOMMO_FIELD_MAP)
    if (fieldMap.error) errors.push(`KOMMO_FIELD_MAP ${fieldMap.error}. Exemplo: {"entrada": 123456, "utm_source": 654321}.`)
    else if (!Object.keys(fieldMap.map!).length)
      warnings.push('KOMMO_FIELD_MAP vazio: respostas do formulário e UTMs vão só na nota do negócio, não em campos filtráveis.')
    if (!has('KOMMO_PIPELINE_ID')) warnings.push('KOMMO_PIPELINE_ID vazio: o lead entra na 1ª etapa do funil principal.')
  } else if (prod) {
    warnings.push('CRM_PROVIDER=none em produção: leads não vão para nenhum CRM (só para os pixels).')
  }

  // --- Diversos ---
  if (clean(env.SKIP_TRACKING_CHECK) && prod)
    warnings.push('SKIP_TRACKING_CHECK definido em produção — a checagem de build está desligada.')

  const summary: Record<string, string> = {
    ambiente: prod ? 'production' : 'preview/dev',
    modo: pub.mode,
    consentimento: pub.consentMode,
    'browser: meta pixel': pub.mode === 'direct' ? onOff(pub.metaPixelId) : 'via GTM',
    'browser: ga4': pub.mode === 'direct' ? onOff(pub.ga4Id) : 'via GTM',
    'browser: google ads': pub.mode === 'direct' ? onOff(pub.googleAdsId && pub.googleAdsLeadLabel) : 'via GTM',
    'browser: google ads reserva/contato':
      pub.mode === 'direct'
        ? `${onOff(pub.googleAdsId && pub.googleAdsReservationLabel)} / ${onOff(pub.googleAdsId && pub.googleAdsContactLabel)}`
        : 'via GTM',
    'browser: linker': pub.linkerDomains.length ? pub.linkerDomains.join(', ') : 'desligado',
    'server: meta capi': onOff(pub.metaPixelId && has('META_CAPI_ACCESS_TOKEN')) + (has('META_TEST_EVENT_CODE') ? ' (TEST)' : ''),
    'server: ga4 mp': onOff(pub.ga4Id && has('GA4_API_SECRET')) + ` (lead via ${pub.ga4LeadSource})`,
    'server: google ads api': onOff(gadsSet.length === GOOGLE_ADS_SERVER_KEYS.length),
    crm: rawCrm,
  }

  return { errors, warnings, summary }
}

function onOff(v: unknown): string {
  return v ? 'ligado' : 'desligado'
}
