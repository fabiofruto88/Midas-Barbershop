import { motion } from 'motion/react'
import { duration, ease, stagger, useMotionPrefs } from '../../lib/motion'

// Entrada al hacer scroll, una sola vez. Propaga las variantes "hidden"/"show" a sus hijos
// (p. ej. SectionHeading), que entran en cascada. Con reduced-motion: solo opacidad.
export default function Reveal({ as = 'div', delay = 0, className = '', children, ...props }) {
  const Component = motion[as]
  const { shift } = useMotionPrefs()
  const variants = {
    hidden: { opacity: 0, transform: `translateY(${shift}px)` },
    show: {
      opacity: 1,
      transform: 'translateY(0px)',
      transition: { duration: duration.reveal, ease: ease.out, delay, delayChildren: delay, staggerChildren: stagger.item },
    },
  }
  return (
    <Component
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -80px 0px' }}
      {...props}
    >
      {children}
    </Component>
  )
}
