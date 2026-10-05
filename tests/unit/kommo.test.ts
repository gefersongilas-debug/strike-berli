/**
 * Adapter do Kommo: payload do /leads/complex, nota, falhas e checagem ao vivo.
 */
import { describe, expect, it } from 'vitest'
import type { KommoConfig } from '@/lib/config'
import { buildKommoLead, buildKommoNote, checkKommoAccess, sendKommo, sendLeadToCrm, type CrmLead } from '@/lib/crm'
import { httpError, mockFetch, ok, serverCfg } from './helpers'

const KOMMO_ENV = {
  CRM_PROVIDER: 'kommo',
  KOMMO_SUBDOMAIN: 'minhaempresa',
  KOMMO_ACCESS_TOKEN: 'kommo-long-lived-token',
  KOMMO_PIPELINE_ID: '1111',
  KOMMO_STATUS_ID: '2222',
  KOMMO_RESPONSIBLE_USER_ID: '3333',
  KOMMO_TAGS: 'site, lp-imoveis',
  KOMMO_FIELD_MAP: '{"entrada": 501, "utm_source": 502, "gclid": 503, "nao_enviado": 504}',
}

const cfg = serverCfg(KOMMO_ENV).crm as KommoConfig

const lead: CrmLead = {
  eventId: 'evt-12345678',
  createdAt: '2026-09-29T12:00:00.000Z',
  name: 'Maria da Silva',
  email: 'maria@example.com',
  phone: '(11) 99999-8888',
  pageUrl: 'https://www.cliente.com.br/',
  consent: true,
  fields: { entrada: 'R$ 70 a 100 mil', parcela: 'Acima de R$ 10 mil' },
  attribution: { utm_source: 'facebook', utm_campaign: 'imoveis', first_utm_source: 'google', gclid: 'Cj0KCQtest', fbc: 'fb.1.1.IwAR' },
}

const BASE = 'https://minhaempresa.kommo.com/api/v4'

describe('config do Kommo', () => {
  it('lê ids, tags e mapa de campos', () => {
    expect(cfg).toEqual({
      provider: 'kommo',
      subdomain: 'minhaempresa',
      accessToken: 'kommo-long-lived-token',
      pipelineId: 1111,
      statusId: 2222,
      responsibleUserId: 3333,
      tags: ['site', 'lp-imoveis'],
      fieldMap: { entrada: 501, utm_source: 502, gclid: 503, nao_enviado: 504 },
    })
  })

  it('sem tags usa "site"', () => {
    expect((serverCfg({ ...KOMMO_ENV, KOMMO_TAGS: undefined }).crm as KommoConfig).tags).toEqual(['site'])
  })

  it('sem token não liga o Kommo', () => {
    expect(serverCfg({ ...KOMMO_ENV, KOMMO_ACCESS_TOKEN: undefined }).crm.provider).toBe('none')
  })
})

describe('buildKommoLead', () => {
  const [body] = buildKommoLead(lead, cfg) as any[]

  it('negócio no funil/etapa/responsável certos, com tags', () => {
    expect(body).toMatchObject({
      name: 'Maria da Silva · site',
      pipeline_id: 1111,
      status_id: 2222,
      responsible_user_id: 3333,
      _embedded: { tags: [{ name: 'site' }, { name: 'lp-imoveis' }] },
    })
  })

  it('contato com telefone +55 e e-mail', () => {
    const contact = body._embedded.contacts[0]
    expect(contact.name).toBe('Maria da Silva')
    expect(contact.custom_fields_values).toEqual([
      { field_code: 'PHONE', values: [{ value: '+5511999998888', enum_code: 'WORK' }] },
      { field_code: 'EMAIL', values: [{ value: 'maria@example.com', enum_code: 'WORK' }] },
    ])
  })

  it('campos mapeados por id; chave sem valor fica de fora', () => {
    expect(body.custom_fields_values).toEqual([
      { field_id: 501, values: [{ value: 'R$ 70 a 100 mil' }] },
      { field_id: 502, values: [{ value: 'facebook' }] },
      { field_id: 503, values: [{ value: 'Cj0KCQtest' }] },
    ])
  })

  it('sem funil/mapa configurados, não manda chaves vazias', () => {
    const minimal = serverCfg({ CRM_PROVIDER: 'kommo', KOMMO_SUBDOMAIN: 'x', KOMMO_ACCESS_TOKEN: 't' }).crm as KommoConfig
    const [b] = buildKommoLead(lead, minimal) as any[]
    expect(Object.keys(b)).toEqual(['name', '_embedded'])
  })
})

describe('buildKommoNote', () => {
  it('traz respostas, origem e event_id', () => {
    const note = buildKommoNote(lead)
    expect(note).toContain('- entrada: R$ 70 a 100 mil')
    expect(note).toContain('- parcela: Acima de R$ 10 mil')
    expect(note).toContain('- utm_source: facebook')
    expect(note).toContain('- first_utm_source: google')
    expect(note).toContain('- fbc: fb.1.1.IwAR')
    expect(note).toContain('Consentimento LGPD: sim')
    expect(note).toContain('event_id: evt-12345678')
  })
})

describe('sendKommo', () => {
  it('cria o negócio e depois a nota, com Bearer', async () => {
    const { fetch, calls } = mockFetch([
      [/leads\/complex/, ok([{ id: 987, contact_id: 654, merged: false }])],
      [/leads\/notes/, ok({})],
    ])
    const r = await sendLeadToCrm(lead, cfg, fetch)
    expect(r).toEqual({ status: 'sent', detail: 'negócio 987' })
    expect(calls.map((c) => c.url)).toEqual([`${BASE}/leads/complex`, `${BASE}/leads/notes`])
    expect((calls[0].init!.headers as Record<string, string>).Authorization).toBe('Bearer kommo-long-lived-token')
    const note = (calls[1].body as any[])[0]
    expect(note).toMatchObject({ entity_id: 987, note_type: 'common' })
    expect(note.params.text).toContain('R$ 70 a 100 mil')
  })

  it('duplicado mesclado aparece no detalhe', async () => {
    const { fetch } = mockFetch([[/leads\/complex/, ok([{ id: 1, merged: true }])]])
    expect((await sendKommo(lead, cfg, fetch)).detail).toMatch(/mesclado/)
  })

  it('complex recusado (token errado) → failed, sem nota', async () => {
    const { fetch, calls } = mockFetch([[/leads\/complex/, httpError(401, '{"title":"Unauthorized"}')]])
    const r = await sendKommo(lead, cfg, fetch)
    expect(r.status).toBe('failed')
    expect(r.detail).toMatch(/401/)
    expect(r.detail).not.toContain('kommo-long-lived-token')
    expect(calls).toHaveLength(1)
  })

  it('nota falhou → continua sent (o negócio já existe; reenviar duplicaria)', async () => {
    const { fetch } = mockFetch([
      [/leads\/complex/, ok([{ id: 987 }])],
      [/leads\/notes/, httpError(400)],
    ])
    const r = await sendKommo(lead, cfg, fetch)
    expect(r.status).toBe('sent')
    expect(r.detail).toMatch(/negócio 987; nota falhou: HTTP 400/)
  })

  it('resposta sem id → sent, sem tentar a nota', async () => {
    const { fetch, calls } = mockFetch([[/leads\/complex/, ok([])]])
    expect((await sendKommo(lead, cfg, fetch)).status).toBe('sent')
    expect(calls).toHaveLength(1)
  })
})

describe('checkKommoAccess', () => {
  const fields = {
    _embedded: {
      custom_fields: [
        { id: 501, name: 'Entrada', type: 'select', code: null },
        { id: 502, name: 'utm_source', type: 'tracking_data', code: 'UTM_SOURCE' },
        { id: 503, name: 'gclid', type: 'tracking_data', code: 'GCLID' },
        { id: 504, name: 'x', type: 'text', code: null },
        { id: 505, name: 'utm_medium', type: 'tracking_data', code: 'UTM_MEDIUM' },
      ],
    },
  }
  const routes = (overrides: Array<[RegExp, () => Response]> = []) => [
    ...overrides,
    [/\/account$/, ok({ name: 'Minha Empresa' })] as [RegExp, () => Response],
    [/pipelines\/1111/, ok({ name: 'Imóveis', _embedded: { statuses: [{ id: 2222 }] } })] as [RegExp, () => Response],
    [/custom_fields/, ok(fields)] as [RegExp, () => Response],
  ]

  it('tudo certo: resume conta/funil e sugere UTMs não mapeadas', async () => {
    const { fetch } = mockFetch(routes())
    const r = await checkKommoAccess(cfg, fetch)
    expect(r.status).toBe('sent')
    expect(r.detail).toContain('conta "Minha Empresa"')
    expect(r.detail).toContain('funil "Imóveis"')
    expect(r.detail).toContain('"utm_medium":505')
    expect(r.detail).not.toContain('utm_source')
  })

  it('token inválido', async () => {
    const { fetch } = mockFetch(routes([[/\/account$/, httpError(401)]]))
    expect((await checkKommoAccess(cfg, fetch)).detail).toMatch(/conta: HTTP 401/)
  })

  it('etapa fora do funil', async () => {
    const { fetch } = mockFetch(routes([[/pipelines\/1111/, ok({ _embedded: { statuses: [{ id: 9 }] } })]]))
    expect((await checkKommoAccess(cfg, fetch)).detail).toMatch(/etapa 2222 não pertence/)
  })

  it('campo do mapa que não existe na conta', async () => {
    const { fetch } = mockFetch(routes([[/custom_fields/, ok({ _embedded: { custom_fields: [] } })]]))
    const r = await checkKommoAccess(cfg, fetch)
    expect(r.status).toBe('failed')
    expect(r.detail).toMatch(/entrada=501/)
  })
})
