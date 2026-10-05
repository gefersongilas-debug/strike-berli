'use client'
import { useEffect, useState, type ReactNode } from 'react'

const day = (d: string, end: boolean) => new Date(`${d}T${end ? '23:59:59' : '00:00:00'}-03:00`).getTime()

/**
 * Mostra o conteúdo só dentro da janela [from, end] (dias inteiros, horário de
 * Brasília). Serve para selos e ofertas sazonais: passou a data, some sozinho,
 * sem deploy.
 */
export function UntilDate({ end, from, children }: { end: string; from?: string; children: ReactNode }) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const now = Date.now()
    setOn(now <= day(end, true) && (!from || now >= day(from, false)))
  }, [end, from])
  return on ? children : null
}
