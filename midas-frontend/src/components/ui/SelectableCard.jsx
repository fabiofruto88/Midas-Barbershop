// Opción seleccionable (servicio, barbero, día u hora) con estado accesible.
export default function SelectableCard({ selected, onSelect, className = '', children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`rounded-card border p-4 text-left transition-colors ${
        selected ? 'border-brand bg-brand/10' : 'border-border bg-surface hover:border-muted'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
