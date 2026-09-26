import { useMemo } from 'react'
import { cartCount, useCartStore } from '../store/cartStore'
import { useShopProducts } from './useCatalog'

// Líneas del carrito cruzadas con el catálogo actual: las agotadas se marcan y no suman al total
// ni entran en el mensaje de WhatsApp. (Quitar las ocultas/borradas lo hace <CartSync />.)
export function useCart() {
  const items = useCartStore((state) => state.items)
  const { data: products } = useShopProducts({ enabled: items.length > 0 })

  return useMemo(() => {
    const byId = new Map((products ?? []).map((product) => [product.id, product]))
    const lines = items.map((item) => ({ ...item, soldOut: byId.get(item.productId)?.isAvailable === false }))
    const orderable = lines.filter((line) => !line.soldOut)
    return {
      lines,
      orderable,
      count: cartCount(items),
      total: orderable.reduce((sum, line) => sum + line.price * line.quantity, 0),
    }
  }, [items, products])
}
