import { useId } from 'react'

const STARS = [1, 2, 3, 4, 5]
const LABELS = { 1: 'Malo', 2: 'Regular', 3: 'Bueno', 4: 'Muy bueno', 5: 'Excelente' }

function Star({ filled, className = '' }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={`${filled ? 'fill-brand' : 'fill-line/40'} ${className}`}>
      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
    </svg>
  )
}

// Calificación de solo lectura (ej. "4 de 5 estrellas").
export function Stars({ value, className = 'size-3.5' }) {
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={`${value} de 5 estrellas`}>
      {STARS.map((star) => (
        <Star key={star} filled={star <= Math.round(value)} className={className} />
      ))}
    </span>
  )
}

// Selector de 1 a 5 estrellas: grupo de radios nativos, navegable con flechas.
export default function StarRating({ value, onChange, label = 'Calificación', error }) {
  const name = useId()
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {STARS.map((star) => (
            <label key={star} className="pressable cursor-pointer rounded-control p-0.5 has-focus-visible:outline-2 has-focus-visible:outline-brand">
              <input
                type="radio"
                name={name}
                value={star}
                checked={value === star}
                onChange={() => onChange(star)}
                className="sr-only"
              />
              <Star filled={star <= value} className="size-7 transition-colors" />
              <span className="sr-only">
                {star} {star === 1 ? 'estrella' : 'estrellas'} ({LABELS[star]})
              </span>
            </label>
          ))}
        </div>
        {value > 0 && <span className="text-sm text-muted">{LABELS[value]}</span>}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </fieldset>
  )
}
