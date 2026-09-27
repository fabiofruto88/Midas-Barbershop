import { useRef } from 'react'
import { useServices } from '../../hooks/useCatalog'
import { useBookingStore } from '../../store/bookingStore'
import { useBookingAccess } from '../../hooks/useAuth'
import { formatPrice } from '../../lib/format'
import { useBatchReveal } from '../../lib/gsap'
import iconCrown from '../../assets/landing/icon-crown.svg'
import iconScissors from '../../assets/landing/icon-scissors.svg'
import iconSpa from '../../assets/landing/icon-spa.svg'
import iconMedal from '../../assets/landing/icon-medal.svg'
import iconChevron from '../../assets/landing/icon-chevron-right.svg'
import SectionHeading, { Accent } from './SectionHeading'
import Icon from './Icon'
import Reveal from './Reveal'

// Iconos decorativos que se alternan entre los servicios del catálogo.
const icons = [
  { src: iconCrown, className: 'h-[19.5px] w-[21.667px]' },
  { src: iconScissors, className: 'size-[21.667px]' },
  { src: iconSpa, className: 'size-[21.667px]' },
  { src: iconMedal, className: 'h-[21.667px] w-[10.833px]' },
]

function ServiceCard({ service, index, featured }) {
  const selectService = useBookingStore((state) => state.selectService)
  const { canBook } = useBookingAccess()
  const icon = icons[index % icons.length]
  const titleId = `servicio-${service.id}`

  return (
    <article
      data-batch
      aria-labelledby={titleId}
      className={`lift relative flex h-full flex-col justify-between ${
        featured
          ? 'border-2 border-brand/70 bg-surface-2 p-6 drop-shadow-[0px_12px_20px_rgba(212,175,55,0.2)]'
          : 'border border-line/30 bg-card p-6 hover:border-brand/40'
      }`}
    >
      {featured ? (
        <p className="absolute -top-3 left-1/2 -translate-x-1/2 bg-linear-to-r from-brand-strong to-[#d4af37] px-3 py-0.5 text-[9px] leading-[13.5px] font-bold tracking-[0.25em] whitespace-nowrap text-on-brand uppercase">
          Experiencia completa
        </p>
      ) : (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-brand/0 via-brand/30 to-brand/0"
        />
      )}

      <div className={`flex flex-col gap-1 pb-4 ${featured ? 'pt-1' : ''}`}>
        <div className="flex items-center justify-between">
          <span
            aria-hidden
            className={`grid size-12 place-items-center border ${
              featured ? 'border-brand bg-brand/20' : 'border-brand/20 bg-surface-2'
            }`}
          >
            <Icon src={icon.src} className={icon.className} />
          </span>
          <p className="text-[9px] leading-3 font-bold tracking-[0.1em] text-brand uppercase">
            <span className="sr-only">Duración: </span>
            {service.durationMinutes} min
          </p>
        </div>
        <h3
          id={titleId}
          className={`pt-3 font-display text-xl leading-7 font-medium uppercase ${featured ? 'text-brand' : 'text-text'}`}
        >
          {service.name}
        </h3>
        {service.description && (
          <p
            className={`text-xs leading-[19.5px] tracking-[0.02em] ${featured ? 'text-text-soft' : 'text-muted'}`}
          >
            {service.description}
          </p>
        )}
      </div>

      <div
        className={`flex items-center justify-between border-t pt-4 ${featured ? 'border-brand/30' : 'border-line/30'}`}
      >
        <p className={`font-display text-xl leading-7 font-bold ${featured ? 'text-brand' : 'text-brand-soft'}`}>
          <span className="sr-only">Precio: </span>
          {formatPrice(service.price)}
        </p>
        {/* Preselecciona el servicio en la terminal de reserva de esta misma página. */}
        {!canBook ? null : featured ? (
          <a
            href="#reservas"
            onClick={() => selectService(service.id)}
            className="pressable bg-gold px-4 py-2 text-[9px] leading-3 font-bold tracking-[0.1em] text-on-brand uppercase hover:brightness-110"
          >
            Reservar<span className="sr-only"> {service.name}</span>
          </a>
        ) : (
          <a
            href="#reservas"
            onClick={() => selectService(service.id)}
            className="group/link hit-area flex items-center gap-1 py-1 text-[9px] leading-3 font-bold tracking-[0.1em] text-brand uppercase"
          >
            Elegir<span className="sr-only"> {service.name}</span>
            <Icon
              src={iconChevron}
              className="h-[7px] w-[4.317px] transition-[translate] duration-(--duration-hover) ease-(--ease-out) [@media(hover:hover)_and_(pointer:fine)]:group-hover/link:translate-x-0.5 motion-reduce:transition-none"
            />
          </a>
        )}
      </div>
    </article>
  )
}

function ServiceGrid() {
  const { data: services, isPending, error } = useServices()
  const gridRef = useRef(null)
  useBatchReveal(gridRef, [services])

  if (isPending) {
    return (
      <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
        {[0, 1, 2, 3].map((key) => (
          <span
            key={key}
            aria-hidden
            className="block h-64 animate-pulse border border-line/20 bg-card motion-reduce:animate-none"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p role="alert" className="border border-line/30 bg-card p-6 text-sm text-danger">
        No pudimos cargar los servicios. {error.message}
      </p>
    )
  }

  if (!services.length) {
    return (
      <p className="border border-line/30 bg-card p-6 text-sm text-muted">
        Muy pronto publicaremos nuestra carta de servicios.
      </p>
    )
  }

  // Se destaca el servicio más completo (el de mayor precio) cuando hay varios.
  const featuredId =
    services.length > 1
      ? services.reduce((top, item) => (Number(item.price) > Number(top.price) ? item : top)).id
      : null

  return (
    <div ref={gridRef} className="grid items-stretch gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
      {services.map((service, index) => (
        <ServiceCard key={service.id} service={service} index={index} featured={service.id === featuredId} />
      ))}
    </div>
  )
}

export default function ServicesSection() {
  return (
    <section id="servicios" aria-labelledby="servicios-title" className="bg-bg-alt py-20 lg:py-32">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-4 sm:px-8 xl:px-16">
        <Reveal className="flex flex-col gap-4 border-b border-line/20 pb-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            id="servicios-title"
            eyebrowRule
            eyebrow="Carta de servicios"
            title={
              <>
                Nuestro arte, <Accent>tu legado</Accent>
              </>
            }
            titleClassName="text-[32px] leading-10 tracking-[0.025em] sm:text-[40px] sm:leading-12"
            description="Cada servicio se realiza con cita previa y atención exclusiva de tu barbero durante toda la sesión: técnica precisa, productos de calidad y el tiempo necesario para que salgas impecable."
            descriptionClassName="text-sm leading-[22px] font-light tracking-[0.01em] text-text-soft"
            className="max-w-[672px] [&>h2]:pt-0"
          />
          <p className="text-[9px] leading-3 font-bold tracking-[0.2em] text-muted uppercase md:text-right">
            Precios en pesos colombianos · Sesiones de 60 minutos
          </p>
        </Reveal>

        <ServiceGrid />
      </div>
    </section>
  )
}
