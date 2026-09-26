import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi } from '../services/midas'
import { queryKeys } from '../lib/queryClient'
import { formatLongDate, formatTime } from '../lib/format'
import { optimizedImageUrl } from '../lib/images'
import ResultUploader from '../components/agenda/ResultUploader'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { PageSpinner } from '../components/ui/Spinner'

const filters = [
  { id: 'all', label: 'Todos', match: () => true },
  { id: 'with-photo', label: 'Con foto', match: (item) => Boolean(item.result) },
  { id: 'without-photo', label: 'Sin foto', match: (item) => !item.result },
]

// Historial del barbero: sus servicios completados con la foto del resultado.
export default function ServiceHistoryPage() {
  const [filter, setFilter] = useState('all')
  const { data: appointments, isPending, error } = useQuery({
    queryKey: queryKeys.myAppointments,
    queryFn: appointmentsApi.mine,
  })

  if (isPending) return <PageSpinner />
  if (error) return <Alert tone="error">{error.message}</Alert>

  // El backend ordena de más reciente a más antigua.
  const completed = appointments.filter((appointment) => appointment.status === 'COMPLETED')
  const withPhoto = completed.filter((appointment) => appointment.result).length
  const visible = completed.filter(filters.find(({ id }) => id === filter).match)

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Historial de servicios</h1>
          <p className="text-muted">
            {completed.length} {completed.length === 1 ? 'servicio completado' : 'servicios completados'} · {withPhoto} con
            foto
          </p>
        </div>
        <Button to="/agenda" variant="secondary">
          Volver a la agenda
        </Button>
      </header>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar historial">
        {filters.map(({ id, label }) => (
          <Button
            key={id}
            size="sm"
            variant={filter === id ? 'primary' : 'secondary'}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {visible.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((appointment) => (
            <li key={appointment.id}>
              <HistoryCard appointment={appointment} />
            </li>
          ))}
        </ul>
      ) : (
        <Alert>
          {completed.length
            ? 'No hay servicios con este filtro.'
            : 'Aquí aparecerán tus servicios completados y las fotos de los resultados.'}
        </Alert>
      )}
    </div>
  )
}

function HistoryCard({ appointment }) {
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const customer = appointment.client?.name ?? appointment.guestName
  const { result } = appointment

  return (
    <Card className="flex h-full flex-col gap-4">
      {result ? (
        // La foto completa (sin recorte) se abre en otra pestaña.
        <a
          href={optimizedImageUrl(result.imageUrl, { width: 1600 })}
          target="_blank"
          rel="noreferrer"
          className="block overflow-hidden rounded-control"
          aria-label={`Ver foto completa de ${customer}`}
        >
          <img
            src={optimizedImageUrl(result.imageUrl, { width: 600, height: 600 })}
            alt={`Resultado de ${appointment.service.name} para ${customer}`}
            loading="lazy"
            className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </a>
      ) : (
        !uploading && (
          <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-control border border-dashed border-border bg-surface-2 text-sm text-muted">
            Sin foto del resultado
            <Button size="sm" variant="secondary" onClick={() => setUploading(true)}>
              Subir foto
            </Button>
          </div>
        )
      )}

      {uploading && (
        <ResultUploader
          appointmentId={appointment.id}
          onCancel={() => setUploading(false)}
          onUploaded={() => {
            setUploading(false)
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
          }}
        />
      )}

      <div className="space-y-1">
        <p className="font-semibold">{appointment.service.name}</p>
        <p className="text-sm">{customer}</p>
        <p className="text-sm text-muted">
          {formatLongDate(appointment.date)} · {formatTime(appointment.timeSlot)}
        </p>
        {result && (
          <p className={`text-xs font-medium ${result.isPublished ? 'text-success' : 'text-muted'}`}>
            {result.isPublished ? 'Publicada en la galería de la web' : 'Pendiente de publicación por el admin'}
          </p>
        )}
      </div>

      {result?.notes && <p className="border-l-2 border-brand pl-3 text-sm text-muted">{result.notes}</p>}

      {result && !uploading && (
        <Button size="sm" variant="ghost" className="mt-auto self-start" onClick={() => setUploading(true)}>
          Cambiar foto
        </Button>
      )}
    </Card>
  )
}
