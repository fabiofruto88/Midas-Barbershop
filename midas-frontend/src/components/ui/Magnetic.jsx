import { useRef } from 'react'
import { motion, useSpring, useTransform } from 'motion/react'
import { distance, spring, useMotionPrefs } from '../../lib/motion'

const clamp = (value) => Math.max(-1, Math.min(1, value))

// El hijo sigue levemente al cursor (máx. distance.magnetMax) y vuelve con un resorte interrumpible.
// Solo con puntero fino y sin reduced-motion; en táctil devuelve el hijo tal cual.
export default function Magnetic({ className = '', children }) {
  const { magnetic } = useMotionPrefs()
  const rect = useRef(null)
  const x = useSpring(0, spring.magnetic)
  const y = useSpring(0, spring.magnetic)
  const transform = useTransform(() => `translate3d(${x.get()}px, ${y.get()}px, 0)`)

  if (!magnetic) return children

  // El rectángulo se mide al entrar: medirlo en cada movimiento incluiría el propio desplazamiento.
  const enter = (event) => {
    rect.current = event.currentTarget.getBoundingClientRect()
  }
  const move = (event) => {
    const box = rect.current
    if (!box) return
    x.set(clamp((event.clientX - (box.left + box.width / 2)) / (box.width / 2)) * distance.magnetMax)
    y.set(clamp((event.clientY - (box.top + box.height / 2)) / (box.height / 2)) * distance.magnetMax)
  }
  const leave = () => {
    rect.current = null
    x.set(0)
    y.set(0)
  }

  return (
    <motion.span
      className={`grid ${className}`}
      style={{ transform }}
      onPointerEnter={enter}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      {children}
    </motion.span>
  )
}
