import { after } from 'next/server'
import { handleTrack } from '@/lib/server/handlers'
import { getServerConfig } from '@/lib/server/server-config'

export async function POST(req: Request) {
  return handleTrack(req, { cfg: getServerConfig(), defer: (task) => after(task) })
}
