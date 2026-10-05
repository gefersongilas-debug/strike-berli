import type { ReactNode } from 'react'
import { Motion } from '@/components/motion/Motion'

/** Remonta a cada navegação: as animações sempre olham para a página nova. */
export default function Template({ children }: { children: ReactNode }) {
  return <Motion>{children}</Motion>
}
