import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { resultsApi } from '../../services/midas'
import { queryKeys } from '../../lib/queryClient'
import { optimizedImageUrl } from '../../lib/images'
import { duration, scale, scroll, spring, useMediaQuery } from '../../lib/motion'
import { conditions, Flip, gsap, ScrollTrigger, useBatchReveal, useGSAP } from '../../lib/gsap'
import SectionHeading, { Accent } from './SectionHeading'
import Reveal from './Reveal'

const ALL = 'Todos'
const MAX_FILTERS = 4

const monthYear = (value) =>
  new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value))

function GalleryCard({ item, hidden, horizontal }) {
  const { service, barber, date } = item.appointment
  return (
    <figure
      data-card
      data-batch
      className={`group relative flex flex-col overflow-clip border border-line/20 bg-surface-2 p-px ${
        hidden ? 'hidden' : ''
      } ${horizontal ? 'shrink-0' : ''}`}
      style={horizontal ? { width: scroll.horizontal.cardWidth } : undefined}
    >
      {/* La foto es un 10% más alta que su marco para el parallax (sin asomar bordes). */}
      <div className="relative h-[358px] overflow-clip">
        <img
          data-parallax
          src={optimizedImageUrl(item.imageUrl, { width: 600, height: 720 })}
          alt={`${service.name} realizado por ${barber.name}`}
          loading="lazy"
          className="absolute inset-x-0 top-[-5%] h-[110%] w-full object-cover grayscale transition-[scale] duration-(--duration-reveal) ease-(--ease-out) [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-(--scale-image-hover) motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </div>
      <div aria-hidden className="absolute inset-0 bg-linear-to-t from-bg via-bg/20 to-bg/0 opacity-80" />
      <figcaption className="absolute inset-x-0 -bottom-4 flex flex-col p-4 transition-[translate] duration-(--duration-fade) ease-(--ease-out) [@media(hover:hover)_and_(pointer:fine)]:group-hover:-translate-y-4 motion-reduce:transition-none">
        <span className="text-[9px] leading-3 font-bold tracking-[0.25em] text-brand uppercase">Resultado real</span>
        <span className="pb-2 font-display text-xl leading-7 font-medium text-text">{service.name}</span>
        <span className="grid grid-cols-2 gap-4 border-t border-line/30 pt-2 text-xs leading-[18px] tracking-[0.02em]">
          <span className="text-muted">Barbero: {barber.name}</span>
          <span className="font-medium text-brand-soft first-letter:uppercase">{monthYear(date)}</span>
        </span>
      </figcaption>
    </figure>
  )
}

export default function GallerySection() {
  const [filter, setFilter] = useState(ALL)
  const sectionRef = useRef(null)
  const viewportRef = useRef(null)
  const trackRef = useRef(null)
  const flipState = useRef(null)
  const { data: results, isPending, error } = useQuery({
    queryKey: queryKeys.publishedResults,
    queryFn: resultsApi.published,
    staleTime: 5 * 60 * 1000,
  })

  // Filtros según los servicios que tienen fotos publicadas (los más frecuentes).
  const counts = new Map()
  for (const item of results ?? []) {
    const name = item.appointment.service.name
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  const filters = [ALL, ...[...counts].sort((a, b) => b[1] - a[1]).slice(0, MAX_FILTERS).map(([name]) => name)]
  const active = filters.includes(filter) ? filter : ALL
  const visible = (item) => active === ALL || item.appointment.service.name === active
  const hasVisible = (results ?? []).some(visible)

  // Recorrido horizontal solo en desktop sin reduced-motion y con portafolio suficiente (el total,
  // no lo filtrado, para que filtrar no cambie de modo). En el resto, grilla con scroll nativo.
  const desktop = useMediaQuery(conditions.desktop)
  const horizontal = desktop && (results?.length ?? 0) >= scroll.horizontal.minItems

  useBatchReveal(trackRef, [results, horizontal])

  // Pin + desplazamiento horizontal (scrub), o parallax de las fotos en la grilla de desktop.
  useGSAP(
    () => {
      if (!desktop || !trackRef.current) return
      const track = trackRef.current

      if (horizontal) {
        const distanceX = () => Math.max(track.scrollWidth - viewportRef.current.clientWidth, 0)
        gsap.to(track, {
          x: () => -distanceX(),
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: () => `+=${Math.max(distanceX(), 1)}`,
            pin: true,
            scrub: scroll.scrub.pin,
            invalidateOnRefresh: true,
            // Ordena los triggers por posición al recalcular: este pin se crea tarde (datos del API).
            refreshPriority: 0,
          },
        })
        return
      }

      const range = scroll.parallax.gallery
      for (const image of gsap.utils.toArray('[data-parallax]', track)) {
        gsap.fromTo(
          image,
          { yPercent: -range },
          {
            yPercent: range,
            ease: 'none',
            scrollTrigger: { trigger: image.parentElement, start: 'top bottom', end: 'bottom top', scrub: scroll.scrub.smooth },
          },
        )
      }
    },
    { scope: sectionRef, dependencies: [desktop, horizontal, results], revertOnUpdate: true },
  )

  // Filtrado con Flip: las tarjetas que quedan se deslizan a su nuevo sitio y las nuevas aparecen.
  // Las que salen desaparecen al instante (las salidas son más rápidas que las entradas).
  useGSAP(
    () => {
      const state = flipState.current
      flipState.current = null
      if (!state) return
      if (window.matchMedia(conditions.reduce).matches) {
        ScrollTrigger.refresh()
        return
      }
      Flip.from(state, {
        targets: gsap.utils.toArray('[data-card]', trackRef.current),
        duration: duration.fade,
        onEnter: (elements) =>
          gsap.fromTo(
            elements,
            { opacity: 0, scale: scale.enter },
            { opacity: 1, scale: 1, y: 0, duration: duration.fade },
          ),
        onComplete: () => ScrollTrigger.refresh(),
      })
    },
    { scope: sectionRef, dependencies: [active] },
  )

  const choose = (name) => {
    if (name === active) return
    if (trackRef.current) flipState.current = Flip.getState(gsap.utils.toArray('[data-card]', trackRef.current))
    setFilter(name)
  }

  return (
    <section
      ref={sectionRef}
      id="galeria"
      aria-labelledby="galeria-title"
      className={`overflow-clip border-t border-line/20 bg-bg-alt ${
        horizontal ? 'flex min-h-svh flex-col justify-center pt-24 pb-16' : 'pt-20 pb-20 lg:pt-28 lg:pb-28'
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 sm:px-8 xl:px-16">
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id="galeria-title"
            eyebrow="Portafolio de oro"
            title={
              <>
                Resultados <Accent>impecables</Accent>
              </>
            }
            description="Trabajos reales de nuestros barberos, tomados al terminar cada servicio."
            className="max-w-[560px] pt-1.5"
          />
          {filters.length > 2 && (
            <div
              role="group"
              aria-label="Filtrar por servicio"
              className="flex w-fit max-w-full flex-wrap gap-y-1 border border-line/30 bg-card p-1"
            >
              {filters.map((name) => {
                const selected = name === active
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => choose(name)}
                    className={`pressable relative px-4 py-1.5 text-[9px] leading-3 font-bold tracking-[0.05em] uppercase ${
                      selected ? 'text-on-brand' : 'text-muted hover:text-brand'
                    }`}
                  >
                    {/* El fondo activo se desliza al filtro elegido. */}
                    {selected && (
                      <motion.span
                        layoutId="galeria-filtro"
                        aria-hidden
                        className="absolute inset-0 bg-brand"
                        transition={spring.layout}
                      />
                    )}
                    <span className="relative">{name}</span>
                  </button>
                )
              })}
            </div>
          )}
        </Reveal>

        {isPending ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
            {[0, 1, 2, 3].map((key) => (
              <span
                key={key}
                aria-hidden
                className="block h-[360px] animate-pulse border border-line/20 bg-surface-2 motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : error ? (
          <p role="alert" className="border border-line/30 bg-card p-6 text-sm text-danger">
            No pudimos cargar la galería. {error.message}
          </p>
        ) : !hasVisible ? (
          <p className="border border-line/30 bg-card p-6 text-sm text-muted">
            Muy pronto compartiremos aquí los trabajos de nuestros barberos.
          </p>
        ) : (
          <div ref={viewportRef}>
            {/* Todas las tarjetas se renderizan y las filtradas se ocultan: así Flip conoce ambos estados. */}
            <div
              ref={trackRef}
              aria-live="polite"
              className={horizontal ? 'flex w-max gap-6' : 'grid gap-6 sm:grid-cols-2 lg:grid-cols-4'}
            >
              {results.map((item) => (
                <GalleryCard key={item.id} item={item} hidden={!visible(item)} horizontal={horizontal} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
