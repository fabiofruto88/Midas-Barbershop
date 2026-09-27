import { useRef } from 'react'
import { gsap, motionOk, useGSAP } from '../../lib/gsap'
import { scroll } from '../../lib/motion'

// Barra de progreso de lectura bajo el header: 1:1 con el scroll (sin suavizado, un indicador
// con retraso se siente roto). Decorativa; con reduced-motion no se muestra.
export default function ScrollProgress() {
  const ref = useRef(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(motionOk, () => {
        gsap.fromTo(
          ref.current,
          { scaleX: 0 },
          { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: scroll.scrub.indicator } },
        )
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-20 z-50 h-0.5 origin-left bg-gold motion-reduce:hidden"
    />
  )
}
