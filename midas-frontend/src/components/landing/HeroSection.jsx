import { useRef } from 'react'
import { heroBadges, heroSpecs } from '../../content/landing'
import heroImage from '../../assets/landing/hero-barber.jpg'
import iconArrow from '../../assets/landing/icon-arrow-right-dark.svg'
import iconDiamond from '../../assets/landing/icon-diamond.svg'
import iconAward from '../../assets/landing/icon-award.svg'
import { useBookingAccess } from '../../hooks/useAuth'
import { alignGradient, conditions, gsap, SplitText, useGSAP } from '../../lib/gsap'
import { distance, duration, heroTimeline, scale, scroll, stagger } from '../../lib/motion'
import Button from '../ui/Button'
import Magnetic from '../ui/Magnetic'
import Icon from './Icon'

export default function HeroSection() {
  const { canBook, staffHome } = useBookingAccess()
  const sectionRef = useRef(null)
  const contentRef = useRef(null)
  const titleRef = useRef(null)

  useGSAP(
    () => {
      const q = gsap.utils.selector(sectionRef)
      const mm = gsap.matchMedia()

      mm.add(conditions, ({ conditions: { desktop, reduce } }) => {
        if (reduce) {
          gsap.from([titleRef.current, ...q('[data-hero-text], [data-hero-support]')], {
            opacity: 0,
            duration: duration.fade,
          })
          return
        }

        // Entrada: titular palabra a palabra → subtítulo → texto → CTA → apoyos (≈1.15s).
        const split = SplitText.create(titleRef.current, { type: 'words', mask: 'words', wordsClass: 'split-gold' })
        gsap.set(titleRef.current, { backgroundImage: 'none' })
        const stopGradient = alignGradient(titleRef.current, split.words)
        const rise = { opacity: 0, y: distance.md }

        gsap
          .timeline()
          .from(split.words, { yPercent: 100, duration: duration.heroWord, stagger: stagger.word }, 0)
          .from(q('[data-hero-text="subtitle"]'), rise, heroTimeline.subtitle)
          .from(q('[data-hero-text="body"]'), rise, heroTimeline.body)
          .from(q('[data-hero-text="cta"]'), rise, heroTimeline.cta)
          .from(q('[data-hero-support]'), { opacity: 0 }, heroTimeline.support)
          // La foto es el LCP: nunca arranca invisible, solo se asienta desde una escala mayor.
          .from(q('[data-hero-image]'), { scale: scale.heroImageFrom, duration: duration.heroImage }, 0)

        // Salida con scrub mientras el hero deja la pantalla; en móvil, a la mitad de distancia.
        const factor = desktop ? 1 : scroll.parallax.mobileFactor
        gsap
          .timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom top', scrub: scroll.scrub.smooth },
          })
          .to(contentRef.current, { y: scroll.heroExit.y * factor, opacity: scroll.heroExit.opacity }, 0)
          .to(q('[data-hero-shift]'), { yPercent: scroll.heroExit.imageShift * factor }, 0)
          .to(q('[data-hero-zoom]'), { scale: scroll.heroExit.imageScale }, 0)

        return stopGradient
      })
      return () => mm.revert()
    },
    { scope: sectionRef },
  )

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="relative flex min-h-[736px] items-center overflow-clip bg-bg pt-[112px] pb-20 lg:pb-[144px]"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-8 xl:px-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          <div ref={contentRef} className="flex flex-col items-start justify-center gap-6 self-center lg:col-span-7">
            <ul data-hero-support className="flex flex-wrap gap-x-2.5 gap-y-2.5 py-px" aria-label="Distinciones">
              {heroBadges.map((badge) => (
                <li
                  key={badge.label}
                  className={`flex items-center gap-1.5 border px-3 py-1 text-[9px] leading-3 font-bold tracking-[0.2em] uppercase ${badge.className}`}
                >
                  <Icon src={badge.icon} className={badge.iconSize} />
                  {badge.label}
                </li>
              ))}
            </ul>

            <div className="flex w-full flex-col gap-2">
              <h1
                ref={titleRef}
                id="hero-title"
                className="text-gold max-w-[658px] font-display text-[36px] leading-[42px] font-semibold tracking-[-0.02em] uppercase sm:text-[56px] sm:leading-16"
              >
                El toque de oro en tu estilo.
              </h1>
              <p
                data-hero-text="subtitle"
                className="max-w-[576px] font-display text-lg leading-7 font-medium tracking-[0.025em] text-brand-soft/90 sm:text-xl"
              >
                Midas – Gestión de Citas Premium para el Hombre Exigente.
              </p>
            </div>

            <p
              data-hero-text="body"
              className="max-w-[576px] text-base leading-[26px] font-light tracking-[0.01em] text-text-soft"
            >
              Donde la alquimia clásica de la barbería converge con la suntuosidad de la alta aristocracia. Cada trazo de
              navaja es un ejercicio de devoción, precisión quirúrgica y serenidad absoluta.
            </p>

            <div data-hero-text="cta" className="flex w-full flex-col gap-4 pt-1 sm:flex-row sm:items-center">
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
            </div>

            <ul data-hero-support className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
              {heroSpecs.map((spec) => (
                <li
                  key={spec.label}
                  className="flex items-center gap-1.5 text-xs leading-[18px] tracking-[0.02em] text-text-soft/70"
                >
                  <Icon src={spec.icon} className={spec.iconSize} />
                  {spec.label}
                </li>
              ))}
            </ul>
          </div>

          <figure
            className="relative mx-auto aspect-[461/577] w-full max-w-[461px] self-center overflow-clip bg-surface shadow-[0px_16px_48px_0px_rgba(0,0,0,0.9),0px_0px_24px_0px_rgba(212,175,55,0.15)] lg:col-span-5 lg:max-w-none"
          >
            {/* Tres capas, una transformación cada una: parallax (shift), salida (zoom) y entrada (imagen).
                La capa de parallax es un 10% más alta por arriba para que al bajar nunca asome el fondo. */}
            <div data-hero-shift className="absolute inset-x-0 top-[-10%] h-[110%]">
              <div data-hero-zoom className="size-full">
                <img
                  data-hero-image
                  src={heroImage}
                  alt="Maestro barbero afeitando con navaja a un cliente en el salón Midas"
                  className="size-full object-cover grayscale"
                  fetchPriority="high"
                />
              </div>
            </div>
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
