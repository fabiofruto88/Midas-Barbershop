import { useLayoutEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { heroBadges, heroSpecs } from '../../content/landing'
import heroImage from '../../assets/landing/hero-barber.jpg'
import iconArrow from '../../assets/landing/icon-arrow-right-dark.svg'
import iconDiamond from '../../assets/landing/icon-diamond.svg'
import iconAward from '../../assets/landing/icon-award.svg'
import { useBookingAccess } from '../../hooks/useAuth'
import { distance, duration, ease, heroTimeline, scale, stagger, useMotionPrefs } from '../../lib/motion'
import Button from '../ui/Button'
import Magnetic from '../ui/Magnetic'
import Icon from './Icon'

const TITLE = 'El toque de oro en tu estilo.'

// Cada palabra lleva su propio degradado dorado; se alinea con el ancho del titular para que
// el brillo se lea continuo, como cuando era un solo texto.
function useContinuousGradient(ref) {
  useLayoutEffect(() => {
    const title = ref.current
    if (!title) return
    const words = title.querySelectorAll('[data-word]')
    const paint = () => {
      const width = title.clientWidth
      for (const word of words) {
        word.style.backgroundSize = `${width}px 100%`
        word.style.backgroundPosition = `${-word.offsetLeft}px 0`
      }
    }
    paint()
    document.fonts?.ready.then(paint)
    const observer = new ResizeObserver(paint)
    observer.observe(title)
    return () => observer.disconnect()
  }, [ref])
}

export default function HeroSection() {
  const { canBook, staffHome } = useBookingAccess()
  const { reduce, parallax } = useMotionPrefs()
  const sectionRef = useRef(null)
  const titleRef = useRef(null)
  useContinuousGradient(titleRef)

  // Parallax de la foto mientras el hero sale de pantalla (solo desktop y sin reduced-motion).
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const imageShift = useTransform(scrollYProgress, (progress) => `translate3d(0, ${-distance.parallax * progress}%, 0)`)

  // Secuencia: titular (palabra a palabra) → subtítulo → texto → CTA → apoyos. Total ≈ 1.15s.
  // Con reduced-motion todo es un fundido corto y simultáneo.
  const timing = (delay) => ({
    duration: reduce ? duration.fade : duration.reveal,
    ease: ease.out,
    delay: reduce ? 0 : delay,
  })
  const enter = (delay) => ({
    initial: { opacity: 0, transform: `translateY(${reduce ? 0 : distance.md}px)` },
    animate: { opacity: 1, transform: 'translateY(0px)' },
    transition: timing(delay),
  })
  const fade = (delay) => ({ initial: { opacity: 0 }, animate: { opacity: 1 }, transition: timing(delay) })

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="relative flex min-h-[736px] items-center overflow-clip bg-bg pt-[112px] pb-20 lg:pb-[144px]"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 xl:px-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col items-start justify-center gap-6 self-center lg:col-span-7">
            <motion.ul {...fade(heroTimeline.support)} className="flex flex-wrap gap-x-2.5 gap-y-2.5 py-px" aria-label="Distinciones">
              {heroBadges.map((badge) => (
                <li
                  key={badge.label}
                  className={`flex items-center gap-1.5 border px-3 py-1 text-[9px] leading-3 font-bold tracking-[0.2em] uppercase ${badge.className}`}
                >
                  <Icon src={badge.icon} className={badge.iconSize} />
                  {badge.label}
                </li>
              ))}
            </motion.ul>

            <div className="flex w-full flex-col gap-2">
              <h1
                ref={titleRef}
                id="hero-title"
                className="relative max-w-[658px] font-display text-[36px] leading-[42px] font-semibold tracking-[-0.02em] uppercase sm:text-[56px] sm:leading-16"
              >
                <span className="sr-only">{TITLE}</span>
                <span aria-hidden>
                  {TITLE.split(' ').map((word, index) => (
                    <span key={index}>
                      {index > 0 && ' '}
                      {/* La máscara recorta la palabra mientras sube desde abajo. */}
                      <span className="-mb-[0.1em] inline-block overflow-clip pb-[0.1em] align-top">
                        <motion.span
                          data-word
                          className="text-gold inline-block"
                          initial={{ opacity: 0, transform: reduce ? 'translateY(0%)' : 'translateY(100%)' }}
                          animate={{ opacity: 1, transform: 'translateY(0%)' }}
                          transition={{
                            duration: reduce ? duration.fade : duration.heroWord,
                            ease: ease.out,
                            delay: reduce ? 0 : index * stagger.word,
                          }}
                        >
                          {word}
                        </motion.span>
                      </span>
                    </span>
                  ))}
                </span>
              </h1>
              <motion.p
                {...enter(heroTimeline.subtitle)}
                className="max-w-[576px] font-display text-lg leading-7 font-medium tracking-[0.025em] text-brand-soft/90 sm:text-xl">
                Midas – Gestión de Citas Premium para el Hombre Exigente.
              </motion.p>
            </div>

            <motion.p
              {...enter(heroTimeline.body)}
              className="max-w-[576px] text-base leading-[26px] font-light tracking-[0.01em] text-text-soft"
            >
              Donde la alquimia clásica de la barbería converge con la suntuosidad de la alta aristocracia. Cada trazo de
              navaja es un ejercicio de devoción, precisión quirúrgica y serenidad absoluta.
            </motion.p>

            <motion.div {...enter(heroTimeline.cta)} className="flex w-full flex-col gap-4 pt-1 sm:flex-row sm:items-center">
              <Magnetic>
                <Button
                  {...(canBook ? { href: '#reservas' } : { to: staffHome.to })}
                  variant="gold"
                  size="lg"
                  className="gap-7 shadow-[0px_4px_25px_0px_rgba(212,175,55,0.35)]"
                >
                  <span className="w-[223px] pl-5 text-center">
                    {canBook ? 'Reservar tu cita de oro' : `Ir a ${staffHome.label.toLowerCase()}`}
                  </span>
                  <Icon src={iconArrow} className="size-3" />
                </Button>
              </Magnetic>
              <Magnetic>
                <Button
                  href="#servicios"
                  variant="outline"
                  size="lgFlush"
                  className="justify-start gap-14 py-4 pr-20 pl-8 tracking-[0.2em]"
                >
                  <Icon src={iconDiamond} className="h-[13.5px] w-[15px]" />
                  <span className="w-[120px] text-center">Ver servicios</span>
                </Button>
              </Magnetic>
            </motion.div>

            <motion.ul {...fade(heroTimeline.support)} className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
              {heroSpecs.map((spec) => (
                <li
                  key={spec.label}
                  className="flex items-center gap-1.5 text-xs leading-[18px] tracking-[0.02em] text-text-soft/70"
                >
                  <Icon src={spec.icon} className={spec.iconSize} />
                  {spec.label}
                </li>
              ))}
            </motion.ul>
          </div>

          <figure
            className="relative mx-auto aspect-[461/577] w-full max-w-[461px] self-center overflow-clip bg-surface shadow-[0px_16px_48px_0px_rgba(0,0,0,0.9),0px_0px_24px_0px_rgba(212,175,55,0.15)] lg:col-span-5 lg:max-w-none"
          >
            {/* La foto es el LCP: nunca arranca invisible, solo se asienta desde una escala mayor. */}
            <motion.div
              className="absolute inset-x-0 top-0 h-full lg:h-[110%]"
              style={parallax ? { transform: imageShift } : undefined}
            >
              <motion.img
                src={heroImage}
                alt="Maestro barbero afeitando con navaja a un cliente en el salón Midas"
                className="size-full object-cover grayscale"
                fetchPriority="high"
                initial={{ transform: `scale(${reduce ? 1 : scale.heroImageFrom})` }}
                animate={{ transform: 'scale(1)' }}
                transition={{ duration: duration.heroImage, ease: ease.out }}
              />
            </motion.div>
            <div aria-hidden className="absolute inset-0 bg-linear-to-t from-bg via-bg/30 to-bg/0" />
            <div aria-hidden className="absolute inset-0 border border-brand/40" />
            <div aria-hidden className="absolute inset-2 border border-brand/15" />

            <p className="absolute top-6 right-6 border border-brand-soft/40 bg-bg/80 px-[13px] pt-[12.5px] pb-[9.5px] text-[9px] leading-3 font-bold tracking-[0.3em] text-brand-soft uppercase backdrop-blur-[2px]">
              Cita limitada
            </p>

            <figcaption className="absolute inset-x-6 bottom-6 flex items-center justify-between gap-4 border border-brand/30 bg-bg/90 p-4 backdrop-blur-[6px]">
              <span className="flex min-w-0 flex-col">
                <span className="text-[9px] leading-3 font-bold tracking-[0.25em] text-brand uppercase">Ritual insignia</span>
                <span className="font-display text-lg leading-7 font-medium text-text sm:text-xl">
                  Navaja clásica &amp; toalla caliente
                </span>
                <span className="text-xs leading-[18px] tracking-[0.02em] text-muted">
                  Precisión magistral en cada afeite milimétrico.
                </span>
              </span>
              <span
                aria-hidden
                className="grid size-11 shrink-0 place-items-center rounded-full border border-brand/40 bg-brand/10"
              >
                <Icon src={iconAward} className="h-[19.25px] w-[14.667px]" />
              </span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}
