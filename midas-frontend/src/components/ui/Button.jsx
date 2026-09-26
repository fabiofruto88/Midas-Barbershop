import { Link } from 'react-router'
import Spinner from './Spinner'

const base =
  'pressable inline-flex items-center justify-center gap-2 rounded-control disabled:cursor-not-allowed disabled:opacity-50'

const variants = {
  primary: 'bg-brand text-on-brand hover:bg-brand-strong',
  secondary: 'border border-border bg-surface-2 text-text hover:border-brand',
  ghost: 'text-muted hover:text-text',
  danger: 'border border-danger/40 text-danger hover:bg-danger/10',
  // Variantes del diseño de Figma (tipografía de etiqueta: mayúsculas con tracking).
  gold: 'bg-gold font-bold uppercase text-on-brand hover:brightness-110',
  goldDeep: 'bg-gold-deep font-bold uppercase text-on-brand hover:brightness-110',
  outline: 'border border-brand/50 font-semibold uppercase text-brand hover:border-brand hover:bg-brand/10',
}

const sizes = {
  md: 'px-5 py-2.5 text-sm font-semibold',
  // Botón de cabecera / tarjetas: 11px, tracking 0.18em.
  sm: 'px-6 py-2 text-[11px] leading-[14px] tracking-[0.18em]',
  // CTA grande: 13px, tracking 0.2em.
  lg: 'px-8 py-4 text-[13px] leading-4 tracking-[0.2em]',
  // Tamaño de texto de lg; padding y tracking los define quien lo usa.
  lgFlush: 'text-[13px] leading-4',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  to,
  href,
  type = 'button', // dentro de un <form>, solo envía si se pide type="submit" explícitamente
  className = '',
  children,
  ...props
}) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} className={classes} disabled={loading || props.disabled} {...props}>
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
