import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import SiteHeader from '../components/landing/SiteHeader'
import SiteFooter from '../components/landing/SiteFooter'
import CartDrawer from '../components/shop/CartDrawer'

export default function RootLayout() {
  // La landing ocupa todo el ancho y su hero pasa por debajo del header fijo.
  const isHome = useLocation().pathname === '/'

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only z-[60] bg-brand px-4 py-2 text-sm font-semibold text-on-brand focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <SiteHeader />

      <main
        id="contenido"
        tabIndex={-1}
        className={
          isHome ? 'flex-1 outline-none' : 'mx-auto w-full max-w-5xl flex-1 px-4 pt-28 pb-8 outline-none sm:pt-32 sm:pb-12'
        }
      >
        <Outlet />
      </main>

      <SiteFooter />
      <CartDrawer />
      <ScrollRestoration />
    </div>
  )
}
