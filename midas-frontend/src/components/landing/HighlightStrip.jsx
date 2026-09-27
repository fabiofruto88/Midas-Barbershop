import { useRef } from 'react'
import { highlights } from '../../content/landing'
import { conditions, gsap, useGSAP } from '../../lib/gsap'
import { duration, scroll } from '../../lib/motion'

const number = new Intl.NumberFormat('en-US')

// Cuenta desde 0 hasta la cifra la primera vez que entra en pantalla. Los lectores de pantalla
// leen solo el valor final; con reduced-motion se muestra directamente. El texto lo escribe solo
// GSAP (no React), para que la animación y el render no se pisen.
function CountUp({ value, count }) {
  const ref = useRef(null)
  const suffix = value.replace(/^[\d.,]+/, '')

  useGSAP(
    () => {
      const node = ref.current
      const mm = gsap.matchMedia()
      mm.add(conditions.reduce, () => {
        node.textContent = value
      })
      mm.add(`${conditions.desktop}, ${conditions.mobile}`, () => {
        const state = { value: 0 }
        const render = () => {
          node.textContent = `${number.format(Math.round(state.value))}${suffix}`
        }
        render()
        gsap.to(state, {
          value: count,
          duration: duration.counter,
          onUpdate: render,
          scrollTrigger: { trigger: node, start: scroll.revealStart, end: 'max', once: true },
        })
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

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
