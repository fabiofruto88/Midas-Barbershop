import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { useBookingAccess } from '../hooks/useAuth'
import HeroSection from '../components/landing/HeroSection'
import HighlightStrip from '../components/landing/HighlightStrip'
import ServicesSection from '../components/landing/ServicesSection'
import RitualSection from '../components/landing/RitualSection'
import BookingSection from '../components/landing/BookingSection'
import GallerySection from '../components/landing/GallerySection'
import TestimonialsSection from '../components/landing/TestimonialsSection'
import LocationSection from '../components/landing/LocationSection'
import FinalCta from '../components/landing/FinalCta'

export default function HomePage() {
  const { hash } = useLocation()
  // El personal (admin/barbero) no reserva: no ve la terminal de reserva ni la llamada final.
  const { canBook } = useBookingAccess()

  // Al llegar desde otra página con /#seccion, el router no hace scroll al ancla.
  useEffect(() => {
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
  }, [hash])

  return (
    <>
      <HeroSection />
      <HighlightStrip />
      <ServicesSection />
      <RitualSection />
      {canBook && <BookingSection />}
      <GallerySection />
      <TestimonialsSection />
      <LocationSection />
      {canBook && <FinalCta />}
    </>
  )
}
