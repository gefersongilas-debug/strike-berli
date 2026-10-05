/**
 * Diagnóstico da configuração em produção, sem expor nenhum valor.
 *   curl -H "Authorization: Bearer $TRACKING_HEALTH_TOKEN" https://site.com/api/tracking-health
 */
import { validateTrackingConfig } from '@/lib/config'
import { getServerConfig } from '@/lib/server/server-config'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const token = getServerConfig().healthToken
  if (!token || req.headers.get('authorization') !== `Bearer ${token}`) {
    return new Response('Not found', { status: 404 })
  }
  const result = validateTrackingConfig(process.env)
  return Response.json({ ok: result.errors.length === 0, ...result }, { status: result.errors.length ? 500 : 200 })
}
