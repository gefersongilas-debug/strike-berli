/** Config de servidor lida uma vez por instância da função. Não importar em componente client. */
import { parseServerConfig, type ServerConfig } from '@/lib/config'

let cached: ServerConfig | undefined

export function getServerConfig(): ServerConfig {
  cached ??= parseServerConfig(process.env)
  return cached
}
