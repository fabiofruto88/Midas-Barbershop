import { testimonials } from '../../content/landing'
import SectionHeading, { Accent } from './SectionHeading'
import Icon from './Icon'
import Reveal from './Reveal'

function TestimonialCard({ testimonial, index }) {
  const { featured } = testimonial
  return (
    <Reveal
      as="figure"
      delay={index * 0.06}
      className={`flex flex-col justify-between border bg-card p-6 ${
        featured ? 'border-brand/40 drop-shadow-[0px_8px_15px_rgba(212,175,55,0.1)]' : 'border-line/30'
      }`}
    >
      <span
        aria-hidden
        className={`mb-4 grid size-10 place-items-center rounded-full border ${
          featured ? 'border-brand bg-brand/20' : 'border-brand/40 bg-brand/10'
        }`}
      >
        <Icon src={testimonial.icon} className={testimonial.iconSize} />
      </span>
      <blockquote
        className={`pb-6 text-sm leading-[22.75px] tracking-[0.01em] italic ${featured ? 'text-text' : 'text-text-soft'}`}
      >
        <p>"{testimonial.quote}"</p>
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
          {testimonial.initials}
        </span>
        <span className="flex min-w-0 flex-col gap-[7.5px]">
          <cite
            className={`font-display text-xl leading-7 font-medium not-italic ${featured ? 'text-brand' : 'text-text'}`}
          >
            {testimonial.name}
          </cite>
          <span
            className={`text-[9px] leading-3 font-bold tracking-[0.1em] uppercase ${
              featured ? 'text-brand-soft' : 'text-brand'
            }`}
          >
            {testimonial.role}
          </span>
        </span>
      </figcaption>
    </Reveal>
  )
}

export default function TestimonialsSection() {
  return (
    <section
      aria-labelledby="testimonios-title"
      className="border-t border-line/30 bg-surface pt-20 pb-20 lg:pt-28 lg:pb-28"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-10 px-4 sm:px-8 xl:px-16">
        <Reveal className="w-full max-w-[672px] pt-1.5">
          <SectionHeading
            id="testimonios-title"
            align="center"
            eyebrow="Testimonios exclusivos"
            eyebrowTracking="tracking-[0.3em]"
            title={
              <>
                Lo que dicen <Accent>nuestros reyes</Accent>
              </>
            }
            description="La discreción y la excelencia constante son los pilares por los cuales las personalidades más influyentes depositan su imagen en Midas."
          />
        </Reveal>
        <div className="grid w-full items-start gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={testimonial.name} testimonial={testimonial} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
