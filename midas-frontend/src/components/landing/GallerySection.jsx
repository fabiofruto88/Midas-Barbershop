import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { resultsApi } from '../../services/midas'
import { queryKeys } from '../../lib/queryClient'
import { optimizedImageUrl } from '../../lib/images'
import { duration, ease, exitDuration, scale, spring } from '../../lib/motion'
import SectionHeading, { Accent } from './SectionHeading'
import Reveal from './Reveal'

const ALL = 'Todos'
const MAX_FILTERS = 4

const monthYear = (value) =>
  new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value))

function GalleryCard({ item }) {
  const { service, barber, date } = item.appointment
  return (
    <motion.figure
      layout
      initial={{ opacity: 0, scale: scale.enter }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: scale.enter, transition: { duration: exitDuration(duration.fade), ease: ease.out } }}
      transition={{ duration: duration.fade, ease: ease.out }}
      className="group relative flex flex-col overflow-clip border border-line/20 bg-surface-2 p-px"
    >
      <img
        src={optimizedImageUrl(item.imageUrl, { width: 600, height: 720 })}
        alt={`${service.name} realizado por ${barber.name}`}
        loading="lazy"
        className="h-[358px] w-full object-cover grayscale transition-[scale] duration-(--duration-reveal) ease-(--ease-out) [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-(--scale-image-hover) motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      <div aria-hidden className="absolute inset-0 bg-linear-to-t from-bg via-bg/20 to-bg/0 opacity-80" />
      <figcaption className="absolute inset-x-0 -bottom-4 flex flex-col p-4 transition-[translate] duration-(--duration-fade) ease-(--ease-out) [@media(hover:hover)_and_(pointer:fine)]:group-hover:-translate-y-4 motion-reduce:transition-none">
        <span className="text-[9px] leading-3 font-bold tracking-[0.25em] text-brand uppercase">Resultado real</span>
        <span className="pb-2 font-display text-xl leading-7 font-medium text-text">{service.name}</span>
        <span className="grid grid-cols-2 gap-4 border-t border-line/30 pt-2 text-xs leading-[18px] tracking-[0.02em]">
          <span className="text-muted">Barbero: {barber.name}</span>
          <span className="font-medium text-brand-soft first-letter:uppercase">{monthYear(date)}</span>
        </span>
      </figcaption>
    </motion.figure>
  )
}

export default function GallerySection() {
  const [filter, setFilter] = useState(ALL)
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
  const items = (results ?? []).filter((item) => active === ALL || item.appointment.service.name === active)

  return (
    <section
      id="galeria"
      aria-labelledby="galeria-title"
      className="border-t border-line/20 bg-bg-alt pt-20 pb-20 lg:pt-28 lg:pb-28"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-4 sm:px-8 xl:px-16">
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
                    onClick={() => setFilter(name)}
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
        ) : !items.length ? (
          <p className="border border-line/30 bg-card p-6 text-sm text-muted">
            Muy pronto compartiremos aquí los trabajos de nuestros barberos.
          </p>
        ) : (
          <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map((item) => (
                <GalleryCard key={item.id} item={item} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  )
}
