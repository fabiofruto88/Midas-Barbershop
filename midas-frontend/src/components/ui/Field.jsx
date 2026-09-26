import { useId, useState } from 'react'

function EyeIcon({ open }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <path strokeLinecap="round" d="M4 4l16 16" />}
    </svg>
  )
}

// Campo de formulario con etiqueta, ayuda y error. Los de contraseña incluyen el botón para mostrarla.
export default function Field({ label, error, hint, className = '', type = 'text', ...inputProps }) {
  const id = useId()
  const [revealed, setRevealed] = useState(false)
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  const isPassword = type === 'password'

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`w-full rounded-control border border-border bg-surface-2 px-3.5 py-2.5 text-sm placeholder:text-muted/60 focus:border-brand focus:outline-none aria-invalid:border-danger ${
            isPassword ? 'pr-11' : ''
          }`}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={revealed}
            aria-controls={id}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-control text-muted transition-colors hover:text-brand focus-visible:text-brand"
          >
            <EyeIcon open={revealed} />
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
