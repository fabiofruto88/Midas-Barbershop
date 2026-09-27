import { useRef } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { reviewsApi } from '../../services/midas'
import { useBookingAccess } from '../../hooks/useAuth'
import { queryKeys } from '../../lib/queryClient'
import { useBatchReveal } from '../../lib/gsap'
import { Stars } from '../ui/StarRating'
import SectionHeading, { Accent } from './SectionHeading'
import Reveal from './Reveal'

const initials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

const averageFormatter = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function TestimonialCard({ review, featured }) {
  const { service, barber } = review.appointment
  return (
    <figure
      data-batch
      className={`lift relative flex h-full flex-col justify-between border bg-card p-6 ${
        featured ? 'border-brand/40 drop-shadow-[0px_8px_15px_rgba(212,175,55,0.1)]' : 'border-line/30'
      }`}
    >
      <div className="mb-4">
        <Stars value={review.rating} className="size-4" />
      </div>
      <blockquote
        className={`pb-6 text-sm leading-[22.75px] tracking-[0.01em] wrap-break-word italic ${
          featured ? 'text-text' : 'text-text-soft'
        }`}
      >
        <p>"{review.comment}"</p>
      </blockquote>
      <figcaption
        className={`flex items-center gap-2 border-t pt-4 ${featured ? 'border-brand/30' : 'border-line/20'}`}
      >
        <span
          aria-hidden
          className={`grid size-10 shrink-0 place-items-center rounded-full border text-base leading-6 font-bold text-brand ${
            featured ? 'border-brand bg-brand/20' : 'border-brand/30 bg-surface-2'
          }`}
        >
          {initials(review.author)}
        </span>
        <span className="flex min-w-0 flex-col gap-[7.5px]">
          <cite
            className={`font-display text-xl leading-7 font-medium not-italic ${featured ? 'text-brand' : 'text-text'}`}
          >
            {review.author}
          </cite>
          <span
            className={`text-[9px] leading-3 font-bold tracking-[0.1em] uppercase ${
              featured ? 'text-brand-soft' : 'text-brand'
            }`}
          >
            {service.name} · con {barber.name}
          </span>
        </span>
      </figcaption>
    </figure>
  )
}

function Testimonials() {
  const { canBook } = useBookingAccess()
  const { data, isPending, error } = useQuery({
    queryKey: queryKeys.publicReviews,
    queryFn: reviewsApi.published,
    staleTime: 5 * 60 * 1000,
  })
  const gridRef = useRef(null)
  useBatchReveal(gridRef, [data])

  if (isPending) {
    return (
      <div className="grid w-full gap-6 md:grid-cols-3" aria-busy="true">
        {[0, 1, 2].map((key) => (
          <span key={key} aria-hidden className="block h-64 animate-pulse border border-line/20 bg-card motion-reduce:animate-none" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p role="alert" className="w-full border border-line/30 bg-card p-6 text-sm text-danger">
        No pudimos cargar las reseñas. {error.message}
      </p>
    )
  }

  if (!data.reviews.length) {
    return (
      <div className="flex w-full max-w-[672px] flex-col items-center gap-3 border border-line/30 bg-card p-8 text-center">
        <p className="text-sm text-text-soft">
          Aún no hay reseñas publicadas. Después de tu cita podrás calificar el servicio desde "Mis citas".
        </p>
        {canBook && (
        <Link
          to="/reservar"
          className="pressable border border-brand/50 px-6 py-2.5 text-[9px] leading-3 font-bold tracking-[0.1em] text-brand uppercase hover:border-brand hover:bg-brand/10"
        >
          Reservar mi cita
        </Link>
        )}
      </div>
    )
  }

  const { summary, reviews } = data
  // Como en el diseño, la tarjeta central de cada fila va destacada.
  return (
    <>
      <p className="flex items-center gap-2 text-sm text-text-soft">
        <Stars value={summary.average} className="size-4" />
        <span>
          <strong className="font-semibold text-brand">{averageFormatter.format(summary.average)}</strong> de 5 ·{' '}
          {summary.count} {summary.count === 1 ? 'reseña' : 'reseñas'}
        </span>
      </p>
      <div ref={gridRef} className="grid w-full items-stretch gap-6 md:grid-cols-3">
        {reviews.map((review, index) => (
          <TestimonialCard key={review.id} review={review} featured={reviews.length >= 3 && index % 3 === 1} />
        ))}
      </div>
    </>
  )
}

export default function TestimonialsSection() {
  return (
    <section
      id="resenas"
      aria-labelledby="testimonios-title"
      className="border-t border-line/30 bg-surface pt-20 pb-20 lg:pt-28 lg:pb-28"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-10 px-4 sm:px-8 xl:px-16">
        <Reveal className="w-full max-w-[672px] pt-1.5">
          <SectionHeading
            id="testimonios-title"
            align="center"
            eyebrow="Reseñas de clientes"
            eyebrowTracking="tracking-[0.3em]"
            title={
              <>
                Lo que dicen <Accent>nuestros reyes</Accent>
              </>
            }
            description="Opiniones reales de clientes que ya vivieron la experiencia Midas, calificadas después de cada servicio."
          />
        </Reveal>
        <Testimonials />
      </div>
    </section>
  )
}
