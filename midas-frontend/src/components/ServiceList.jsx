import { useServices } from '../hooks/useCatalog'
import { formatPrice } from '../lib/format'
import Alert from './ui/Alert'
import { PageSpinner } from './ui/Spinner'

// Catálogo de servicios. Con `renderItem` se reutiliza en el flujo de reserva.
export default function ServiceList({ renderItem }) {
  const { data: services, isPending, error } = useServices()

  if (isPending) return <PageSpinner />
  if (error) return <Alert tone="error">{error.message}</Alert>
  if (!services.length) return <Alert>Todavía no hay servicios disponibles.</Alert>

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {services.map((service) => (
        <li key={service.id} className="flex">
          {renderItem ? renderItem(service) : <ServiceSummary service={service} />}
        </li>
      ))}
    </ul>
  )
}

export function ServiceSummary({ service }) {
  return (
    <div className="flex w-full flex-col gap-2 rounded-card border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-semibold">{service.name}</h3>
        <span className="shrink-0 font-semibold text-brand">{formatPrice(service.price)}</span>
      </div>
      {service.description && <p className="text-sm text-muted">{service.description}</p>}
      <p className="mt-auto text-xs text-muted">{service.durationMinutes} min</p>
    </div>
  )
}
