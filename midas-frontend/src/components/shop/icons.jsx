// Iconos de línea de la tienda (heredan el color del texto). Decorativos: el botón lleva su etiqueta.
const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, 'aria-hidden': true }

export function BagIcon({ className = 'size-4' }) {
  return (
    <svg {...base} className={className}>
      <path strokeLinejoin="round" d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 8z" />
      <path strokeLinecap="round" d="M9 10V7a3 3 0 0 1 6 0v3" />
    </svg>
  )
}

export function PlusIcon({ className = 'size-3.5' }) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function MinusIcon({ className = 'size-3.5' }) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <path strokeLinecap="round" d="M5 12h14" />
    </svg>
  )
}

export function CloseIcon({ className = 'size-4' }) {
  return (
    <svg {...base} strokeWidth={1.8} className={className}>
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function SearchIcon({ className = 'size-4' }) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path strokeLinecap="round" d="M16 16l4.5 4.5" />
    </svg>
  )
}

export function WhatsAppIcon({ className = 'size-4' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" className={className}>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3 1 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.4-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.4-.3z" />
    </svg>
  )
}
