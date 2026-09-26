import { contact } from '../content/landing'
import { formatPrice } from './format'

export const MAX_CUSTOMER_NAME = 60
export const MAX_ORDER_NOTE = 200

// Texto del pedido que el cliente envía al asesor. Solo incluye las líneas disponibles.
export function buildOrderMessage({ lines, total, name = '', note = '' }) {
  const parts = [
    'Hola Midas 👑, quiero hacer este pedido desde la tienda:',
    '',
    ...lines.map((line) => `• ${line.quantity} × ${line.name} — ${formatPrice(line.price * line.quantity)}`),
    '',
    `Total: ${formatPrice(total)}`,
  ]
  if (name.trim()) parts.push(`Nombre: ${name.trim().slice(0, MAX_CUSTOMER_NAME)}`)
  if (note.trim()) parts.push(`Nota: ${note.trim().slice(0, MAX_ORDER_NOTE)}`)
  parts.push('', 'Precios sujetos a confirmación del asesor.')
  return parts.join('\n')
}

export const whatsappOrderUrl = (message) => `${contact.whatsappHref}?text=${encodeURIComponent(message)}`
