'use client'
import { useEffect, useState } from 'react'
import { HALLOWEEN_CLASS } from '@/lib/season-theme'
import { Bats } from './SeasonDecor'
import { StrikeScene } from './StrikeScene'

/** Cena do topo da home: vira bola-abóbora com morcegos enquanto o tema de Halloween estiver ligado. */
export function HomeScene() {
  const [halloween, setHalloween] = useState(false)
  useEffect(() => setHalloween(document.documentElement.classList.contains(HALLOWEEN_CLASS)), [])

  return (
    <>
      {halloween && <Bats count={6} />}
      <StrikeScene key={halloween ? 'halloween' : 'classic'} variant={halloween ? 'halloween' : 'classic'} />
    </>
  )
}
