import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { galleryFilters, galleryItems } from '../../content/landing'
import SectionHeading, { Accent } from './SectionHeading'
import Reveal from './Reveal'

const ease = [0.23, 1, 0.32, 1]

function GalleryCard({ item }) {
  return (
    <motion.figure
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
      transition={{ duration: 0.3, ease }}
      className="group relative flex flex-col overflow-clip border border-line/20 bg-surface-2 p-px"
    >
      <img
        src={item.image}
        alt={item.alt}
        loading="lazy"
        className="h-[358px] w-full object-cover grayscale transition-transform duration-500 ease-(--ease-out) [@media(hover:hover)]:group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      <div aria-hidden className="absolute inset-0 bg-linear-to-t from-bg via-bg/20 to-bg/0 opacity-80" />
      <figcaption className="absolute inset-x-0 -bottom-4 flex flex-col p-4 transition-transform duration-300 ease-(--ease-out) [@media(hover:hover)]:group-hover:-translate-y-4 motion-reduce:transition-none">
        <span className="text-[9px] leading-3 font-bold tracking-[0.25em] text-brand uppercase">{item.eyebrow}</span>
        <span className="pb-2 font-display text-xl leading-7 font-medium text-text">{item.title}</span>
        <span className="grid grid-cols-2 gap-4 border-t border-line/30 pt-2 text-xs leading-[18px] tracking-[0.02em]">
          <span className="text-muted">{item.meta}</span>
          <span className="font-medium text-brand-soft">{item.detail}</span>
        </span>
      </figcaption>
    </motion.figure>
  )
}

export default function GallerySection() {
  const [filter, setFilter] = useState(galleryFilters[0])
  const items = filter === galleryFilters[0] ? galleryItems : galleryItems.filter((item) => item.category === filter)

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
            description="Registro visual de nuestras creaciones más distinguidas en caballeros líderes de la diplomacia, finanzas y arte."
            className="max-w-[560px] pt-1.5"
          />
          <div
            role="group"
            aria-label="Filtrar por estilo"
            className="flex w-full max-w-[491px] flex-wrap gap-y-1 border border-line/30 bg-card p-1"
          >
            {galleryFilters.map((name) => {
              const selected = name === filter
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setFilter(name)}
                  className={`pressable px-4 py-1.5 text-[9px] leading-3 font-bold tracking-[0.05em] uppercase ${
                    selected ? 'bg-brand text-on-brand' : 'text-muted hover:text-brand'
                  }`}
                >
                  {name}
                </button>
              )
            })}
          </div>
        </Reveal>

        <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            {items.map((item) => (
              <GalleryCard key={item.title} item={item} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
