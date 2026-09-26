import { Link } from 'react-router'
import { treatments } from '../../content/landing'
import iconCheck from '../../assets/landing/icon-check.svg'
import iconStar from '../../assets/landing/icon-star.svg'
import iconChevron from '../../assets/landing/icon-chevron-right.svg'
import SectionHeading, { Accent } from './SectionHeading'
import Icon from './Icon'
import Reveal from './Reveal'

function TreatmentCard({ treatment, index }) {
  const { featured, tight } = treatment
  return (
    <Reveal
      as="article"
      delay={index * 0.06}
      aria-labelledby={`tratamiento-${index}`}
      className={`relative flex flex-col justify-between ${
        featured
          ? 'border-2 border-brand/70 bg-surface-2 p-6 drop-shadow-[0px_12px_20px_rgba(212,175,55,0.2)]'
          : 'border border-line/30 bg-card p-6 transition-colors duration-200 hover:border-brand/40'
      }`}
    >
      {featured ? (
        <p className="absolute -top-3 left-1/2 -translate-x-1/2 bg-linear-to-r from-brand-strong to-[#d4af37] px-3 py-0.5 text-[9px] leading-[13.5px] font-bold tracking-[0.25em] whitespace-nowrap text-on-brand uppercase">
          Supremo VIP
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
            <Icon src={treatment.icon} className={treatment.iconSize} />
          </span>
          <p className="text-[9px] leading-3 font-bold tracking-[0.1em] text-brand uppercase">
            <span className="sr-only">Duración: </span>
            {treatment.duration}
          </p>
        </div>
        <h3
          id={`tratamiento-${index}`}
          className={`pt-3 font-display text-xl leading-7 font-medium uppercase ${featured ? 'text-brand' : 'text-text'}`}
        >
          {treatment.name}
        </h3>
        <p
          className={`text-xs leading-[19.5px] tracking-[0.02em] ${tight ? '' : 'pb-3'} ${
            featured ? 'text-text-soft' : 'text-muted'
          }`}
        >
          {treatment.description}
        </p>
        <ul
          className={`flex flex-col gap-1 border-t ${tight ? 'pt-5' : 'pt-2'} ${
            featured ? 'border-brand/20' : 'border-line/20'
          }`}
        >
          {treatment.features.map((feature) => (
            <li
              key={feature}
              className={`flex items-center gap-2 text-xs leading-[18px] tracking-[0.02em] ${
                featured ? 'text-text' : 'text-text-soft/80'
              }`}
            >
              {featured ? (
                <Icon src={iconStar} className="h-[11.083px] w-[11.667px]" />
              ) : (
                <Icon src={iconCheck} className="h-[7.015px] w-[9.508px]" />
              )}
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div
        className={`flex items-center justify-between border-t pt-4 ${featured ? 'border-brand/30' : 'border-line/30'}`}
      >
        <p className={`font-display text-xl leading-7 font-bold ${featured ? 'text-brand' : 'text-brand-soft'}`}>
          <span className="sr-only">Precio: </span>
          {treatment.price}
        </p>
        {featured ? (
          <Link
            to="/reservar"
            className="pressable bg-gold px-4 py-2 text-[9px] leading-3 font-bold tracking-[0.1em] text-on-brand uppercase hover:brightness-110"
          >
            Reservar<span className="sr-only"> {treatment.name}</span>
          </Link>
        ) : (
          <Link
            to="/reservar"
            className="group/link hit-area flex items-center gap-1 py-1 text-[9px] leading-3 font-bold tracking-[0.1em] text-brand uppercase"
          >
            Elegir<span className="sr-only"> {treatment.name}</span>
            <Icon
              src={iconChevron}
              className="h-[7px] w-[4.317px] transition-transform duration-200 ease-out group-hover/link:translate-x-0.5 motion-reduce:transition-none"
            />
          </Link>
        )}
      </div>
    </Reveal>
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
            eyebrow="Carta de tratamientos realeza"
            title={
              <>
                Nuestro arte, <Accent>tu legado</Accent>
              </>
            }
            titleClassName="text-[32px] leading-10 tracking-[0.025em] sm:text-[40px] sm:leading-12"
            description="Cada servicio es un protocolo pausado y meticuloso diseñado para restablecer la fisonomía masculina mediante fórmulas enriquecidas, vapor termal y cuchillas damasquinas templadas a mano."
            descriptionClassName="text-sm leading-[22px] font-light tracking-[0.01em] text-text-soft"
            className="max-w-[672px] [&>h2]:pt-0"
          />
          <p className="text-[9px] leading-3 font-bold tracking-[0.2em] text-muted uppercase md:text-right">
            Todos los rituales incluyen cortesía del cellar privado
          </p>
        </Reveal>

        <div className="grid items-start gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {treatments.map((treatment, index) => (
            <TreatmentCard key={treatment.name} treatment={treatment} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
