// Contenido editorial de la pantalla principal (fuente: Figma "diseño-midas").
// Lo operativo (servicios reservables, barberos, horarios) viene del API.
import iconStar from '../assets/landing/icon-star.svg'
import iconBox from '../assets/landing/icon-box.svg'
import iconShieldBadge from '../assets/landing/icon-shield-badge.svg'
import iconVerified from '../assets/landing/icon-verified.svg'
import iconGoblet from '../assets/landing/icon-goblet.svg'
import iconCrown from '../assets/landing/icon-crown.svg'
import iconScissors from '../assets/landing/icon-scissors.svg'
import iconSpa from '../assets/landing/icon-spa.svg'
import iconMedal from '../assets/landing/icon-medal.svg'
import iconShieldCheck from '../assets/landing/icon-shield-check.svg'
import iconAwardSmall from '../assets/landing/icon-award-small.svg'
import iconShield from '../assets/landing/icon-shield.svg'
import iconCocktail from '../assets/landing/icon-cocktail.svg'
import iconCar from '../assets/landing/icon-car.svg'
import iconLock from '../assets/landing/icon-lock.svg'
import iconShirt from '../assets/landing/icon-shirt.svg'
import gallery1 from '../assets/landing/gallery-1.jpg'
import gallery2 from '../assets/landing/gallery-2.jpg'
import gallery3 from '../assets/landing/gallery-3.jpg'
import gallery4 from '../assets/landing/gallery-4.jpg'

export const navLinks = [
  { id: 'servicios', label: 'Servicios' },
  { id: 'barberos', label: 'Barberos de élite' },
  { id: 'reservas', label: 'Reservas' },
  { id: 'galeria', label: 'Galería de oro' },
  { id: 'experiencia', label: 'Experiencia real' },
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
  { label: 'Barra Secreta de Cognac de Autor', icon: iconGoblet, iconSize: 'h-[13.5px] w-[9px]' },
]

export const highlights = [
  { value: '1,400+', label: 'Caballeros satisfechos' },
  { value: '24K', label: 'Baño puro en instrumental' },
  { value: '100%', label: 'Privacidad confidencial' },
  { value: '35 años', label: 'Legado de barbería clásica' },
]

export const treatments = [
  {
    name: 'Corte Midas Royal',
    duration: '50 min',
    price: '$75',
    icon: iconCrown,
    iconSize: 'h-[19.5px] w-[21.667px]',
    description:
      'Diagnóstico capilar personalizado, lavado exfoliante con infusión de oro coloidal, corte de precisión quirúrgica a tijera japonesa y peinado con pomada de autor.',
    features: ['Análisis de estructura craneal', 'Exfoliante capilar con oro 24k', 'Tónico botánico de cierre de poros'],
  },
  {
    name: 'Barba Esquilada en Oro',
    duration: '40 min',
    price: '$60',
    icon: iconScissors,
    iconSize: 'size-[21.667px]',
    description:
      'Toallas calientes vaporizadas con elixires botánicos, perfilado con navaja clásica afilada a mano sobre piedra belga y nutrición profunda con bálsamo dorado.',
    features: ['Baño termal ozonizado', 'Navaja bañada en oro de un solo uso', 'Bálsamo de cedro & ámbar gris'],
  },
  {
    name: 'Facial del Rey',
    duration: '60 min',
    price: '$90',
    icon: iconSpa,
    iconSize: 'size-[21.667px]',
    tight: true,
    description:
      'Masaje craneofacial revitalizante, exfoliación microdérmica con carbón activo japonés y mascarilla desintoxicante de velo de oro mineral reafirmante.',
    features: ['Drenaje linfático y puntos de presión', 'Mascarilla bio-celular con pan de oro', 'Rodillo de jade negro criotérmico'],
  },
  {
    name: 'Ritual Completo Imperial',
    duration: '120 min',
    price: '$180',
    icon: iconMedal,
    iconSize: 'h-[21.667px] w-[10.833px]',
    tight: true,
    featured: true,
    description:
      'La experiencia magna. Corte Midas Royal, perfilado de barba al oro, protocolo facial completo y maridaje con copa de coñac XO reserva en salón privado.',
    features: [
      'Protocolo capilar, barba y facial total',
      'Salón confidencial reservado en exclusiva',
      'Copa Rémy Martin Louis XIII de bienvenida',
    ],
  },
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

export const galleryFilters = ['Todos', 'Corte clásico', 'Degradado precisión', 'Barba real', 'Estilo ejecutivo']

export const galleryItems = [
  {
    category: 'Corte clásico',
    eyebrow: 'Corte clásico Salamanca',
    title: 'Side-Part con Navaja 24K',
    meta: 'Barbero: A. Vance',
    detail: 'Fijación Mate Pomada',
    image: gallery1,
    alt: 'Caballero de barba canosa y traje oscuro con corte side-part en el salón Midas',
  },
  {
    category: 'Barba real',
    eyebrow: 'Barba real Sovereign',
    title: 'Escultura de Barba Larga',
    meta: 'Barbero: D. Reyes',
    detail: 'Bálsamo Esencial Ámbar',
    image: gallery2,
    alt: 'Perfil de un hombre con barba larga esculpida y definida',
  },
  {
    category: 'Degradado precisión',
    eyebrow: 'Degradado precisión',
    title: 'Mid-Fade Imperial',
    meta: 'Barbero: J. Thorne',
    detail: 'Micro-texturizado Tijera',
    image: gallery3,
    alt: 'Hombre sonriente con degradado medio en el bar del club',
  },
  {
    category: 'Estilo ejecutivo',
    eyebrow: 'Ritual post-servicio',
    title: 'Doble Velo Facial & Olor',
    meta: 'Ritual: Rey Midas',
    detail: 'Oro 24K Transdérmico',
    image: gallery4,
    alt: 'Cliente reclinado con mascarilla facial dorada durante el ritual',
  },
]

export const testimonials = [
  {
    quote:
      'En Madrid no existe ningún lugar que combine esta meticulosidad con tal nivel de discreción. Entrar a Midas es desconectarse del ruido corporativo y salir transformado para cualquier cumbre directiva.',
    name: 'Rodrigo de la Lama',
    initials: 'RL',
    role: 'Socio director Private Equity • Miembro Oro',
    icon: iconShieldCheck,
    iconSize: 'h-[16.667px] w-[13.333px]',
  },
  {
    quote:
      'El afeitado con navaja templada bañada en oro y la copa de coñac en el salón privado no es un simple corte, es una ceremonia. Alexander tiene un pulso de cirujano y un ojo estético inigualable.',
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

export const amenities = [
  {
    title: 'Cellar & Humidor',
    text: 'Selección de whiskies de malta de edición limitada, cognacs y vitola de habanos para miembros.',
    icon: iconCocktail,
    iconSize: 'size-[18px]',
  },
  {
    title: 'Valet Parking & Chofer',
    text: 'Aparcacoches privado con acceso subterráneo discreto directo al elevador noble.',
    icon: iconCar,
    iconSize: 'size-5',
  },
  {
    title: 'Garantía NDA',
    text: 'Todo nuestro personal opera bajo cláusulas estrictas de confidencialidad para personalidades públicas.',
    icon: iconLock,
    iconSize: 'h-[21px] w-4',
  },
  {
    title: 'Código de Etiqueta',
    text: 'Smart Casual o Traje Formal. Preservamos un ecosistema de sofisticación inalterable.',
    icon: iconShirt,
    iconSize: 'h-[18px] w-[20.967px]',
  },
]

export const contact = {
  phone: '+34 910 88 42 00',
  phoneHref: 'tel:+34910884200',
  address: 'Paseo de la Castellana 140, Piso Noble',
  city: '28046 Salamanca District, Madrid',
  mapHref: 'https://www.google.com/maps/search/?api=1&query=Paseo+de+la+Castellana+140+Madrid',
}

export const schedule = [
  { day: 'Lunes a Viernes', hours: '09:00 — 21:00' },
  { day: 'Sábados Selectos', hours: '10:00 — 20:00' },
  { day: 'Domingos Privados', hours: 'Solo Cita VIP', highlight: true },
]
