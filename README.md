# Site Strike Berlin — strikeberlin.com.br

Substitui a página do GreatPages (sem acesso). Feito a partir do template
`_TEMPLATES/site-nextjs-tracking`: o tracking é o do template, com três
acréscimos para a Strike (seção "O que mudou do template").

```
npm install
cp .env.example .env.local   # para dev, ids falsos servem
npm run dev                  # ou, da raiz do workspace: preview "strike-site" (porta 3210)
```

## Páginas

| Rota | Para quê | Sitelink / campanha |
|---|---|---|
| `/` | Home: atrações, como reservar, pacotes, galeria, WhatsApp, FAQ, mapa | Search ET / LP |
| `/aniversario` | Aniversário infantil e Mês da Criança (selo some sozinho em 01/11) | "Aniversário Infantil", "Mês da Criança" |
| `/empresas` | Confraternização e happy hour, com nota fiscal | "Confraternização" |
| `/pacotes` | Os 4 pacotes com preço por dia (seg–qui, sexta, sábado) | "Pacotes Seg a Qui" |
| `/realidade-virtual` | VR | "Realidade Virtual" |
| `/dia-das-criancas` | Dia das Crianças com a oferta de doce extra (o bloco da oferta some depois de 12/10) | "Dia das Crianças" |
| `/halloween` | Halloween, sexta 30 e sábado 31/10, com o preço da pista desses dias | "Halloween" |
| `/confraternizacao` | Grupos grandes, com a calculadora de pistas (12 pessoas por pista, 4 pistas) | "Confraternização" |
| `/privacidade` | LGPD e cookies | — |

Conteúdo editável sem mexer em layout: `src/content/` (`site.ts` telefone, link de
reserva, horário e as regras da casa · `packages.ts` preços · `offers.ts` ofertas e datas
sazonais · `attractions.ts` · `faq.ts`).

**Preços e regras têm fonte.** Os combos vêm do site antigo e a pista avulsa e as regras
(entrada, menores de 9 anos, 12 por pista, comida de fora) vêm do Eleven Tickets, conferidos
em 05/10/2026. `tests/unit/precos.test.ts` trava os valores: mudar preço sem atualizar o
teste quebra o build. Oferta nova só entra em `offers.ts` depois de confirmada pelo cliente.

## O que é medido

| Ação na página | Meta (pixel + CAPI, mesmo `event_id`) | GA4 | Google Ads (tag) |
|---|---|---|---|
| Página vista | `PageView` | `page_view` (gtag) | — |
| Clique em **Reservar** (vai ao Eleven Tickets) | `ReservationClick` (personalizado) | `reservation_click` | `NEXT_PUBLIC_GOOGLE_ADS_RESERVATION_LABEL` |
| Clique no **WhatsApp** / telefone | `Contact` | `contact` | `NEXT_PUBLIC_GOOGLE_ADS_CONTACT_LABEL` |
| Clique em **Como chegar** | `FindLocation` | `directions_click` | — |
| Troca de dia nos pacotes | `ViewContent` | `view_item` | — |
| ~~Pedido de proposta~~ (formulário saiu em 09/10/2026, ver abaixo) | `Lead` | `generate_lead` | `NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL` |

Todo evento leva `button` (qual botão) e `page` (qual página) — dá para ver, por
exemplo, se o "Reservar" do topo converte mais que o da barra fixa do celular.

### O que mudou do template

1. **Reserva é evento próprio.** O pixel da Strike (`2138722490022940`, "Pixel Eleven
   Tickets") já recebe `InitiateCheckout` e `Purchase` do Eleven Tickets (106 e 54 em
   14 dias, até 04/10/2026). O clique no site vira `ReservationClick` para não misturar.
2. **O link de reserva leva a origem.** No clique, o link do Eleven Tickets ganha
   `gclid`/`gbraid`/`wbraid`/`fbclid` (sempre que existirem) e as UTMs do último toque
   (se tiver menos de 24 h) — `src/lib/tracking/outbound.ts`. É o que deixa o GA4 do
   Eleven Tickets (importado no Google Ads como compra) e o pixel atribuírem a reserva à
   campanha certa. Com o gtag ligado, o `_gl` também vai (`NEXT_PUBLIC_LINKER_DOMAINS`).
3. **Sem formulário (desde 09/10/2026).** O pedido de proposta não ficava guardado
   (`CRM_PROVIDER=none`), então a seção virou um bloco de WhatsApp
   (`WhatsAppSection` em `src/components/sections/Blocks.tsx`): mostra a mensagem
   pronta da página ("Oi! Vim pelo site e quero reservar…", textos em `WHATSAPP_TEXT`
   no `site.ts`) e, ao lado, o Reservar online. O clique conta como `Contact` com
   `button: secao-whatsapp`. O `/obrigado` saiu junto. O `/api/lead`, o adapter de CRM
   e a ação de conversão do Google Ads continuam no código e na conta, sem uso: para
   voltar o formulário, recupere o `LeadForm.tsx` do histórico do git e ligue um CRM.

## Produção (Vercel → Settings → Environment Variables)

Valores prontos para colar em [`vercel.env`](vercel.env) (sem segredos).


| Variável | Valor | Situação |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://www.strikeberlin.com.br` | ✅ |
| `NEXT_PUBLIC_TRACKING_MODE` | `direct` | ✅ — o GTM-ND7ZNDDZ do site antigo está vazio e sem acesso |
| `NEXT_PUBLIC_META_PIXEL_ID` | `2138722490022940` | ✅ mesmo pixel do Eleven Tickets |
| `META_CAPI_ACCESS_TOKEN` | gerar em Gerenciador de Eventos → pixel → Configurações → API de Conversões | ❌ obrigatório em produção (o build recusa sem) |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | `AW-18124180717` | ✅ conta 800-629-7198 |
| `NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL` | `vtpmCLqluZIdEO2ZpMJD` ("Site \| Pedido de proposta") | ✅ criada 05/10, secundária |
| `NEXT_PUBLIC_GOOGLE_ADS_RESERVATION_LABEL` | `I6T9CMqvwJIdEO2ZpMJD` ("Site \| Clique em Reservar") | ✅ criada 05/10, secundária |
| `NEXT_PUBLIC_GOOGLE_ADS_CONTACT_LABEL` | `peTiCM2vwJIdEO2ZpMJD` ("Site \| Clique no WhatsApp") | ✅ criada 05/10, secundária |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | `G-FJZ8H4W7CZ` — conta GA4 nossa "Strike Berlin" (sem acesso ao GA4 da cliente nem ao do Eleven Tickets) | ✅ criada 05/10, vinculada ao Google Ads |
| `NEXT_PUBLIC_GA4_LEAD_SOURCE` | `server` | ✅ |
| `GA4_API_SECRET` | segredo — valor em `STRIKE BELIN/.env` | ✅ testado no `/debug` do GA4 |
| `NEXT_PUBLIC_LINKER_DOMAINS` | `eleventickets.com` | ✅ |
| `NEXT_PUBLIC_CLARITY_ID` | `yt6arlvyol` (Microsoft Clarity) | ✅ |
| `CRM_PROVIDER` | `kommo` quando o Kommo existir (abaixo) | ⏳ |

### Ligando o Kommo

```
CRM_PROVIDER=kommo
KOMMO_SUBDOMAIN=<sub de sub.kommo.com>
KOMMO_ACCESS_TOKEN=<token de longa duração da integração privada>
KOMMO_PIPELINE_ID=<funil de eventos>      KOMMO_STATUS_ID=<etapa de entrada>
KOMMO_TAGS=site,strike-berlin
KOMMO_FIELD_MAP={"tipo":ID,"data":ID,"pessoas":ID,"dia_semana":ID,"utm_source":ID,"utm_campaign":ID,"gclid":ID}
```

`npm run check:tracking:live` confere token, funil, etapa e campos, e lista os ids dos
campos de UTM. Só faz sentido se o formulário voltar (ver item 3 acima).

---

# Base técnica (template Next.js com tracking + CRM)

Landing page em Next.js 16 com o tracking inteiro pronto: cookies first-party,
Meta Pixel + CAPI, GA4 + Measurement Protocol, Google Ads (tag + API) e envio
do lead para o CRM (webhook, RD Station ou Kommo). Troque o conteúdo das páginas; o tracking não precisa ser tocado.

```
npm install
cp .env.example .env.local   # preencha
npm run dev
```

## Como funciona

```
visitante chega com ?utm_source=…&fbclid=…&gclid=…
        │
        ▼
src/proxy.ts ── grava cookies first-party pelo servidor (duram mais no Safari):
                _fbc, _fbp, trk_gclid/gbraid/wbraid, trk_ft (1º toque), trk_lt (último), trk_vid
        │
        ▼
browser ── modo "direct": Meta Pixel + gtag carregados pelo próprio Next
           modo "gtm":    só o GTM; eventos vão para o dataLayer
        │
        ├── page_view / contact / view_content ──► browser  +  POST /api/track ──► CAPI
        │                                          (mesmo event_id → a Meta deduplica)
        │
        └── formulário ──► POST /api/lead
                             1. CRM (webhook / RD Station / Kommo) ← se falhar: 502 e nada dispara
                             2. depois da resposta (after()):
                                Meta CAPI · GA4 MP · Google Ads uploadClickConversions
                           ◄── ok → browser dispara Lead com o MESMO event_id → /obrigado
```

Nenhum componente chama `fbq`/`gtag`/`dataLayer` diretamente. Tudo passa por
`trackEvent()` (`src/components/tracking/track.ts`), que resolve o modo.

## Escolhendo o modo (`NEXT_PUBLIC_TRACKING_MODE`)

| | `direct` | `gtm` |
|---|---|---|
| Browser | Pixel + gtag no código | Só o GTM |
| Quem configura as tags | ninguém — já está pronto | você, no GTM |
| Server side (CAPI, GA4 MP, Ads API) | sai do Next | sai do Next |
| Quando usar | padrão | cliente já tem GTM com outras tags |

Trocou de modo? É `NEXT_PUBLIC_*`, então precisa de novo deploy.

### Configurando o GTM (modo `gtm`)

O site empurra estes eventos no `dataLayer`:

| `event` | Meta | GA4 | Campos |
|---|---|---|---|
| `trk_page_view` | PageView | — (a tag de config do GA4 já coleta) | `event_id` |
| `trk_view_content` | ViewContent | view_item | `event_id` |
| `trk_contact` | Contact | contact | `event_id`, `method` |
| `trk_lead` | Lead | generate_lead | `event_id`, `currency`, `user_data.email`, `user_data.phone_number`, `ga4_send_from_browser` |

No GTM:

1. **Variáveis da camada de dados**: `event_id`, `user_data.email`, `user_data.phone_number`, `ga4_send_from_browser`.
2. **Meta Pixel**: tag base em *Initialization* **sem** `fbq('track','PageView')`. Uma tag por evento
   (`trk_page_view` → PageView etc.) com `fbq('track', '<Evento>', {}, {eventID: {{event_id}}})`.
   Sem o `eventID`, a Meta conta browser e CAPI em dobro.
3. **GA4**: tag do Google em *Initialization*. `generate_lead` **só** se `ga4_send_from_browser` for `true`
   (com `NEXT_PUBLIC_GA4_LEAD_SOURCE=server`, o servidor já manda — o GA4 não deduplica).
4. **Google Ads**: conversão no gatilho `trk_lead`, *ID da transação* = `{{event_id}}`, dados fornecidos pelo
   usuário com `{{user_data.email}}` e `{{user_data.phone_number}}`.
5. **Consentimento** (se `NEXT_PUBLIC_CONSENT_MODE=banner`): o site já manda o `consent default` antes do GTM
   e `trk_consent_update` quando a pessoa escolhe.

## Variáveis de ambiente

Todas estão documentadas em [`.env.example`](.env.example). Na Vercel: *Settings → Environment Variables*.

- `NEXT_PUBLIC_*` vai para o JavaScript do site. Nunca coloque segredo com esse prefixo (o build recusa).
- `META_TEST_EVENT_CODE` só em **Preview**. Em Production o build quebra.
- Credenciais do Google Ads API: tudo ou nada.

## Testes — "nenhum tracking mal configurado"

Quatro camadas, da mais barata para a mais completa:

| Comando | Quando roda | O que pega |
|---|---|---|
| `npm run check:tracking` | **automaticamente antes de todo `next build`** (inclusive na Vercel) | env faltando, formato de id errado, segredo com `NEXT_PUBLIC_`, credencial pela metade, `TEST_EVENT_CODE` em produção, espaço/aspas coladas no valor, duplicidade GTM × direct, GA4 que contaria em dobro |
| `npm test` | local e CI | 161 testes: payload de cada plataforma, hash/normalização, dedup por `event_id`, consentimento, CRM, rotas, e que `.env.example` bate com o código |
| `npm run test:e2e` | local e CI | Chrome real, os dois modos: o pixel/dataLayer recebe o mesmo `event_id` que vai para o servidor, cookies gravados, GTM × direct não se misturam |
| `npm run check:tracking:live` | depois de configurar um cliente | usa as credenciais de verdade, sem sujar dados: GTM publicado? token da Meta alcança o pixel? payload GA4 válido (`/debug`)? ação de conversão do Google Ads existe e é de importação? token do Kommo, funil e campos existem? site no ar carrega o modo certo? |

`check:tracking:live -- --crm` também manda um lead de teste para o CRM.

Em produção, `GET /api/tracking-health` com `Authorization: Bearer $TRACKING_HEALTH_TOKEN` devolve a mesma
validação (sem valores).

Sem internet para baixar o Chromium do Playwright? `PW_CHANNEL=chrome npm run test:e2e` usa o Chrome instalado.

## CRM

`CRM_PROVIDER`:

- `webhook` — POST JSON para n8n/Make/Zapier/backend. Corpo:
  ```json
  { "type": "lead", "eventId": "…", "createdAt": "…", "name": "…", "email": "…", "phone": "…",
    "message": "…", "pageUrl": "…", "consent": true, "fields": { "entrada": "…" },
    "attribution": { "utm_source": "…", "utm_medium": "…", "utm_campaign": "…", "utm_content": "…",
      "utm_term": "…", "first_utm_source": "…", "landing_page": "…", "referrer": "…",
      "gclid": "…", "fbc": "…", "fbp": "…", "ga_client_id": "…" } }
  ```
  Com `CRM_WEBHOOK_SECRET`, o header `X-Signature: sha256=<hmac do corpo>` permite validar a origem.
  Guarde `gclid`/`fbc`/`eventId` no CRM: são eles que permitem subir conversão offline (venda) depois.
- `rdstation` — API de conversões do RD Station Marketing. Campos extras vão como `cf_<chave>`.
- `kommo` — integração privada com token de longa duração (`src/lib/crm/kommo.ts`). Cada lead vira, numa chamada só
  (`/api/v4/leads/complex`), **contato** (nome, telefone `+55…`, e-mail) + **negócio** no funil/etapa de
  `KOMMO_PIPELINE_ID`/`KOMMO_STATUS_ID`, com as tags de `KOMMO_TAGS` (padrão `site`). Em seguida entra uma **nota** no
  negócio com todas as respostas extras, UTMs de 1º e último toque, `gclid`/`fbc`/`fbp` e `event_id` — nada se perde
  mesmo sem mapear campo.
  - Para ter respostas e UTMs em **campos filtráveis**, ligue chave → id do campo do negócio em `KOMMO_FIELD_MAP`:
    `{"entrada":123456,"parcela":123457,"utm_source":654321,"gclid":654322}`. Chaves aceitas: as de `fields` e as da
    atribuição (`utm_*`, `first_utm_*`, `gclid`, `fbc`, `fbp`, `landing_page`, `referrer`, `event_id`, `page_url`).
  - `npm run check:tracking:live` confere token, funil, etapa e campos do mapa, e lista os campos de UTM da conta
    (tipo *tracking_data*) que ainda não estão mapeados, já com o id.
  - Se o `/leads/complex` falhar, é falha de CRM (502, nada dispara). Se só a nota falhar, o lead conta como enviado
    (o negócio já existe; reenviar duplicaria) e o motivo aparece no log.
- Outro CRM: crie um adapter em `src/lib/crm/` com a mesma assinatura de `sendWebhook` e registre em `sendLeadToCrm`.

### Perguntas extras no formulário

Qualquer input com `name="fields.<chave>"` (chave em minúsculas, números e `_`, até 20 campos) vai para o CRM em
`fields`, sem mexer no tracking:

```tsx
<select name="fields.entrada">
  <option>Até R$ 70 mil</option>
  <option>R$ 70 a 100 mil</option>
</select>
<input type="hidden" name="fields.imovel" value="algarve" />
```

No webhook chega como `"fields": { "entrada": "R$ 70 a 100 mil", "imovel": "algarve" }`; no RD Station como
`cf_entrada`; no Kommo na nota e, se mapeado, no campo personalizado.

Se o CRM falhar, o formulário mostra erro, **nenhuma conversão é disparada** (a pessoa vai tentar de novo) e o
lead completo vai para o log da Vercel como `[lead] CRM falhou … Lead para recuperação`. Esse log tem dado
pessoal — trate o acesso aos logs de acordo.

## Adicionando um evento

1. Acrescente em `src/lib/tracking/events.ts` (nome Meta, GA4 e dataLayer).
2. Dispare com `trackEvent('seu_evento', { … })` num componente client.
3. `npm test` — o catálogo é validado (nomes únicos, prefixo `trk_`).

## Estrutura

```
src/
  proxy.ts                       captura UTM/click ids em cookies first-party
  app/api/lead/route.ts          lead → CRM → plataformas
  app/api/track/route.ts         eventos não-lead → CAPI
  app/api/tracking-health/       diagnóstico protegido por token
  components/
    LeadForm.tsx  WhatsAppButton.tsx  ConsentBanner.tsx
    tracking/                    TrackingHead, PageViewTracker, trackEvent()
  lib/
    config.ts                    leitura + validação das envs (usado no build, runtime e testes)
    tracking/                    catálogo de eventos, cookies, atribuição, scripts por modo, cliente do browser
    server/                      Meta CAPI, GA4 MP, Google Ads API, dispatch, handlers das rotas
    crm/                         webhook, RD Station, Kommo
scripts/check-tracking.ts        checagem pré-build e ao vivo
tests/unit, tests/e2e
```
