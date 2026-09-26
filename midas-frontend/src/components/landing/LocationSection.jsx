import { amenities, contact } from '../../content/landing'
import mapImage from '../../assets/landing/map-madrid.png'
import iconPin from '../../assets/landing/icon-diamond-pin.svg'
import SectionHeading, { Accent } from './SectionHeading'
import Icon from './Icon'
import Reveal from './Reveal'

export default function LocationSection() {
  return (
    <section id="experiencia" aria-labelledby="experiencia-title" className="bg-bg-alt py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-4 sm:px-8 lg:grid-cols-12 lg:gap-8 xl:px-16">
        <Reveal className="flex flex-col gap-4 self-center lg:col-span-6">
          <SectionHeading
            id="experiencia-title"
            eyebrow="Santuario urbano"
            title={
              <>
                El club privado &amp;
                <br />
                <Accent>lounge reservado</Accent>
              </>
            }
            className="gap-2 pt-1.5 [&>h2]:pt-0"
          />
          <p className="text-base leading-[26px] font-light tracking-[0.01em] text-text-soft">
            Ubicado en la planta noble del señorial Paseo de la Castellana, el espacio de Midas ha sido concebido bajo la
            arquitectura de un speakeasy de la belle époque, garantizando el aislamiento acústico y la más estricta
            intimidad.
          </p>
          <ul className="grid gap-4 pt-2 sm:grid-cols-2">
            {amenities.map((amenity) => (
              <li key={amenity.title} className="flex flex-col gap-1 border border-line/20 bg-card p-4">
                <Icon src={amenity.icon} className={amenity.iconSize} />
                <h3 className="pt-[3px] font-display text-xl leading-7 font-medium text-text">{amenity.title}</h3>
                <p className="text-xs leading-[18px] tracking-[0.02em] text-muted">{amenity.text}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal
          delay={0.08}
          className="flex flex-col self-center border border-brand/30 bg-surface p-2 drop-shadow-[0px_12px_20px_rgba(0,0,0,0.8)] lg:col-span-6"
        >
          <a
            href={contact.mapHref}
            target="_blank"
            rel="noreferrer"
            className="group relative flex h-[400px] items-center justify-center overflow-clip bg-[#353437]"
            aria-label={`Ver ${contact.address}, Madrid, en Google Maps (se abre en una pestaña nueva)`}
          >
            <img src={mapImage} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
            <span
              aria-hidden
              className="absolute inset-0 bg-bg/70 backdrop-blur-[1px] transition-colors duration-300 group-hover:bg-bg/60"
            />
            <span className="relative flex flex-col items-center">
              <span
                aria-hidden
                className="grid size-14 place-items-center rounded-full bg-[linear-gradient(135deg,#f2ca50_0%,#8a6310_100%)] p-1 drop-shadow-[0px_0px_15px_rgba(212,175,55,0.6)] transition-transform duration-300 ease-(--ease-out) group-hover:-translate-y-0.5"
              >
                <span className="grid size-full place-items-center rounded-full bg-bg">
                  <Icon src={iconPin} className="h-[17.1px] w-[19.25px]" />
                </span>
              </span>
              <span className="mt-2 flex flex-col items-center gap-[4.5px] border border-brand/40 bg-bg/90 px-4 pt-[13.5px] pb-1.5 text-center backdrop-blur-[6px]">
                <span className="text-[9px] leading-3 font-bold tracking-[0.1em] text-brand uppercase">
                  Midas Haute Salon
                </span>
                <span className="text-[11px] leading-[16.5px] text-muted">{contact.address}</span>
              </span>
            </span>
            <span
              aria-hidden
              className="absolute bottom-3 left-3 text-[9px] leading-[13.5px] tracking-[0.1em] text-brand/60"
            >
              LAT 40.4502° N // LON 3.6908° W — SALAMANCA DIST.
            </span>
          </a>
          <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4">
            <p className="flex flex-col pb-[1.5px]">
              <span className="text-[9px] leading-3 font-bold tracking-[0.1em] text-muted uppercase">
                Concierge telefónico privado
              </span>
              <a
                href={contact.phoneHref}
                className="font-display text-xl leading-7 font-semibold text-brand-soft transition-colors hover:text-brand"
              >
                {contact.phone}
              </a>
            </p>
            <a
              href={contact.phoneHref}
              className="pressable border border-brand/50 bg-surface-2 px-6 py-2.5 text-[9px] leading-3 font-bold tracking-[0.1em] text-brand uppercase hover:border-brand hover:bg-brand/10"
            >
              Solicitar recogida valet
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
