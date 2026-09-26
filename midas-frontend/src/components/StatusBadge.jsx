const statuses = {
  PENDING: { label: 'Pendiente', className: 'bg-brand/15 text-brand' },
  COMPLETED: { label: 'Completada', className: 'bg-success/15 text-success' },
  CANCELLED: { label: 'Cancelada', className: 'bg-surface-2 text-muted' },
}

export default function StatusBadge({ status }) {
  const { label, className } = statuses[status]
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>{label}</span>
}
