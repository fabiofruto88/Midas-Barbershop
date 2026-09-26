import { contact, schedule } from "../../content/landing";
import SectionHeading, { Accent } from "./SectionHeading";
import Reveal from "./Reveal";

const infoLabel =
  "text-[9px] leading-3 font-bold tracking-[0.1em] text-muted uppercase";

export default function LocationSection() {
  const { lat, lng } = contact.location;

  return (
    <section
      id="ubicacion"
      aria-labelledby="ubicacion-title"
      className="bg-bg-alt py-20 lg:py-28"
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-4 sm:px-8 lg:grid-cols-12 lg:gap-8 xl:px-16">
        <Reveal className="flex flex-col gap-6 self-center lg:col-span-5">
          <SectionHeading
            id="ubicacion-title"
            eyebrow="Ubicación"
            title={
              <>
                Visítanos en
                <br />
                <Accent>Soledad</Accent>
              </>
            }
            className="gap-2 pt-1.5 [&>h2]:pt-0"
          />

          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="flex flex-col gap-1 border border-line/20 bg-card p-4">
              <dt className={infoLabel}>Dirección</dt>
              <dd className="flex flex-col text-sm leading-[22px] text-text">
                {contact.address}
                <span className="text-muted">{contact.city}</span>
              </dd>
            </div>
            <div className="flex flex-col gap-1 border border-line/20 bg-card p-4">
              <dt className={infoLabel}>Teléfono y WhatsApp</dt>
              <dd className="flex flex-col text-sm leading-[22px]">
                <a
                  href={contact.phoneHref}
                  className="text-brand-soft transition-colors hover:text-brand"
                >
                  {contact.phone}
                </a>
                <a
                  href={contact.whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted transition-colors hover:text-brand"
                >
                  Escribir por WhatsApp
                  <span className="sr-only">
                    {" "}
                    (se abre en una pestaña nueva)
                  </span>
                </a>
              </dd>
            </div>
            <div className="flex flex-col gap-2 border border-line/20 bg-card p-4 sm:col-span-2 lg:col-span-1 xl:col-span-2">
              <dt className={infoLabel}>Horario</dt>
              {schedule.map((row) => (
                <dd
                  key={row.day}
                  className="flex justify-between gap-4 text-sm leading-[22px]"
                >
                  <span className="text-text-soft">{row.day}</span>
                  <span
                    className={
                      row.highlight ? "text-[#e9c349]" : "text-brand-soft"
                    }
                  >
                    {row.hours}
                  </span>
                </dd>
              ))}
            </div>
          </dl>
        </Reveal>

        <Reveal
          delay={0.08}
          className="flex flex-col self-center border border-brand/30 bg-surface p-2 drop-shadow-[0px_12px_20px_rgba(0,0,0,0.8)] lg:col-span-7"
        >
          <div className="relative h-[400px] overflow-clip bg-[#353437]">
            <iframe
              title={`Mapa de Midas en ${contact.address}`}
              src={contact.mapEmbedSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 size-full border-0 [filter:grayscale(1)_invert(0.9)_contrast(0.9)]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-3 left-3 bg-bg/80 px-2 py-1 text-[9px] leading-[13.5px] tracking-[0.1em] text-brand/80"
            >
              LAT {lat.toFixed(4)}° N // LON {Math.abs(lng).toFixed(4)}° W —
              Soledad
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4">
            <p className="flex flex-col pb-[1.5px]">
              <span className={infoLabel}>Reservas por teléfono</span>
              <a
                href={contact.phoneHref}
                className="font-display text-xl leading-7 font-semibold text-brand-soft transition-colors hover:text-brand"
              >
                {contact.phone}
              </a>
            </p>
            <a
              href={contact.directionsHref}
              target="_blank"
              rel="noreferrer"
              className="pressable border border-brand/50 bg-surface-2 px-6 py-2.5 text-[9px] leading-3 font-bold tracking-[0.1em] text-brand uppercase hover:border-brand hover:bg-brand/10"
            >
              Cómo llegar
              <span className="sr-only">
                {" "}
                (Google Maps, se abre en una pestaña nueva)
              </span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
