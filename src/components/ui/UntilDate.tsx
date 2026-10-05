'use client'
import { useEffect, useState, type ReactNode } from 'react'

/**
 * Mostra o conteúdo só até a data (fim do dia, horário de Brasília). Serve para
 * selos sazonais como o Mês da Criança: passou a data, some sozinho, sem deploy.
 */
export function UntilDate({ end, children }: { end: string; children: ReactNode }) {
  const [on, setOn] = useState(false)
  useEffect(() => setOn(Date.now() <= new Date(`${end}T23:59:59-03:00`).getTime()), [end])
  return on ? children : null
}
