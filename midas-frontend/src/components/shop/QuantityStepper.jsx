import { MAX_QUANTITY } from '../../store/cartStore'
import { MinusIcon, PlusIcon } from './icons'

const step =
  'pressable grid size-9 shrink-0 place-items-center text-brand hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-40'

// Control − n + para una línea del carrito. Bajar de 1 la quita.
export default function QuantityStepper({ name, quantity, onChange, className = '' }) {
  return (
    <div className={`flex items-center justify-between border border-brand/40 ${className}`}>
      <button type="button" className={step} onClick={() => onChange(quantity - 1)} aria-label={`Quitar una unidad de ${name}`}>
        <MinusIcon />
      </button>
      <span className="min-w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        <span className="sr-only">Cantidad de {name}: </span>
        {quantity}
      </span>
      <button
        type="button"
        className={step}
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= MAX_QUANTITY}
        aria-label={`Añadir una unidad de ${name}`}
      >
        <PlusIcon />
      </button>
    </div>
  )
}
