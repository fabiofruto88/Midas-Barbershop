import { motion } from 'motion/react'

const ease = [0.23, 1, 0.32, 1]

// Entrada sutil al hacer scroll: opacidad + 12px de desplazamiento, una sola vez.
// Con prefers-reduced-motion, MotionConfig (reducedMotion="user") elimina el desplazamiento.
export default function Reveal({ as = 'div', delay = 0, className = '', children, ...props }) {
  const Component = motion[as]
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -80px 0px' }}
      transition={{ duration: 0.5, ease, delay }}
      {...props}
    >
      {children}
    </Component>
  )
}
