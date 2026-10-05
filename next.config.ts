import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Fixa a raiz no projeto (evita o Next "subir" até um package-lock de pasta acima).
  turbopack: { root: process.cwd() },
}

export default nextConfig
