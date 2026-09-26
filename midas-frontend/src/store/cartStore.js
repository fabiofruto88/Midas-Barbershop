import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

// Límites para que el mensaje de WhatsApp quepa en la URL (wa.me?text=…).
export const MAX_QUANTITY = 20
export const MAX_LINES = 30

const clamp = (quantity) => Math.min(MAX_QUANTITY, Math.max(1, quantity))

// Carrito de la tienda. Vive solo en el navegador (localStorage): la compra se cierra por
// WhatsApp, así que no hace falta sesión ni guardar nada en el servidor.
// Cada línea guarda una copia de nombre y precio para pintarse antes de que cargue el catálogo;
// `sync` la pone al día con el catálogo real.
export const useCartStore = create(
  persist(
    (set) => ({
      items: [], // [{ productId, name, price, imageUrl, quantity }]
      customer: { name: '', note: '' },
      isOpen: false,

      add: (product) =>
        set(({ items }) => {
          const current = items.find((item) => item.productId === product.id)
          if (current) {
            return { items: items.map((item) => (item === current ? { ...item, quantity: clamp(item.quantity + 1) } : item)) }
          }
          if (items.length >= MAX_LINES) return {}
          const { id: productId, name, imageUrl } = product
          return { items: [...items, { productId, name, price: Number(product.price), imageUrl, quantity: 1 }] }
        }),
      setQuantity: (productId, quantity) =>
        set(({ items }) => ({
          items:
            quantity < 1
              ? items.filter((item) => item.productId !== productId)
              : items.map((item) => (item.productId === productId ? { ...item, quantity: clamp(quantity) } : item)),
        })),
      remove: (productId) => set(({ items }) => ({ items: items.filter((item) => item.productId !== productId) })),
      clear: () => set({ items: [] }),
      setCustomer: (field, value) => set(({ customer }) => ({ customer: { ...customer, [field]: value } })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),

      // Quita los productos que ya no están en la tienda (ocultos o borrados) y actualiza nombre,
      // precio y foto. Devuelve cuántas líneas se quitaron. Solo escribe si algo cambió.
      sync: (products) => {
        let removed = 0
        set(({ items }) => {
          const byId = new Map(products.map((product) => [product.id, product]))
          let changed = false
          const next = []
          for (const item of items) {
            const product = byId.get(item.productId)
            if (!product) {
              removed += 1
              changed = true
              continue
            }
            const fresh = { ...item, name: product.name, price: Number(product.price), imageUrl: product.imageUrl }
            if (fresh.name !== item.name || fresh.price !== item.price || fresh.imageUrl !== item.imageUrl) changed = true
            next.push(fresh)
          }
          return changed ? { items: next } : {}
        })
        return removed
      },
    }),
    {
      name: 'midas-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ items, customer }) => ({ items, customer }),
    }
  )
)

export const cartCount = (items) => items.reduce((sum, item) => sum + item.quantity, 0)
