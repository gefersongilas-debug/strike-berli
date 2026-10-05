import { describe, expect, it } from 'vitest'
import { validateTrackingConfig } from '@/lib/config'
import { fullEnv, GADS_ENV } from './helpers'

const errorsOf = (env: Record<string, string | undefined>) => validateTrackingConfig(env).errors
const warningsOf = (env: Record<string, string | undefined>) => validateTrackingConfig(env).warnings
const expectError = (env: Record<string, string | undefined>, match: RegExp) =>
  expect(errorsOf(env).some((e) => match.test(e)), `esperava erro ${match}; veio: ${JSON.stringify(errorsOf(env))}`).toBe(true)

describe('validateTrackingConfig — configuração base', () => {
  it('env completa de produção passa sem erro', () => {
    expect(errorsOf(fullEnv())).toEqual([])
  })

  it('env completa com Google Ads API também passa', () => {
    expect(errorsOf(fullEnv({ ...GADS_ENV, NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL: undefined }))).toEqual([])
  })

  it('modo ausente é erro', () => {
    expectError(fullEnv({ NEXT_PUBLIC_TRACKING_MODE: undefined }), /NEXT_PUBLIC_TRACKING_MODE não definido/)
  })

  it('modo inválido é erro', () => {
    expectError(fullEnv({ NEXT_PUBLIC_TRACKING_MODE: 'pixel' }), /inválido/)
  })

  it('.env.example copiado sem preencher nada quebra', () => {
    const errs = errorsOf({ VERCEL_ENV: 'production', NEXT_PUBLIC_TRACKING_MODE: 'direct', CRM_PROVIDER: 'webhook' })
    expect(errs.length).toBeGreaterThanOrEqual(2)
  })
})

describe('higiene de valores', () => {
  it('espaço no fim do valor (copiar/colar) é erro', () => {
    expectError(fullEnv({ NEXT_PUBLIC_META_PIXEL_ID: '123456789012345 ' }), /espaço/)
  })

  it('valor entre aspas é erro', () => {
    expectError(fullEnv({ GA4_API_SECRET: '"abc"' }), /aspas/)
  })

  it('segredo com prefixo NEXT_PUBLIC_ é erro', () => {
    expectError(fullEnv({ NEXT_PUBLIC_META_CAPI_ACCESS_TOKEN: 'EAA' }), /NEXT_PUBLIC_META_CAPI_ACCESS_TOKEN parece um segredo/)
    expectError(fullEnv({ NEXT_PUBLIC_GA4_API_SECRET: 'x' }), /parece um segredo/)
  })
})

describe('formatos de id', () => {
  it.each([
    ['NEXT_PUBLIC_GTM_ID', 'GTM_123'],
    ['NEXT_PUBLIC_META_PIXEL_ID', 'abc123'],
    ['NEXT_PUBLIC_GA4_MEASUREMENT_ID', 'UA-12345-1'],
    ['NEXT_PUBLIC_GOOGLE_ADS_ID', '123456789'],
    ['META_API_VERSION', '26.0'],
  ])('%s=%s é recusado', (key, value) => {
    expectError(fullEnv({ [key]: value }), new RegExp(key))
  })

  it('customer id do Google Ads com hífen é recusado', () => {
    expectError(fullEnv({ ...GADS_ENV, GOOGLE_ADS_CUSTOMER_ID: '192-293-8301' }), /10 dígitos, sem hífens/)
  })
})

describe('modo gtm × direct', () => {
  it('gtm sem GTM_ID é erro', () => {
    expectError(fullEnv({ NEXT_PUBLIC_TRACKING_MODE: 'gtm' }), /Modo "gtm" exige NEXT_PUBLIC_GTM_ID/)
  })

  it('gtm com GTM_ID válido passa', () => {
    expect(errorsOf(fullEnv({ NEXT_PUBLIC_TRACKING_MODE: 'gtm', NEXT_PUBLIC_GTM_ID: 'GTM-ABC1234' }))).toEqual([])
  })

  it('direct com GTM_ID avisa sobre duplicidade', () => {
    expect(warningsOf(fullEnv({ NEXT_PUBLIC_GTM_ID: 'GTM-ABC1234' })).join()).toMatch(/NÃO será carregado/)
  })

  it('direct sem nenhum destino de browser é erro', () => {
    expectError(
      fullEnv({
        NEXT_PUBLIC_META_PIXEL_ID: undefined,
        META_CAPI_ACCESS_TOKEN: undefined,
        NEXT_PUBLIC_GA4_MEASUREMENT_ID: undefined,
        GA4_API_SECRET: undefined,
        NEXT_PUBLIC_GOOGLE_ADS_ID: undefined,
        NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL: undefined,
      }),
      /sem nenhum destino/,
    )
  })

  it('gtm + GA4 lead no servidor avisa para não criar tag de lead no GTM', () => {
    const w = warningsOf(fullEnv({ NEXT_PUBLIC_TRACKING_MODE: 'gtm', NEXT_PUBLIC_GTM_ID: 'GTM-ABC1234' }))
    expect(w.join()).toMatch(/NÃO crie tag GA4 de generate_lead/)
  })
})

describe('Meta', () => {
  it('token da CAPI sem pixel é erro', () => {
    expectError(fullEnv({ NEXT_PUBLIC_META_PIXEL_ID: undefined }), /CAPI precisa do id do pixel/)
  })

  it('pixel sem token é erro em produção e aviso em preview', () => {
    expectError(fullEnv({ META_CAPI_ACCESS_TOKEN: undefined }), /sem META_CAPI_ACCESS_TOKEN/)
    const preview = fullEnv({ META_CAPI_ACCESS_TOKEN: undefined, VERCEL_ENV: 'preview' })
    expect(errorsOf(preview)).toEqual([])
    expect(warningsOf(preview).join()).toMatch(/sem META_CAPI_ACCESS_TOKEN/)
  })

  it('META_TEST_EVENT_CODE em produção quebra o build', () => {
    expectError(fullEnv({ META_TEST_EVENT_CODE: 'TEST123' }), /PRODUÇÃO/)
  })

  it('META_TEST_EVENT_CODE em preview é permitido', () => {
    expect(errorsOf(fullEnv({ META_TEST_EVENT_CODE: 'TEST123', VERCEL_ENV: 'preview' }))).toEqual([])
  })
})

describe('GA4', () => {
  it('secret sem measurement id é erro', () => {
    expectError(fullEnv({ NEXT_PUBLIC_GA4_MEASUREMENT_ID: undefined }), /GA4_API_SECRET definido sem/)
  })

  it('lead via servidor sem secret é erro (o lead sumiria do GA4)', () => {
    expectError(fullEnv({ GA4_API_SECRET: undefined }), /exige GA4_API_SECRET/)
  })

  it('lead via browser dispensa secret', () => {
    expect(errorsOf(fullEnv({ GA4_API_SECRET: undefined, NEXT_PUBLIC_GA4_LEAD_SOURCE: 'browser' }))).toEqual([])
  })
})

describe('Google Ads', () => {
  it('label sem id é erro', () => {
    expectError(fullEnv({ NEXT_PUBLIC_GOOGLE_ADS_ID: undefined }), /LEAD_LABEL definido sem/)
  })

  it('credenciais da API pela metade é erro e lista o que falta', () => {
    const errs = errorsOf(fullEnv({ ...GADS_ENV, GOOGLE_ADS_REFRESH_TOKEN: undefined, GOOGLE_ADS_CONVERSION_ACTION_ID: '' }))
    const e = errs.find((x) => /pela metade/.test(x))
    expect(e).toMatch(/GOOGLE_ADS_REFRESH_TOKEN/)
    expect(e).toMatch(/GOOGLE_ADS_CONVERSION_ACTION_ID/)
  })

  it('tag + API ao mesmo tempo avisa sobre conversão em dobro', () => {
    expect(warningsOf(fullEnv(GADS_ENV)).join()).toMatch(/só uma como "primária"/)
  })
})

describe('CRM', () => {
  it('webhook sem URL é erro', () => {
    expectError(fullEnv({ CRM_WEBHOOK_URL: undefined }), /exige CRM_WEBHOOK_URL/)
  })

  it('webhook http em produção é erro', () => {
    expectError(fullEnv({ CRM_WEBHOOK_URL: 'http://n8n.example.com/x' }), /https em produção/)
  })

  it('rdstation sem chave é erro', () => {
    expectError(fullEnv({ CRM_PROVIDER: 'rdstation' }), /exige RDSTATION_API_KEY/)
  })

  it('provider desconhecido é erro', () => {
    expectError(fullEnv({ CRM_PROVIDER: 'pipedrive' }), /CRM_PROVIDER="pipedrive" inválido/)
  })

  const kommo = (o: Record<string, string | undefined> = {}) =>
    fullEnv({ CRM_PROVIDER: 'kommo', KOMMO_SUBDOMAIN: 'minhaempresa', KOMMO_ACCESS_TOKEN: 'tok', KOMMO_PIPELINE_ID: '1111', KOMMO_FIELD_MAP: '{"entrada":501}', ...o })

  it('kommo completo passa sem erro nem aviso de CRM', () => {
    expect(errorsOf(kommo())).toEqual([])
    expect(warningsOf(kommo()).join()).not.toMatch(/KOMMO/)
  })

  it('kommo sem subdomínio ou token é erro', () => {
    expectError(kommo({ KOMMO_SUBDOMAIN: undefined }), /exige KOMMO_SUBDOMAIN/)
    expectError(kommo({ KOMMO_ACCESS_TOKEN: undefined }), /exige KOMMO_ACCESS_TOKEN/)
  })

  it('subdomínio com domínio ou https é erro', () => {
    expectError(kommo({ KOMMO_SUBDOMAIN: 'minhaempresa.kommo.com' }), /só o subdomínio/)
    expectError(kommo({ KOMMO_SUBDOMAIN: 'https://minhaempresa' }), /só o subdomínio/)
  })

  it('ids não numéricos e etapa sem funil são erro', () => {
    expectError(kommo({ KOMMO_PIPELINE_ID: 'funil' }), /KOMMO_PIPELINE_ID="funil" fora do formato/)
    expectError(kommo({ KOMMO_PIPELINE_ID: undefined, KOMMO_STATUS_ID: '2222' }), /STATUS_ID definido sem KOMMO_PIPELINE_ID/)
  })

  it('KOMMO_FIELD_MAP inválido é erro', () => {
    expectError(kommo({ KOMMO_FIELD_MAP: '{entrada:501}' }), /não é JSON válido/)
    expectError(kommo({ KOMMO_FIELD_MAP: '[501]' }), /precisa ser um objeto/)
    expectError(kommo({ KOMMO_FIELD_MAP: '{"entrada":"abc"}' }), /precisa ser um número/)
    expectError(kommo({ KOMMO_FIELD_MAP: '{"Entrada":501}' }), /chave "Entrada" inválida/)
  })

  it('kommo sem mapa e sem funil só avisa', () => {
    const env = kommo({ KOMMO_FIELD_MAP: undefined, KOMMO_PIPELINE_ID: undefined })
    expect(errorsOf(env)).toEqual([])
    expect(warningsOf(env).join()).toMatch(/só na nota/)
    expect(warningsOf(env).join()).toMatch(/1ª etapa do funil principal/)
  })

  it('none em produção só avisa', () => {
    const env = fullEnv({ CRM_PROVIDER: 'none' })
    expect(errorsOf(env)).toEqual([])
    expect(warningsOf(env).join()).toMatch(/não vão para nenhum CRM/)
  })
})

describe('URL do site', () => {
  it('ausente em produção é erro', () => {
    expectError(fullEnv({ NEXT_PUBLIC_SITE_URL: undefined }), /NEXT_PUBLIC_SITE_URL não definido/)
  })

  it('http em produção é erro', () => {
    expectError(fullEnv({ NEXT_PUBLIC_SITE_URL: 'http://cliente.com.br' }), /https em produção/)
  })

  it('sem protocolo é erro', () => {
    expectError(fullEnv({ NEXT_PUBLIC_SITE_URL: 'cliente.com.br' }), /não é uma URL válida/)
  })
})

describe('summary', () => {
  it('nunca contém valor de segredo', () => {
    const env = fullEnv(GADS_ENV)
    const text = JSON.stringify(validateTrackingConfig(env))
    for (const secret of ['EAAtesttoken', 'ga4secret', 'whsecret', 'devtoken', 'clientsecret', '1//refreshtoken']) {
      expect(text).not.toContain(secret)
    }
  })
})
