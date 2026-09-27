import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { CustomEase } from 'gsap/CustomEase'
import { Flip } from 'gsap/Flip'
import { useGSAP } from '@gsap/react'
import { distance, duration, ease, scroll, stagger } from './motion'

// Motion dirigido por scroll (GSAP). El motion de UI (menús, drawer, layoutId) sigue en Motion;
// nunca animan el mismo elemento.
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, CustomEase, Flip)

// Las curvas del design-dna, como eases de GSAP.
CustomEase.create('midas-out', ease.out.join(','))
CustomEase.create('midas-inOut', ease.inOut.join(','))
CustomEase.create('midas-drawer', ease.drawer.join(','))
gsap.defaults({ ease: 'midas-out', duration: duration.reveal })

// En móvil, mostrar/ocultar la barra del navegador no recalcula posiciones (evita saltos).
ScrollTrigger.config({ ignoreMobileResize: true })

const bp = scroll.pin.breakpoint
// Condiciones para gsap.matchMedia(): con reduced-motion no hay pin, scrub ni parallax.
export const conditions = {
  desktop: `(min-width: ${bp}px) and (prefers-reduced-motion: no-preference)`,
  mobile: `(max-width: ${bp - 0.02}px) and (prefers-reduced-motion: no-preference)`,
  reduce: '(prefers-reduced-motion: reduce)',
}
export const motionOk = '(prefers-reduced-motion: no-preference)'

// Recalcula todos los ScrollTriggers cuando cambia el layout (datos del API, imágenes, fuentes).
let refreshTimer
export function refreshScroll(delay = 150) {
  clearTimeout(refreshTimer)
  refreshTimer = setTimeout(() => ScrollTrigger.refresh(), delay)
}
document.fonts?.ready.then(() => refreshScroll(0))

// Cada palabra dividida lleva su propio degradado dorado; se alinea con el ancho del contenedor
// para que el brillo se lea continuo, como cuando era un solo texto. Devuelve la limpieza.
export function alignGradient(container, words) {
  const paint = () => {
    const box = container.getBoundingClientRect()
    for (const word of words) {
      word.style.backgroundSize = `${box.width}px 100%`
      word.style.backgroundPosition = `${box.left - word.getBoundingClientRect().left}px 0`
    }
  }
  paint()
  const observer = new ResizeObserver(paint)
  observer.observe(container)
  return () => observer.disconnect()
}

// Revela en cascada los [data-batch] de un contenedor al cruzar el viewport, una sola vez.
// end: 'max' hace que lo que ya quedó arriba (p. ej. al entrar por un ancla) también se revele.
export function useBatchReveal(scope, dependencies = []) {
  useGSAP(
    () => {
      if (!scope.current) return
      const items = gsap.utils.toArray('[data-batch]', scope.current)
      if (!items.length) return
      const mm = gsap.matchMedia()
      mm.add(conditions, ({ conditions: { desktop, reduce } }) => {
        gsap.set(items, { opacity: 0, y: reduce ? 0 : desktop ? distance.md : distance.sm })
        ScrollTrigger.batch(items, {
          start: scroll.revealStart,
          end: 'max',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: reduce ? duration.fade : duration.reveal,
              stagger: Math.min(stagger.item, stagger.maxTotal / Math.max(batch.length - 1, 1)),
              overwrite: true,
            }),
        })
      })
      return () => mm.revert()
    },
    { scope, dependencies, revertOnUpdate: true },
  )
}

// Titular que se "enciende" palabra a palabra con el scroll (scrub). Sin reduced-motion únicamente.
export function useScrubText(ref, { gradient = false, trigger, start = scroll.textScrub.start, end = scroll.textScrub.end } = {}) {
  useGSAP(
    () => {
      const element = ref.current
      const mm = gsap.matchMedia()
      mm.add(motionOk, () => {
        const split = SplitText.create(element, { type: 'words', wordsClass: gradient ? 'split-gold' : 'split-word' })
        let stopGradient
        if (gradient) {
          gsap.set(element, { backgroundImage: 'none' })
          stopGradient = alignGradient(element, split.words)
        }
        gsap.fromTo(
          split.words,
          { opacity: scroll.textScrub.from },
          {
            opacity: 1,
            ease: 'none',
            stagger: stagger.item,
            scrollTrigger: { trigger: trigger?.current ?? element, start, end, scrub: scroll.scrub.smooth },
          },
        )
        return () => stopGradient?.()
      })
      return () => mm.revert()
    },
    { scope: ref },
  )
}

export { gsap, ScrollTrigger, SplitText, Flip, useGSAP }
