import { motion } from 'motion/react'
import { useRevealItem } from '../../lib/motion'

// Cabecera de sección del diseño: antetítulo dorado, título en Playfair con acento en cursiva y bajada.
// Dentro de un Reveal, sus tres partes entran en cascada (antetítulo → título → bajada).
export function Eyebrow({ tracking = 'tracking-[0.25em]', className = '', children }) {
  return (
    <p className={`text-[11px] font-semibold leading-[14px] text-brand uppercase ${tracking} ${className}`}>{children}</p>
  )
}

export function Accent({ className = 'text-brand-soft', children }) {
  return <em className={`font-semibold italic ${className}`}>{children}</em>
}

const titleTags = { h1: motion.h1, h2: motion.h2, h3: motion.h3 }

export default function SectionHeading({
  id,
  eyebrow,
  eyebrowTracking,
  eyebrowRule = false,
  title,
  titleClassName = 'text-[32px] leading-[36px] tracking-[-0.01em] sm:text-[40px] sm:leading-10',
  description,
  descriptionClassName = 'text-sm leading-[22px] tracking-[0.01em] text-muted',
  align = 'left',
  as = 'h2',
  className = '',
}) {
  const item = useRevealItem()
  const Title = titleTags[as] ?? motion.h2
  const centered = align === 'center'
  return (
    <div className={`flex flex-col gap-1 ${centered ? 'items-center text-center' : 'items-start'} ${className}`}>
      <motion.div variants={item} className="flex items-center gap-1">
        {eyebrowRule && <span aria-hidden className="h-px w-8 bg-brand" />}
        <Eyebrow tracking={eyebrowTracking}>{eyebrow}</Eyebrow>
      </motion.div>
      <Title variants={item} id={id} className={`pt-1 font-display font-semibold text-text uppercase ${titleClassName}`}>
        {title}
      </Title>
      {description && (
        <motion.p variants={item} className={descriptionClassName}>
          {description}
        </motion.p>
      )}
    </div>
  )
}
