// Formateo de datos para la interfaz (es-CO).
const priceFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export const formatPrice = (value) => priceFormatter.format(Number(value))

// "2026-10-05" → Date a medianoche local (sin desfase de zona horaria).
export const parseDate = (value) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const toDateString = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const capitalizeFirst = (text) => text.charAt(0).toUpperCase() + text.slice(1)

// "2026-09-26" → "Sábado, 26 de septiembre"
export const formatLongDate = (value) =>
  capitalizeFirst(
    new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(parseDate(value))
  )

export const formatShortDate = (date) => ({
  weekday: new Intl.DateTimeFormat('es-CO', { weekday: 'short' }).format(date).replace('.', ''),
  day: date.getDate(),
  month: new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(date).replace('.', ''),
})

// "14:00" → "2:00 p. m."
export const formatTime = (slot) => {
  const [hours, minutes] = slot.split(':').map(Number)
  return new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' }).format(
    new Date(2000, 0, 1, hours, minutes)
  )
}

// La agenda vive en la hora de la barbería, no en la del navegador (igual que el backend):
// un cliente con el móvil en otra zona horaria debe ver el mismo "hoy" y las mismas horas.
const BUSINESS_TIMEZONE = import.meta.env.VITE_BUSINESS_TIMEZONE ?? 'America/Bogota'
const HOUR_MS = 60 * 60 * 1000

const businessClock = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

// Hora actual de la barbería como "reloj de pared" en milisegundos UTC.
const businessNowMs = () => {
  const parts = Object.fromEntries(businessClock.formatToParts(new Date()).map(({ type, value }) => [type, Number(value)]))
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
}

// "YYYY-MM-DD" de hoy en la barbería.
export const businessToday = () => new Date(businessNowMs()).toISOString().slice(0, 10)

// Próximos N días a partir de hoy (en la barbería).
export const nextDays = (count) => {
  const today = parseDate(businessToday())
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    return date
  })
}

// Horas que faltan para una cita (según la hora de la barbería).
export const hoursUntil = (date, slot) => {
  const [year, month, day] = date.split('-').map(Number)
  const [hours] = slot.split(':').map(Number)
  return (Date.UTC(year, month - 1, day, hours) - businessNowMs()) / HOUR_MS
}
