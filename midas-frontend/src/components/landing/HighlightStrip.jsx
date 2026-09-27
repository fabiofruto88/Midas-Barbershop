import { useLayoutEffect, useRef } from 'react'
import { animate, useInView, useReducedMotion } from 'motion/react'
import { highlights } from '../../content/landing'
import { duration, ease } from '../../lib/motion'

const number = new Intl.NumberFormat('en-US')

// Cuenta desde 0 hasta la cifra la primera vez que entra en pantalla. Los lectores de pantalla
// leen solo el valor final; con reduced-motion se muestra directamente.
function CountUp({ value, count }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' })
  const reduce = useReducedMotion()
  const suffix = value.replace(/^[\d.,]+/, '')

  // El texto lo escribe solo este efecto (no React), para que la animación y el render no se pisen.
  useLayoutEffect(() => {
    const node = ref.current
    node.textContent = reduce ? value : `0${suffix}`
    if (!inView || reduce) return
    const controls = animate(0, count, {
      duration: duration.counter,
      ease: ease.out,
      onUpdate: (latest) => {
        node.textContent = `${number.format(Math.round(latest))}${suffix}`
      },
    })
    return () => controls.stop()
  }, [inView, reduce, value, count, suffix])

  return (
    <>
      <span className="sr-only">{value}</span>
      <span ref={ref} aria-hidden className="tabular-nums" />
    </>
  )
}

export default function HighlightStrip() {
  return (
    <section aria-label="Midas en cifras" className="border-y border-line/30 bg-surface py-4">
      <dl className="mx-auto grid max-w-[1440px] grid-cols-2 gap-6 px-4 text-center sm:px-8 md:flex md:justify-center xl:px-16">
        {highlights.map((item) => (
          <div key={item.label} className="flex flex-col-reverse items-center gap-1 md:flex-1">
            <dt className="text-[9px] leading-3 font-bold tracking-[0.2em] text-muted uppercase">{item.label}</dt>
            <dd className="font-display text-2xl leading-8 font-medium tracking-[0.1em] text-brand uppercase">
              {item.count ? <CountUp value={item.value} count={item.count} /> : item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
