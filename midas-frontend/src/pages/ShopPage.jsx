import { useDeferredValue, useMemo, useState } from 'react'
import { useShopCategories, useShopProducts } from '../hooks/useCatalog'
import { useCart } from '../hooks/useCart'
import { formatPrice } from '../lib/format'
import { useCartStore } from '../store/cartStore'
import SectionHeading, { Accent } from '../components/landing/SectionHeading'
import ProductCard from '../components/shop/ProductCard'
import { BagIcon, SearchIcon } from '../components/shop/icons'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import { PageSpinner } from '../components/ui/Spinner'

const ALL = 'all'

const steps = [
  { title: 'Elige', text: 'Arma tu pedido con los productos del club.' },
  { title: 'Envía', text: 'Continúa por WhatsApp con tu lista y el total.' },
  { title: 'Recibe', text: 'Tu asesor confirma el pago y la entrega.' },
]

// Normaliza para buscar sin tildes ni mayúsculas ("cera" encuentra "Cera Mate").
const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

export default function ShopPage() {
  const products = useShopProducts()
  const categories = useShopCategories()
  const [category, setCategory] = useState(ALL)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  // Solo se muestran las categorías con productos visibles.
  const tabs = useMemo(() => {
    const used = new Set((products.data ?? []).map((product) => product.category.id))
    return (categories.data ?? []).filter((item) => used.has(item.id))
  }, [products.data, categories.data])

  const visible = useMemo(() => {
    const term = normalize(deferredSearch.trim())
    return (products.data ?? []).filter(
      (product) =>
        (category === ALL || product.category.id === category) &&
        (!term || normalize(`${product.name} ${product.description ?? ''}`).includes(term))
    )
  }, [products.data, category, deferredSearch])

  return (
    <div className="space-y-10 pb-24">
      <header className="space-y-8">
        <SectionHeading
          id="tienda-title"
          as="h1"
          eyebrowRule
          eyebrow="Boutique del club"
          title={
            <>
              La tienda <Accent>Midas</Accent>
            </>
          }
          description="Productos de barbería y estilo seleccionados por nuestros maestros. Arma tu pedido aquí y termínalo con un asesor por WhatsApp: sin pagos en línea y sin necesidad de crear cuenta."
          descriptionClassName="max-w-2xl pt-2 text-sm leading-[22px] tracking-[0.01em] text-muted"
        />
        <ol className="grid gap-px border border-border bg-border sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3 bg-surface px-4 py-3.5">
              <span className="font-display text-2xl leading-none font-semibold text-brand/60 italic">{index + 1}</span>
              <div>
                <p className="text-[11px] leading-[14px] font-bold tracking-[0.18em] text-text uppercase">{step.title}</p>
                <p className="text-xs leading-5 text-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </header>

      {products.isPending ? (
        <PageSpinner />
      ) : products.error ? (
        <Alert tone="error">{products.error.message}</Alert>
      ) : products.data.length === 0 ? (
        <Alert>Muy pronto tendremos productos disponibles. ¡Vuelve en unos días!</Alert>
      ) : (
        <section aria-labelledby="tienda-title" className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div role="group" aria-label="Filtrar por categoría" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              {[{ id: ALL, name: 'Todo' }, ...tabs].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={category === item.id}
                  onClick={() => setCategory(item.id)}
                  className={`pressable shrink-0 border px-4 py-2 text-[11px] leading-[14px] font-semibold tracking-[0.18em] uppercase ${
                    category === item.id
                      ? 'border-brand bg-brand text-on-brand'
                      : 'border-border text-text-soft hover:border-brand/60 hover:text-brand'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <label className="relative block sm:w-64">
              <span className="sr-only">Buscar productos</span>
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar productos"
                className="w-full border border-border bg-surface-2 py-2.5 pr-3 pl-9 text-sm placeholder:text-muted/60 focus:border-brand focus:outline-none"
              />
            </label>
          </div>

          {visible.length === 0 ? (
            <Alert>No encontramos productos con ese filtro.</Alert>
          ) : (
            <ul className="grid auto-rows-fr grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
              {visible.map((product) => (
                <li key={product.id} className="flex min-w-0">
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <OrderBar />
    </div>
  )
}

// Barra fija con el resumen del pedido mientras se navega la tienda.
function OrderBar() {
  const { count, total } = useCart()
  const open = useCartStore((state) => state.open)
  if (count === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand/30 bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-[12px]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <BagIcon className="size-5 text-brand" />
          <p className="text-sm">
            <span className="font-semibold">
              {count} {count === 1 ? 'producto' : 'productos'}
            </span>
            <span className="text-muted"> · </span>
            <span className="font-semibold text-brand tabular-nums">{formatPrice(total)}</span>
          </p>
        </div>
        <Button variant="gold" size="sm" onClick={open} className="px-5 py-2.5">
          Ver pedido
        </Button>
      </div>
    </div>
  )
}
