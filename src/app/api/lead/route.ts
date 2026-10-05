import { after } from 'next/server'
import { handleLead } from '@/lib/server/handlers'
import { getServerConfig } from '@/lib/server/server-config'

export async function POST(req: Request) {
  return handleLead(req, { cfg: getServerConfig(), defer: (task) => after(task) })
}
