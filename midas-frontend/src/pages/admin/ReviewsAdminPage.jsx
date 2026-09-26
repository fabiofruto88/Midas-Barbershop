import { useState } from 'react'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reviewsApi } from '../../services/midas'
import { queryKeys } from '../../lib/queryClient'
import { Stars } from '../../components/ui/StarRating'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { PageSpinner } from '../../components/ui/Spinner'

const filters = [
  { id: 'all', label: 'Todas', match: () => true },
  { id: 'visible', label: 'Visibles', match: (item) => item.isVisible },
  { id: 'hidden', label: 'Ocultas', match: (item) => !item.isVisible },
]

const shortDate = (value) =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))

// Moderación de reseñas: se publican solas y el admin puede ocultar las que no deban salir en la web.
export default function ReviewsAdminPage() {
  const [filter, setFilter] = useState('all')
  const { data: reviews, isPending, error } = useQuery({ queryKey: queryKeys.allReviews, queryFn: reviewsApi.all })

  if (isPending) return <PageSpinner />
  if (error) return <Alert tone="error">{error.message}</Alert>

  const visible = reviews.filter(filters.find(({ id }) => id === filter).match)
  const average = reviews.length ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length : 0

  return (
    <section className="space-y-4" aria-labelledby="resenas-admin">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 id="resenas-admin" className="text-lg font-semibold">
            Reseñas de clientes
          </h2>
          <p className="text-sm text-muted">
            {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}
            {reviews.length > 0 && ` · promedio ${average.toFixed(1)} de 5`} · las visibles salen en la web
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar reseñas">
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
      </div>

      {visible.length ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {visible.map((item) => (
            <li key={item.id}>
              <ReviewCard item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <Alert>
          {reviews.length
            ? 'No hay reseñas con este filtro.'
            : 'Cuando los clientes califiquen sus servicios, sus reseñas aparecerán aquí.'}
        </Alert>
      )}
    </section>
  )
}

function ReviewCard({ item }) {
  const queryClient = useQueryClient()
  const { service, barber } = item.appointment

  const toggle = useMutation({
    mutationFn: () => reviewsApi.setVisible(item.id, !item.isVisible),
    onSuccess: ({ isVisible }) => {
      toast.success(isVisible ? 'Reseña visible en la web' : 'Reseña oculta de la web')
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Card className={`flex h-full flex-col gap-3 ${item.isVisible ? '' : 'opacity-60'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p className="font-semibold">{item.client.name}</p>
          <p className="truncate text-sm text-muted">{item.client.email}</p>
        </div>
        <Stars value={item.rating} />
      </div>
      <p className="text-sm wrap-break-word italic">"{item.comment}"</p>
      <p className="text-xs text-muted">
        {service.name} · con {barber.name} · {shortDate(item.createdAt)}
      </p>
      <Button
        size="sm"
        className="mt-auto self-start"
        variant={item.isVisible ? 'secondary' : 'primary'}
        loading={toggle.isPending}
        onClick={() => toggle.mutate()}
      >
        {item.isVisible ? 'Ocultar de la web' : 'Mostrar en la web'}
      </Button>
    </Card>
  )
}
