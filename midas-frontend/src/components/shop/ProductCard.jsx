import { toast } from 'sonner'
import { formatPrice } from '../../lib/format'
import { MAX_LINES, useCartStore } from '../../store/cartStore'
import Button from '../ui/Button'
import ProductImage from './ProductImage'
import QuantityStepper from './QuantityStepper'

const badge = 'px-2 py-1 text-[9px] leading-3 font-bold tracking-[0.15em] uppercase'

export default function ProductCard({ product }) {
  const line = useCartStore((state) => state.items.find((item) => item.productId === product.id))
  const lines = useCartStore((state) => state.items.length)
  const add = useCartStore((state) => state.add)
  const setQuantity = useCartStore((state) => state.setQuantity)
  const soldOut = !product.isAvailable

  const handleAdd = () => {
    if (lines >= MAX_LINES) {
      toast.warning('Tu pedido ya es muy largo', {
        description: `Máximo ${MAX_LINES} productos distintos por pedido. Envía este y arma otro.`,
      })
      return
    }
    // El botón se convierte en el selector de cantidad y la barra del pedido aparece: no hace falta toast.
    add(product)
  }

  return (
    <article className="group flex w-full min-w-0 flex-col border border-border bg-surface transition-colors duration-200 hover:border-brand/40">
      <div className="relative aspect-square overflow-hidden">
        <ProductImage
          product={product}
          className={`size-full transition-transform duration-500 ease-out group-hover:scale-[1.03] ${soldOut ? 'opacity-40 grayscale' : ''}`}
        />
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {product.isFeatured && <span className={`${badge} bg-gold text-on-brand`}>Destacado</span>}
          {soldOut && <span className={`${badge} border border-line bg-bg/90 text-text-soft`}>Agotado</span>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <p className="truncate text-[9px] leading-3 font-bold tracking-[0.2em] text-muted uppercase">{product.category.name}</p>
        {/* Alturas reservadas (2 líneas) para que precio y botón queden alineados en todas las cards. */}
        <h3
          title={product.name}
          className="line-clamp-2 min-h-11 font-display text-base leading-5.5 font-semibold text-balance text-text sm:min-h-13 sm:text-lg sm:leading-6.5"
        >
          {product.name}
        </h3>
        <p className="line-clamp-2 min-h-10 text-xs leading-5 text-muted">{product.description}</p>
        <p className="mt-auto pt-2 text-base font-semibold text-brand tabular-nums">{formatPrice(product.price)}</p>

        {soldOut ? (
          <Button variant="secondary" size="sm" disabled className="w-full px-2">
            Agotado
          </Button>
        ) : line ? (
          <QuantityStepper
            name={product.name}
            quantity={line.quantity}
            onChange={(quantity) => setQuantity(product.id, quantity)}
          />
        ) : (
          <Button variant="outline" size="sm" className="w-full px-2" onClick={handleAdd}>
            Agregar
          </Button>
        )}
      </div>
    </article>
  )
}
