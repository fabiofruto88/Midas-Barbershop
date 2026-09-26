import { useId, useState } from "react";
import { Link } from "react-router";
import { contact, schedule } from "../../content/landing";
import { rules } from "../../lib/validation";
import emblem from "../../assets/landing/midas-emblem.jpg";
import iconVerified from "../../assets/landing/icon-verified-dim.svg";
import iconDiamond from "../../assets/landing/icon-diamond-social.svg";
import iconShare from "../../assets/landing/icon-share.svg";
import iconMail from "../../assets/landing/icon-mail.svg";
import iconArrow from "../../assets/landing/icon-arrow-right.svg";
import Icon from "./Icon";

const heading =
  "font-display text-xl leading-7 font-medium tracking-[0.05em] text-brand-soft uppercase";
const body = "text-xs leading-[18px] tracking-[0.02em]";
const social =
  "pressable grid size-9 place-items-center border border-line/60 transition-colors hover:border-brand/60 hover:bg-brand/10";

function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // { tone, message }
  const inputId = useId();
  const messageId = useId();

  const submit = (event) => {
    event.preventDefault();
    const error = rules.email(email.trim());
    if (error) return setStatus({ tone: "error", message: error });
    // TODO: conectar con el endpoint de suscripción cuando exista en el backend.
    // Mientras tanto no se confirma una suscripción que no se guarda.
    setStatus({
      tone: "success",
      message: "La suscripción estará disponible muy pronto.",
    });
  };

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-2">
      <div className="relative">
        <label htmlFor={inputId} className="sr-only">
          Correo electrónico
        </label>
        <input
          id={inputId}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Su correo distinguido"
          aria-invalid={status?.tone === "error" || undefined}
          aria-describedby={status ? messageId : undefined}
          className="w-full border-b border-brand/40 bg-surface px-2 pt-[9px] pr-8 pb-2.5 text-xs text-text transition-colors placeholder:text-muted/60 focus:border-brand focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        />
        <button
          type="submit"
          aria-label="Suscribirse a La Gazeta Midas"
          className="pressable absolute right-0 bottom-0 grid h-full w-8 place-items-center"
        >
          <Icon src={iconArrow} className="size-[13.333px]" />
        </button>
      </div>
      {status ? (
        <p
          id={messageId}
          role={status.tone === "error" ? "alert" : "status"}
          className={`text-[9px] leading-3 font-bold tracking-[0.1em] uppercase ${
            status.tone === "error" ? "text-danger" : "text-brand"
          }`}
        >
          {status.message}
        </p>
      ) : (
        <p className="text-[9px] leading-3 font-bold tracking-[0.1em] text-muted/80 uppercase">
          Discreción y confidencialidad absoluta garantizada.
        </p>
      )}
    </form>
  );
}

export default function SiteFooter() {
  const share = async () => {
    const data = { title: "Midas ", url: window.location.origin };
    try {
      if (navigator.share) await navigator.share(data);
      else await navigator.clipboard.writeText(data.url);
    } catch {
      // El usuario canceló el diálogo de compartir.
    }
  };

  return (
    <footer className="border-t border-line/30 bg-bg pt-10 pb-6">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 xl:px-16">
        <div className="grid gap-10 border-b border-line/20 pb-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="flex flex-col gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 self-start"
              aria-label="Midas, inicio"
            >
              <img
                src={emblem}
                alt=""
                className="size-8"
                width="32"
                height="32"
              />
              <span className="font-display text-xl leading-7 font-medium tracking-[0.2em] text-brand uppercase">
                Midas
              </span>
            </Link>
            <p className={`max-w-[384px] text-muted ${body}`}>
              El santuario privado para el caballero exigente. Arte de
              peluquería tradicional, afeitado a navaja damasquina y rituales de
              bienestar bajo los más altos estándares de la realeza moderna.
            </p>
            <div className="flex flex-col gap-1 border border-brand/20 bg-surface p-4">
              <p className="text-[9px] leading-3 font-bold tracking-[0.1em] text-brand uppercase">
                Reserva en línea
              </p>
              <p className={`text-text-soft ${body}`}>
                Elige tu barbero, el servicio y la hora en minutos, sin llamadas
                ni filas.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className={heading}>Horario real</h2>
            <dl className="flex flex-col gap-2">
              {schedule.map((row) => (
                <div
                  key={row.day}
                  className={`flex justify-between gap-4 border-b border-line/20 pb-1 ${body}`}
                >
                  <dt className="text-text-soft">{row.day}</dt>
                  <dd
                    className={`font-medium ${row.highlight ? "text-[#e9c349]" : "text-brand-soft"}`}
                  >
                    {row.hours}
                  </dd>
                </div>
              ))}
            </dl>
            <p className={`flex items-center gap-1 pt-2 text-line ${body}`}>
              <Icon src={iconVerified} className="h-3.5 w-[14.667px]" />
              Atención confidencial personalizada
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className={heading}>Ubicación selecta</h2>
            <address className={`flex flex-col gap-1 not-italic ${body}`}>
              <span className="font-medium text-text">{contact.address}</span>
              <span className="text-muted">{contact.city}</span>
              <a
                href={contact.mapHref}
                target="_blank"
                rel="noreferrer"
                className="self-start pt-1 text-brand transition-colors hover:text-brand-strong"
              >
                Ver en Google Maps
                <span className="sr-only"> (se abre en una pestaña nueva)</span>
              </a>
            </address>
            <p className="flex flex-col gap-1 pt-2">
              <span className="text-[9px] leading-3 font-bold tracking-[0.1em] text-muted uppercase">
                Línea directa concierge
              </span>
              <a
                href={contact.phoneHref}
                className="text-sm leading-[22px] font-medium tracking-[0.01em] text-brand transition-colors hover:text-brand-strong"
              >
                {contact.phone}
              </a>
            </p>
            <div className="flex items-center gap-4 pt-1">
              <a
                href="/#servicios"
                className={social}
                aria-label="Carta de servicios"
              >
                <Icon src={iconDiamond} className="h-[13.5px] w-[15px]" />
              </a>
              <button
                type="button"
                onClick={share}
                className={social}
                aria-label="Compartir Midas"
              >
                <Icon src={iconShare} className="h-[15px] w-[13.5px]" />
              </button>
              <a
                href={`mailto:?subject=${encodeURIComponent("Midas ")}&body=${encodeURIComponent(
                  typeof window === "undefined" ? "" : window.location.origin,
                )}`}
                className={social}
                aria-label="Recomendar Midas por correo"
              >
                <Icon src={iconMail} className="h-3 w-[15px]" />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className={heading}>La Gazeta Midas</h2>
            <p className={`text-muted ${body}`}>
              Suscríbase a las crónicas privadas de estilo, ediciones limitadas
              de elixires capilares e invitaciones a galas de cata.
            </p>
            <Newsletter />
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 text-[9px] leading-3 font-bold text-muted uppercase sm:flex-row sm:items-center sm:justify-between">
          <p className="tracking-[0.1em]">
            © {new Date().getFullYear()} Midas Royal Barber System. Todos los
            derechos reservados.
          </p>
          <ul className="flex flex-wrap gap-6 tracking-[0.05em]">
            <li>
              <Link to="/tienda" className="hit-area transition-colors hover:text-brand">
                Tienda
              </Link>
            </li>
            <li>Privacidad</li>
            <li>Términos</li>
            <li>
              <a
                href="/#ubicacion"
                className="hit-area transition-colors hover:text-brand"
              >
                Ubicación
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
