'use client'
/** GSAP com os plugins registrados uma vez só. Importe daqui, não de 'gsap'. */
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)
  gsap.defaults({ ease: 'power3.out', duration: 0.9 })
}

export { gsap, ScrollTrigger, SplitText, useGSAP }

export const MOTION_OK = '(prefers-reduced-motion: no-preference)'
export const FINE_POINTER = '(hover: hover) and (pointer: fine)'
