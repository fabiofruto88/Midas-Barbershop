const sizes = { sm: 'size-4 border-2', md: 'size-8 border-3' }

export default function Spinner({ size = 'md', label = 'Cargando…' }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${sizes[size]}`}
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex justify-center py-16 text-brand">
      <Spinner />
    </div>
  )
}
