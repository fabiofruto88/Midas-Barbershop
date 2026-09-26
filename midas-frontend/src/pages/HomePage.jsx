import { useEffect } from 'react'
import { useLocation } from 'react-router'
import HeroSection from '../components/landing/HeroSection'
import HighlightStrip from '../components/landing/HighlightStrip'
import ServicesSection from '../components/landing/ServicesSection'
import BookingSection from '../components/landing/BookingSection'
import GallerySection from '../components/landing/GallerySection'
import TestimonialsSection from '../components/landing/TestimonialsSection'
import LocationSection from '../components/landing/LocationSection'
import FinalCta from '../components/landing/FinalCta'

export default function HomePage() {
  const { hash } = useLocation()

  // Al llegar desde otra página con /#seccion, el router no hace scroll al ancla.
  useEffect(() => {
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
  }, [hash])

  return (
    <>
      <HeroSection />
      <HighlightStrip />
      <ServicesSection />
      <BookingSection />
      <GallerySection />
      <TestimonialsSection />
      <LocationSection />
      <FinalCta />
    </>
  )
}
