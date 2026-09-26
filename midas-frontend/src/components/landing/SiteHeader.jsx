import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { useAuth, useBookingAccess, useLogout } from "../../hooks/useAuth";
import { navLinks } from "../../content/landing";
import emblem from "../../assets/landing/midas-emblem.jpg";
import iconUser from "../../assets/landing/icon-user.svg";
import Button from "../ui/Button";
import Icon from "./Icon";

const ease = [0.23, 1, 0.32, 1];

const roleLinks = {
  CLIENT: [{ to: "/mis-citas", label: "Mis citas" }],
  BARBER: [
    { to: "/agenda", label: "Agenda" },
    { to: "/agenda/historial", label: "Historial" },
    { to: "/agenda/horario", label: "Mi horario" },
    { to: "/agenda/finanzas", label: "Finanzas" },
  ],
  ADMIN: [
    { to: "/agenda", label: "Agenda" },
    { to: "/agenda/finanzas", label: "Finanzas" },
    { to: "/admin", label: "Administración" },
  ],
};

// Sección visible en la landing, para marcar el enlace activo del menú.
function useActiveSection(enabled) {
  const [active, setActive] = useState(null);
  useEffect(() => {
    if (!enabled) return;
    const sections = navLinks
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [enabled]);
  // Arriba del todo (hero) el diseño marca "Servicios" como activo.
  return enabled ? (active ?? navLinks[0].id) : null;
}

// Estado abierto/cerrado que se cierra solo al navegar (queda ligado a la ubicación actual).
function usePanel() {
  const { key } = useLocation();
  const [openAt, setOpenAt] = useState(null);
  const open = openAt === key;
  const setOpen = (value) =>
    setOpenAt((current) =>
      (typeof value === "function" ? value(current === key) : value)
        ? key
        : null,
    );
  return [open, setOpen];
}

// Cierra un panel al hacer clic fuera o pulsar Escape.
function useDismiss(open, setOpen, ref) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (event) =>
      ref.current && !ref.current.contains(event.target) && setOpen(false);
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen, ref]);
}

function Brand() {
  return (
    <Link
      to="/"
      className="flex shrink-0 items-center gap-4"
      aria-label="Midas , inicio"
    >
      <img src={emblem} alt="" className="size-8" width="32" height="32" />
      <span className="flex flex-col">
        <span className="font-display text-xl leading-7 font-medium tracking-[0.25em] text-brand uppercase">
          Midas
        </span>
        <span className="text-[9px] leading-3 font-bold tracking-[0.3em] text-muted uppercase"></span>
      </span>
    </Link>
  );
}

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = usePanel();
  const ref = useRef(null);
  const menuId = useId();
  useDismiss(open, setOpen, ref);

  const trigger =
    "pressable grid size-8 shrink-0 place-items-center rounded-full bg-brand hover:bg-brand-strong";

  if (!user) {
    return (
      <Link to="/login" className={trigger} aria-label="Ingresar a tu cuenta">
        <Icon src={iconUser} className="size-3" />
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={trigger}
        aria-label={`Cuenta de ${user.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon src={iconUser} className="size-3" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            role="menu"
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
            transition={{ duration: 0.18, ease }}
            className="absolute top-full right-0 mt-3 w-56 origin-top-right border border-brand/20 bg-surface py-2 shadow-[0px_12px_36px_0px_rgba(0,0,0,0.8)]"
          >
            <p className="truncate border-b border-line/30 px-4 pb-2 text-[9px] leading-3 font-bold tracking-[0.1em] text-muted uppercase">
              {user.name}
            </p>
            {(roleLinks[user.role] ?? []).map((link) => (
              <Link
                key={link.to}
                to={link.to}
                role="menuitem"
                className="block px-4 py-2.5 text-[11px] leading-[14px] font-semibold tracking-[0.18em] text-text-soft uppercase transition-colors hover:bg-brand/10 hover:text-brand"
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              className="block w-full px-4 py-2.5 text-left text-[11px] leading-[14px] font-semibold tracking-[0.18em] text-muted uppercase transition-colors hover:bg-brand/10 hover:text-brand"
            >
              Salir
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SiteHeader() {
  const { user } = useAuth();
  const { canBook, staffHome } = useBookingAccess();
  const links = navLinks.filter((link) => canBook || !link.booking);
  const cta = canBook ? { to: "/reservar", label: "Reservar cita" } : staffHome;
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const active = useActiveSection(isHome);
  const [menuOpen, setMenuOpen] = usePanel();
  const panelRef = useRef(null);
  useDismiss(menuOpen, setMenuOpen, panelRef);

  const handleLogout = () =>
    logout.mutate(undefined, {
      onSuccess: () =>
        toast("Sesión cerrada", {
          description: "Te esperamos pronto en Midas.",
        }),
      onSettled: () => navigate("/"),
    });
  const href = (id) => (isHome ? `#${id}` : `/#${id}`);

  return (
    <header
      ref={panelRef}
      className="fixed inset-x-0 top-0 z-50 border-b border-brand/20 bg-bg/85 shadow-[0px_12px_36px_0px_rgba(0,0,0,0.8),0px_0px_1px_0px_rgba(212,175,55,0.2)] backdrop-blur-[12px]"
    >
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8 xl:px-16">
        <Brand />

        <nav
          aria-label="Principal"
          className="hidden items-center gap-6 xl:flex"
        >
          {links.map((link) => {
            const current = active === link.id;
            return (
              <a
                key={link.id}
                href={href(link.id)}
                aria-current={current ? "location" : undefined}
                className={
                  current
                    ? "border-b border-brand pt-1 pb-[5px] text-base leading-6 font-bold text-brand uppercase"
                    : "hit-area py-1 text-[11px] leading-[14px] font-semibold tracking-[0.18em] text-text-soft uppercase transition-colors duration-150 hover:text-brand"
                }
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <Button
            to={cta.to}
            variant="goldDeep"
            size="sm"
            className="drop-shadow-[0px_4px_10px_rgba(212,175,55,0.25)] max-sm:hidden"
          >
            {cta.label}
          </Button>
          <UserMenu user={user} onLogout={handleLogout} />
          <button
            type="button"
            className="pressable grid size-8 place-items-center border border-brand/30 text-brand xl:hidden"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="menu-movil"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span aria-hidden className="relative block h-2.5 w-3.5">
              <span
                className={`absolute left-0 h-px w-full bg-current transition-transform duration-200 ${menuOpen ? "top-1/2 rotate-45" : "top-0"}`}
              />
              <span
                className={`absolute top-1/2 left-0 h-px w-full bg-current transition-opacity duration-150 ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`absolute left-0 h-px w-full bg-current transition-transform duration-200 ${menuOpen ? "top-1/2 -rotate-45" : "bottom-0"}`}
              />
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            id="menu-movil"
            aria-label="Principal"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            transition={{ duration: 0.22, ease }}
            className="border-t border-brand/20 bg-bg px-4 pt-2 pb-6 sm:px-8 xl:hidden"
          >
            <ul>
              {links.map((link) => (
                <li key={link.id} className="border-b border-line/30">
                  <a
                    href={href(link.id)}
                    onClick={() => setMenuOpen(false)}
                    className={`block py-4 text-[11px] leading-[14px] font-semibold tracking-[0.18em] uppercase ${
                      active === link.id ? "text-brand" : "text-text-soft"
                    }`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <Button
              to={cta.to}
              variant="gold"
              size="sm"
              className="mt-6 w-full sm:hidden"
            >
              {cta.label}
            </Button>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
