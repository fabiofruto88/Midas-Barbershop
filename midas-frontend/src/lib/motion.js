import { useCallback, useSyncExternalStore } from 'react'
import { useReducedMotion } from 'motion/react'
import dna from '../../design-dna.json'

// Tokens de motion de Midas (fuente: design-dna.json). Ningún componente define curvas ni duraciones propias.
export const { ease, duration, spring, distance, scale, stagger } = dna.motion
export const heroTimeline = dna.motion.hero
export const scroll = dna.motion.scroll

// Las salidas son más rápidas que las entradas.
export const exitDuration = (value) => value * duration.exitFactor

// Retraso escalonado con tope: una lista larga nunca hace esperar a su último elemento.
export const staggerDelay = (index, step = stagger.item) => Math.min(index * step, stagger.maxTotal)

export const media = {
  finePointer: '(hover: hover) and (pointer: fine)',
  desktop: `(min-width: ${scroll.pin.breakpoint}px)`,
}

export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}

// Qué motion de UI permite el dispositivo (el motion de scroll vive en lib/gsap.js).
export function useMotionPrefs() {
  const reduce = Boolean(useReducedMotion())
  const desktop = useMediaQuery(media.desktop)
  const finePointer = useMediaQuery(media.finePointer)
  return {
    reduce,
    magnetic: finePointer && !reduce,
    shift: reduce ? 0 : desktop ? distance.md : distance.sm,
  }
}

// Sacudida breve para un error al enviar (WAAPI: se reinicia en cada intento, sin librería).
export function shake(element) {
  if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const x = distance.xs
  element.animate(
    [{ translate: '0' }, { translate: `${-x}px` }, { translate: `${x}px` }, { translate: `${-x}px` }, { translate: '0' }],
    { duration: duration.fade * 1000, easing: `cubic-bezier(${ease.inOut.join(',')})` },
  )
}
