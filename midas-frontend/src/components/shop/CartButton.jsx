import { cartCount, useCartStore } from '../../store/cartStore'
import { BagIcon } from './icons'

// Acceso al pedido desde la cabecera, con el número de unidades.
export default function CartButton() {
  const count = useCartStore((state) => cartCount(state.items))
  const open = useCartStore((state) => state.open)

  return (
    <button
      type="button"
      onClick={open}
      aria-label={count ? `Ver pedido (${count} ${count === 1 ? 'producto' : 'productos'})` : 'Ver pedido'}
      className="pressable relative grid size-8 shrink-0 place-items-center border border-brand/30 text-brand hover:bg-brand/10"
    >
      <BagIcon />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -top-1.5 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] leading-none font-bold text-on-brand tabular-nums"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
