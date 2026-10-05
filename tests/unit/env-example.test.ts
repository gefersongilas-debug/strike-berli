/**
 * Garante que .env.example e o código não se desencontram: toda variável lida
 * está documentada, e nenhuma variável documentada está órfã.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ENV_KEYS, validateTrackingConfig } from '@/lib/config'

const root = join(__dirname, '..', '..')
const example = readFileSync(join(root, '.env.example'), 'utf8')
const exampleKeys = [...example.matchAll(/^([A-Z0-9_]+)=/gm)].map((m) => m[1])
const allKeys = [...ENV_KEYS.public, ...ENV_KEYS.server] as string[]

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? sourceFiles(p) : /\.(ts|tsx)$/.test(f) ? [p] : []
  })
}

describe('.env.example', () => {
  it('documenta toda variável que o código lê', () => {
    expect(allKeys.filter((k) => !exampleKeys.includes(k))).toEqual([])
  })

  it('não tem variável órfã', () => {
    expect(exampleKeys.filter((k) => !allKeys.includes(k))).toEqual([])
  })

  it('não traz nenhum segredo preenchido', () => {
    for (const k of ENV_KEYS.server) {
      if (/TOKEN|SECRET|API_KEY/.test(k)) expect(example).toMatch(new RegExp(`^${k}=$`, 'm'))
    }
  })

  it('copiado sem preencher, o build QUEBRA (não sobe site sem tracking)', () => {
    const env = Object.fromEntries(
      [...example.matchAll(/^([A-Z0-9_]+)=(.*)$/gm)].map((m) => [m[1], m[2]]),
    )
    expect(validateTrackingConfig({ ...env, VERCEL_ENV: 'production' }).errors.length).toBeGreaterThan(0)
  })
})

describe('código', () => {
  const files = sourceFiles(join(root, 'src'))

  it('toda variável process.env.X usada em src/ está em ENV_KEYS', () => {
    const used = new Set<string>()
    for (const f of files) {
      for (const m of readFileSync(f, 'utf8').matchAll(/process\.env\.([A-Z0-9_]*[A-Z0-9])\b/g)) used.add(m[1])
    }
    const ignored = new Set(['NODE_ENV', 'VERCEL_ENV'])
    expect([...used].filter((k) => !ignored.has(k) && !allKeys.includes(k))).toEqual([])
  })

  it('public-config referencia TODAS as NEXT_PUBLIC_* por extenso (senão o Next não inlina)', () => {
    const src = readFileSync(join(root, 'src/lib/tracking/public-config.ts'), 'utf8')
    for (const k of ENV_KEYS.public) expect(src).toContain(`process.env.${k}`)
  })

  it('nenhum componente client importa módulo de servidor (segredo vazaria no bundle)', () => {
    const offenders = files.filter((f) => {
      const s = readFileSync(f, 'utf8')
      return /^['"]use client['"]/m.test(s) && /from ['"]@\/lib\/(server|crm)/.test(s)
    })
    expect(offenders).toEqual([])
  })

  it('código client não lê segredo', () => {
    const offenders = files.filter((f) => {
      const s = readFileSync(f, 'utf8')
      return /^['"]use client['"]/m.test(s) && ENV_KEYS.server.some((k) => s.includes(k))
    })
    expect(offenders).toEqual([])
  })
})
