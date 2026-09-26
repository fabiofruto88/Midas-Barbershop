// Contenido editorial de la pantalla principal (fuente: Figma "diseño-midas").
// Lo operativo (servicios, barberos, horarios, galería y reseñas) viene del API.
import iconStar from "../assets/landing/icon-star.svg";
import iconBox from "../assets/landing/icon-box.svg";
import iconShieldBadge from "../assets/landing/icon-shield-badge.svg";
import iconVerified from "../assets/landing/icon-verified.svg";

export const navLinks = [
  { id: "servicios", label: "Servicios" },
  // booking: secciones de reserva, ocultas para el personal (admin/barbero).
  { id: "barberos", label: "Barberos de élite", booking: true },
  { id: "reservas", label: "Reservas", booking: true },
  { id: "galeria", label: "Galería de oro" },
  { id: "ubicacion", label: "Ubicación" },
];

export const heroBadges = [
  {
    label: "4.98 de excelencia real",
    icon: iconStar,
    iconSize: "h-[11.083px] w-[11.667px]",
    className:
      "border-brand/30 bg-surface-2/80 text-brand shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]",
  },
  {
    label: "8 años de experiencia",
    icon: iconBox,
    iconSize: "h-[11.667px] w-[10.5px]",
    className: "border-line/40 bg-surface-2/60 text-brand-soft",
  },
  {
    label: "Club privado de caballeros",
    icon: iconShieldBadge,
    iconSize: "h-[11.667px] w-[9.333px]",
    className:
      "border-[rgba(114,46,67,0.4)] bg-[rgba(244,153,176,0.1)] text-rose",
  },
];

export const heroSpecs = [
  {
    label: "Atención 1 a 1 sin esperas",
    icon: iconVerified,
    iconSize: "h-[15.75px] w-[16.5px]",
  },
  {
    label: "Reserva online en minutos",
    icon: iconVerified,
    iconSize: "h-[15.75px] w-[16.5px]",
  },
];

export const highlights = [
  { value: "1,400+", label: "Caballeros satisfechos" },
  { value: "8 años", label: "De experiencia en barbería" },
  { value: "100%", label: "Privacidad confidencial" },
  { value: "1 a 1", label: "Atención personalizada" },
];

// Perfil editorial de los barberos por posición; el nombre y la reserva salen del API.
export const barberProfiles = [
  {
    specialty: "Master Barber & Founder",
    bio: "Especialista en geometría facial y afeitado a navaja damasquina.",
  },
  {
    specialty: "Perfilado clásico & bigote",
    bio: "Maestro en el arte de la navaja tradicional y navaja española.",
  },
  {
    specialty: "Estilo contemporáneo & fade",
    bio: "Texturas modernas, degradados milimétricos y visagismo.",
  },
];

const location = { lat: 10.924561826264892, lng: -74.7663884310752 };
const coords = `${location.lat},${location.lng}`;

// Único lugar del número de WhatsApp: lo usan el contacto y los pedidos de la tienda.
const whatsappNumber = "573006945339";

export const contact = {
  phone: "+57 300 6945339",
  phoneHref: "tel:+573006945339",
  whatsappNumber,
  whatsappHref: `https://wa.me/${whatsappNumber}`,
  address: "Soledad, Atlántico",
  city: "Colombia",
  location,
  mapEmbedSrc: `https://maps.google.com/maps?q=${coords}&z=17&output=embed`,
  mapHref: `https://www.google.com/maps/search/?api=1&query=${coords}`,
  directionsHref: `https://www.google.com/maps/dir/?api=1&destination=${coords}`,
};

export const schedule = [
  { day: "Lunes a Viernes", hours: "09:00 — 21:00" },
  { day: "Sábados Selectos", hours: "10:00 — 20:00" },
  { day: "Domingos Privados", hours: "Solo Cita VIP", highlight: true },
];
