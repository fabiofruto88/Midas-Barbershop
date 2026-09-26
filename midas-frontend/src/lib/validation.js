// Validaciones de formulario alineadas con las del backend (src/utils/validators.js).
export const rules = {
  name: (value) => (value.trim().length >= 2 ? null : 'El nombre debe tener al menos 2 caracteres.'),
  email: (value) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? null : 'El email no es válido.'),
  optionalEmail: (value) => (value.trim() === '' ? null : rules.email(value)),
  // Se permiten espacios, guiones y paréntesis: el backend normaliza el número.
  phone: (value) =>
    /^\+?[0-9]{7,15}$/.test(value.replace(/[\s\-().]/g, ''))
      ? null
      : 'El teléfono debe tener entre 7 y 15 dígitos (ej. +573001234567).',
  optionalPhone: (value) => (value.trim() === '' ? null : rules.phone(value)),
  password: (value) =>
    value.length < 8
      ? 'La contraseña debe tener al menos 8 caracteres.'
      : new TextEncoder().encode(value).length > 72 // bcrypt: máximo 72 bytes
        ? 'La contraseña es demasiado larga (máximo 72 bytes).'
        : null,
  required: (value) => (value ? null : 'Este campo es obligatorio.'),
}

// Precio escrito a la colombiana: "25.000", "25,000", "$ 25.000" o "19,99" → número (NaN si no es válido).
export const parsePrice = (value) => {
  const text = String(value).replace(/[\s$]/g, '')
  if (/^\d{1,3}([.,]\d{3})+$/.test(text)) return Number(text.replace(/[.,]/g, '')) // separador de miles
  if (/^\d+([.,]\d{1,2})?$/.test(text)) return Number(text.replace(',', '.'))
  return Number.NaN
}

export const priceError = (value) => {
  const price = parsePrice(value)
  if (Number.isNaN(price)) return 'Escribe un precio válido (ej. 25000 o 25.000), con máximo 2 decimales.'
  return price > 0 ? null : 'El precio debe ser mayor que 0.'
}

// Devuelve { campo: mensaje } solo para los campos con error.
export const validateForm = (values, schema) =>
  Object.fromEntries(
    Object.entries(schema)
      .map(([field, rule]) => [field, rule(values[field] ?? '')])
      .filter(([, message]) => message)
  )

// Convierte `details` del backend en errores por campo.
export const serverFieldErrors = (error) =>
  Object.fromEntries((error?.details ?? []).map(({ field, message }) => [field, message]))
