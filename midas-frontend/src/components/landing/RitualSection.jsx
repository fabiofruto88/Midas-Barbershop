import { useRef } from 'react'
import { ritualSteps } from '../../content/landing'
import { conditions, gsap, useBatchReveal, useGSAP, useScrubText } from '../../lib/gsap'
import { scroll, useMediaQuery } from '../../lib/motion'
import SectionHeading, { Accent } from './SectionHeading'
import Reveal from './Reveal'

const pad = (value) => String(value).padStart(2, '0')

// "El ritual Midas": en desktop se fija y recorre los cuatro tiempos con el scroll (scrub).
// En móvil y con reduced-motion es una lista que se revela al bajar; nunca secuestra el scroll táctil.
export default function RitualSection() {
  const sectionRef = useRef(null)
  const listRef = useRef(null)
  const introRef = useRef(null)
  const pinned = useMediaQuery(conditions.desktop)

  useBatchReveal(listRef, [pinned])
  // La bajada se "enciende" palabra a palabra justo hasta que la sección se fija.
  useScrubText(introRef, { trigger: sectionRef, start: scroll.revealStart, end: 'top top' })

  useGSAP(
    () => {
      if (!pinned) return
      const q = gsap.utils.selector(sectionRef)
      const steps = q('[data-step]')
      const numbers = q('[data-step-number]')
      const { hold, dim, numberShift, stepLength } = scroll.pin
      const change = 1 - hold

      gsap.set(steps.slice(1), { opacity: dim })
      gsap.set(numbers.slice(1), { opacity: 0, yPercent: numberShift })

      // Cada paso se sostiene `hold` antes de ceder al siguiente: son las pausas del recorrido.
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: `+=${steps.length * stepLength}%`,
          pin: true,
          scrub: scroll.scrub.pin,
          // Con refreshPriority definido, ScrollTrigger ordena todos los triggers por su posición en
          // la página al recalcular (los pins creados tarde no desalinean a los de abajo).
          refreshPriority: 0,
        },
      })
      tl.fromTo(q('[data-rail-fill]'), { scaleY: 1 / steps.length }, { scaleY: 1, duration: steps.length - 1 }, 0)
      for (let index = 1; index < steps.length; index++) {
        const at = index - 1 + hold
        tl.to(steps[index - 1], { opacity: dim, duration: change }, at)
          .to(steps[index], { opacity: 1, duration: change }, at)
          // El numeral saliente se va en la primera mitad y el entrante llega en la segunda: nunca se superponen.
          .to(numbers[index - 1], { opacity: 0, yPercent: -numberShift, duration: change / 2 }, at)
          .to(numbers[index], { opacity: 1, yPercent: 0, duration: change / 2 }, at + change / 2)
      }
      tl.to({}, { duration: hold })
    },
    { scope: sectionRef, dependencies: [pinned], revertOnUpdate: true },
  )

  return (
    <section
      ref={sectionRef}
      id="ritual"
      aria-labelledby="ritual-title"
      className={`border-t border-line/20 bg-bg ${pinned ? 'flex h-svh items-center pt-20' : 'py-20'}`}
    >
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-12 px-4 sm:px-8 lg:grid-cols-12 lg:gap-8 xl:px-16">
        <Reveal className="flex flex-col gap-6 self-center lg:col-span-5">
          <SectionHeading
            id="ritual-title"
            eyebrowRule
            eyebrow="El ritual Midas"
            title={
              <>
                Cuatro tiempos, <Accent>un solo estándar</Accent>
              </>
            }
            titleClassName="text-[32px] leading-10 tracking-[0.025em] sm:text-[40px] sm:leading-12"
            className="[&>h2]:pt-0"
          />
          <p ref={introRef} className="max-w-[460px] text-base leading-[26px] font-light tracking-[0.01em] text-text-soft">
            Del primer clic a la última pasada de navaja, cada visita sigue el mismo protocolo: sin prisas, sin
            improvisar y con toda la atención puesta en ti.
          </p>
          {pinned && (
            // Numeral grande del paso activo (decorativo: el número también está en cada paso).
            <div aria-hidden className="relative h-[120px] overflow-clip">
              {ritualSteps.map((step, index) => (
                <span
                  key={step.title}
                  data-step-number
                  className="text-gold absolute inset-0 font-display text-[120px] leading-[120px] font-semibold"
                >
                  {pad(index + 1)}
                </span>
              ))}
            </div>
          )}
        </Reveal>

        <div className="relative lg:col-span-6 lg:col-start-7">
          {/* Riel dorado que se llena con el avance del recorrido. */}
          <span aria-hidden className="absolute top-0 bottom-0 left-[19px] w-px bg-line/40">
            <span data-rail-fill className="block size-full origin-top bg-brand" />
          </span>
          <ol ref={listRef} className="relative flex flex-col gap-8">
            {ritualSteps.map((step, index) => (
              <li key={step.title} data-step data-batch={pinned ? undefined : true} className="flex gap-6">
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center rounded-full border border-brand/40 bg-bg font-display text-sm font-semibold text-brand"
                >
                  {pad(index + 1)}
                </span>
                <div className="flex flex-col gap-1 pt-1.5">
                  <h3 className="font-display text-2xl leading-8 font-medium text-text uppercase">{step.title}</h3>
                  <p className="max-w-[440px] text-sm leading-[22px] tracking-[0.01em] text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
