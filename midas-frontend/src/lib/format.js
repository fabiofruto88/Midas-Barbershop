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

// Próximos N días a partir de hoy.
export const nextDays = (count) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    return date
  })
}

// Horas que faltan para una cita (según el reloj del navegador).
export const hoursUntil = (date, slot) => {
  const [hours] = slot.split(':').map(Number)
  const start = parseDate(date)
  start.setHours(hours)
  return (start.getTime() - Date.now()) / (60 * 60 * 1000)
}
