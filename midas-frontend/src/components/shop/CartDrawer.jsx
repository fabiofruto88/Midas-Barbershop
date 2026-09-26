import { useEffect, useId, useRef } from 'react'
import { toast } from 'sonner'
import { useLocation } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useCart } from '../../hooks/useCart'
import { useShopProducts } from '../../hooks/useCatalog'
import { formatPrice } from '../../lib/format'
import { buildOrderMessage, MAX_CUSTOMER_NAME, MAX_ORDER_NOTE, whatsappOrderUrl } from '../../lib/whatsapp'
import { useCartStore } from '../../store/cartStore'
import Button from '../ui/Button'
import Field from '../ui/Field'
import { CloseIcon, WhatsAppIcon } from './icons'
import ProductImage from './ProductImage'
import QuantityStepper from './QuantityStepper'

const ease = [0.23, 1, 0.32, 1]

// Pone el carrito al día con el catálogo: quita lo que el admin ocultó o borró y actualiza precios.
function CartSync() {
  const hasItems = useCartStore((state) => state.items.length > 0)
  const sync = useCartStore((state) => state.sync)
  const { data: products } = useShopProducts({ enabled: hasItems })

  useEffect(() => {
    if (!products) return
    const removed = sync(products)
    if (removed) {
      toast.info('Actualizamos tu pedido', {
        description: `${removed === 1 ? 'Un producto ya no está' : `${removed} productos ya no están`} disponible(s) en la tienda.`,
      })
    }
  }, [products, sync])

  return null
}

// Cierra el panel al navegar a otra página.
function useCloseOnNavigate(close) {
  const { pathname } = useLocation()
  useEffect(() => close(), [pathname, close])
}

export default function CartDrawer() {
  const isOpen = useCartStore((state) => state.isOpen)
  const close = useCartStore((state) => state.close)
  useCloseOnNavigate(close)

  // Escape cierra y el fondo no se desplaza mientras el panel está abierto.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (event) => event.key === 'Escape' && close()
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, close])

  return (
    <>
      <CartSync />
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[70]">
            <motion.div
              aria-hidden
              className="absolute inset-0 bg-bg/70 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
            />
            <CartPanel onClose={close} />
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

function CartPanel({ onClose }) {
  const titleId = useId()
  const closeRef = useRef(null)
  const { lines, orderable, count, total } = useCart()
  const customer = useCartStore((state) => state.customer)
  const setCustomer = useCartStore((state) => state.setCustomer)
  const setQuantity = useCartStore((state) => state.setQuantity)
  const clear = useCartStore((state) => state.clear)

  useEffect(() => closeRef.current?.focus(), [])

  const message = buildOrderMessage({ lines: orderable, total, name: customer.name, note: customer.note })

  // El enlace abre WhatsApp; el carrito se mantiene por si el cliente no llega a enviar el mensaje.
  const onSend = () =>
    toast.success('Abriendo WhatsApp…', {
      description: 'Envía el mensaje y tu asesor confirmará el pedido y el pago.',
      action: { label: 'Vaciar carrito', onClick: clear },
      duration: 10000,
    })

  return (
    <motion.aside
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-brand/20 bg-surface shadow-[0px_12px_36px_0px_rgba(0,0,0,0.8)]"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%', transition: { duration: 0.2, ease } }}
      transition={{ duration: 0.32, ease }}
    >
      <header className="flex items-center justify-between gap-4 border-b border-line/30 px-5 py-4">
        <div>
          <p className="text-[9px] leading-3 font-bold tracking-[0.25em] text-brand uppercase">Tienda Midas</p>
          <h2 id={titleId} className="font-display text-xl font-semibold uppercase">
            Tu pedido {count > 0 && <span className="text-sm font-normal text-muted normal-case">({count})</span>}
          </h2>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar pedido"
          className="pressable grid size-9 place-items-center border border-brand/30 text-brand hover:bg-brand/10"
        >
          <CloseIcon />
        </button>
      </header>

      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <p className="font-display text-lg">Tu pedido está vacío</p>
          <p className="text-sm text-muted">Agrega productos desde la tienda y te los apartamos por WhatsApp.</p>
          <Button to="/tienda" variant="outline" size="sm" onClick={onClose}>
            Ver la tienda
          </Button>
        </div>
      ) : (
        <>
          <ul className="flex-1 divide-y divide-line/30 overflow-y-auto overscroll-contain px-5">
            {lines.map((line) => (
              <li key={line.productId} className={`flex gap-3 py-4 ${line.soldOut ? 'opacity-60' : ''}`}>
                <ProductImage product={line} size={128} className="size-16 shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{line.name}</p>
                      <p className="text-xs text-muted tabular-nums">{formatPrice(line.price)} c/u</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-brand tabular-nums">
                      {line.soldOut ? '—' : formatPrice(line.price * line.quantity)}
                    </p>
                  </div>
                  {line.soldOut ? (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-danger">Agotado: no se incluye en el pedido.</p>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, 0)}
                        className="text-xs text-muted underline hover:text-text"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <QuantityStepper
                      name={line.name}
                      quantity={line.quantity}
                      onChange={(quantity) => setQuantity(line.productId, quantity)}
                      className="w-32"
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>

          <footer className="space-y-4 border-t border-line/30 bg-bg-alt px-5 py-5">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold tracking-[0.18em] text-text-soft uppercase">Total</span>
              <span className="font-display text-2xl font-semibold text-brand tabular-nums">{formatPrice(total)}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Tu nombre (opcional)"
                value={customer.name}
                maxLength={MAX_CUSTOMER_NAME}
                autoComplete="name"
                onChange={(event) => setCustomer('name', event.target.value)}
              />
              <Field
                label="Nota (opcional)"
                value={customer.note}
                maxLength={MAX_ORDER_NOTE}
                placeholder="Ej. lo recojo el sábado"
                onChange={(event) => setCustomer('note', event.target.value)}
              />
            </div>
            <p className="text-xs leading-5 text-muted">
              No pagas aquí: al continuar se abre WhatsApp con tu pedido y un asesor confirma existencias, pago y entrega.
            </p>
            {orderable.length > 0 ? (
              <Button
                href={whatsappOrderUrl(message)}
                target="_blank"
                rel="noopener noreferrer"
                variant="gold"
                size="sm"
                className="w-full py-3.5"
                onClick={onSend}
              >
                <WhatsAppIcon />
                Continuar pedido por WhatsApp
                <span className="sr-only"> (se abre en una pestaña nueva)</span>
              </Button>
            ) : (
              <Button variant="secondary" size="sm" disabled className="w-full py-3.5">
                No hay productos disponibles en tu pedido
              </Button>
            )}
            <button type="button" onClick={clear} className="block w-full text-center text-xs text-muted underline hover:text-text">
              Vaciar carrito
            </button>
          </footer>
        </>
      )}
    </motion.aside>
  )
}
