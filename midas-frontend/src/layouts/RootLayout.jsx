import { useEffect, useRef } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import { motion } from 'motion/react'
import { distance, duration, ease, useMotionPrefs } from '../lib/motion'
import { refreshScroll } from '../lib/gsap'
import ScrollProgress from '../components/landing/ScrollProgress'
import SiteHeader from '../components/landing/SiteHeader'
import SiteFooter from '../components/landing/SiteFooter'
import CartDrawer from '../components/shop/CartDrawer'

// Entrada de cada página: solo al navegar (la primera carga no se retrasa) y sin esperar a que la
// anterior salga, para que navegar nunca se sienta lento. Se agrupa por el primer segmento de la
// ruta: las pestañas internas (p. ej. /admin/*) no vuelven a animar el contenedor.
function PageTransition({ children }) {
  const { pathname, key } = useLocation()
  const { shift } = useMotionPrefs()
  // React Router marca la entrada inicial con key "default": esa carga no se anima (protege el LCP).
  const isInitialLoad = key === 'default'

  return (
    <motion.div
      key={pathname.split('/')[1] || 'inicio'}
      // `y` (no un transform fijo): al terminar Motion deja `transform: none` y los elementos
      // `fixed` de la página vuelven a posicionarse respecto a la ventana.
      initial={isInitialLoad ? false : { opacity: 0, y: Math.min(shift, distance.sm) }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.route, ease: ease.out }}
      // ScrollTrigger midió con el desplazamiento de la entrada: recalcula al terminar.
      onAnimationComplete={() => refreshScroll(0)}
    >
      {children}
    </motion.div>
  )
}

// Cuando el contenido cambia de alto (datos del API, imágenes, filtros), los ScrollTriggers se recalculan.
function useScrollRefreshOnResize(ref) {
  useEffect(() => {
    const observer = new ResizeObserver(() => refreshScroll())
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])
}

export default function RootLayout() {
  // La landing ocupa todo el ancho y su hero pasa por debajo del header fijo.
  const isHome = useLocation().pathname === '/'
  const mainRef = useRef(null)
  useScrollRefreshOnResize(mainRef)

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only z-[60] bg-brand px-4 py-2 text-sm font-semibold text-on-brand focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <SiteHeader />

      {isHome && <ScrollProgress />}

      <main
        ref={mainRef}
        id="contenido"
        tabIndex={-1}
        className={
          isHome ? 'flex-1 outline-none' : 'mx-auto w-full max-w-5xl flex-1 px-4 pt-28 pb-8 outline-none sm:pt-32 sm:pb-12'
        }
      >
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <SiteFooter />
      <CartDrawer />
      <ScrollRestoration />
    </div>
  )
}
