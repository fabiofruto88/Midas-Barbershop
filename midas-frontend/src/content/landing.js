// Contenido editorial de la pantalla principal (fuente: Figma "diseño-midas").
// Lo operativo (servicios, barberos, horarios y galería de resultados) viene del API.
import iconStar from '../assets/landing/icon-star.svg'
import iconBox from '../assets/landing/icon-box.svg'
import iconShieldBadge from '../assets/landing/icon-shield-badge.svg'
import iconVerified from '../assets/landing/icon-verified.svg'
import iconShieldCheck from '../assets/landing/icon-shield-check.svg'
import iconAwardSmall from '../assets/landing/icon-award-small.svg'
import iconShield from '../assets/landing/icon-shield.svg'

export const navLinks = [
  { id: 'servicios', label: 'Servicios' },
  { id: 'barberos', label: 'Barberos de élite' },
  { id: 'reservas', label: 'Reservas' },
  { id: 'galeria', label: 'Galería de oro' },
  { id: 'ubicacion', label: 'Ubicación' },
]

export const heroBadges = [
  {
    label: '4.98 de excelencia real',
    icon: iconStar,
    iconSize: 'h-[11.083px] w-[11.667px]',
    className: 'border-brand/30 bg-surface-2/80 text-brand shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]',
  },
  {
    label: 'Navajas bañadas en oro 24K',
    icon: iconBox,
    iconSize: 'h-[11.667px] w-[10.5px]',
    className: 'border-line/40 bg-surface-2/60 text-brand-soft',
  },
  {
    label: 'Club privado de caballeros',
    icon: iconShieldBadge,
    iconSize: 'h-[11.667px] w-[9.333px]',
    className: 'border-[rgba(114,46,67,0.4)] bg-[rgba(244,153,176,0.1)] text-rose',
  },
]

export const heroSpecs = [
  { label: 'Atención 1 a 1 sin esperas', icon: iconVerified, iconSize: 'h-[15.75px] w-[16.5px]' },
  { label: 'Reserva online en minutos', icon: iconVerified, iconSize: 'h-[15.75px] w-[16.5px]' },
]

export const highlights = [
  { value: '1,400+', label: 'Caballeros satisfechos' },
  { value: '24K', label: 'Baño puro en instrumental' },
  { value: '100%', label: 'Privacidad confidencial' },
  { value: '35 años', label: 'Legado de barbería clásica' },
]

// Perfil editorial de los barberos por posición; el nombre y la reserva salen del API.
export const barberProfiles = [
  {
    specialty: 'Master Barber & Founder',
    bio: 'Especialista en geometría facial y afeitado a navaja damasquina.',
  },
  {
    specialty: 'Perfilado clásico & bigote',
    bio: 'Maestro en el arte de la navaja tradicional y navaja española.',
  },
  {
    specialty: 'Estilo contemporáneo & fade',
    bio: 'Texturas modernas, degradados milimétricos y visagismo.',
  },
]

export const testimonials = [
  {
    quote:
      'En Barranquilla no existe ningún lugar que combine esta meticulosidad con tal nivel de discreción. Entrar a Midas es desconectarse del ruido corporativo y salir transformado para cualquier cumbre directiva.',
    name: 'Rodrigo de la Lama',
    initials: 'RL',
    role: 'Socio director Private Equity • Miembro Oro',
    icon: iconShieldCheck,
    iconSize: 'h-[16.667px] w-[13.333px]',
  },
  {
    quote:
      'El afeitado con navaja y las toallas calientes no son un simple corte, es una ceremonia. Alexander tiene un pulso de cirujano y un ojo estético inigualable.',
    name: 'Fernando Morales-Arce',
    initials: 'FM',
    role: 'Arquitecto & coleccionista • Miembro Sovereign',
    icon: iconAwardSmall,
    iconSize: 'h-[17.5px] w-[13.333px]',
    featured: true,
  },
  {
    quote:
      'La puntualidad británica y la atmósfera de club de caballeros clásico son formidables. Es el único sitio donde no miro el reloj. Un ritual indispensable antes de mis viajes internacionales.',
    name: 'Guillermo Benítez',
    initials: 'GB',
    role: 'Consejero delegado • Miembro fundador',
    icon: iconShield,
    iconSize: 'h-[16.667px] w-[13.333px]',
  },
]

const location = { lat: 10.924561826264892, lng: -74.7663884310752 }
const coords = `${location.lat},${location.lng}`

export const contact = {
  phone: '+57 300 6945339',
  phoneHref: 'tel:+573006945339',
  whatsappHref: 'https://wa.me/573006945339',
  address: 'Barranquilla, Atlántico',
  city: 'Colombia',
  location,
  mapEmbedSrc: `https://maps.google.com/maps?q=${coords}&z=17&output=embed`,
  mapHref: `https://www.google.com/maps/search/?api=1&query=${coords}`,
  directionsHref: `https://www.google.com/maps/dir/?api=1&destination=${coords}`,
}

export const schedule = [
  { day: 'Lunes a Viernes', hours: '09:00 — 21:00' },
  { day: 'Sábados Selectos', hours: '10:00 — 20:00' },
  { day: 'Domingos Privados', hours: 'Solo Cita VIP', highlight: true },
]
