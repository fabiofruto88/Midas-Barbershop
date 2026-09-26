import { useState } from 'react'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { resultsApi } from '../../services/midas'
import { queryKeys } from '../../lib/queryClient'
import { optimizedImageUrl } from '../../lib/images'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { PageSpinner } from '../../components/ui/Spinner'

const filters = [
  { id: 'pending', label: 'Sin publicar', match: (item) => !item.isPublished },
  { id: 'published', label: 'Publicadas', match: (item) => item.isPublished },
  { id: 'all', label: 'Todas', match: () => true },
]

const shortDate = (value) =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(value)
  )

// Moderación de la galería pública: el admin decide qué fotos de resultados se muestran en la web.
export default function GalleryAdminPage() {
  const [filter, setFilter] = useState('pending')
  const { data: results, isPending, error } = useQuery({ queryKey: queryKeys.allResults, queryFn: resultsApi.all })

  if (isPending) return <PageSpinner />
  if (error) return <Alert tone="error">{error.message}</Alert>

  const published = results.filter((item) => item.isPublished).length
  const visible = results.filter(filters.find(({ id }) => id === filter).match)

  return (
    <section className="space-y-4" aria-labelledby="galeria-admin">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 id="galeria-admin" className="text-lg font-semibold">
            Galería pública
          </h2>
          <p className="text-sm text-muted">
            {results.length} {results.length === 1 ? 'foto' : 'fotos'} de resultados · {published} publicadas en la web
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar fotos">
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
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((item) => (
            <li key={item.id}>
              <ResultCard item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <Alert>
          {results.length
            ? 'No hay fotos con este filtro.'
            : 'Cuando los barberos suban fotos de sus servicios aparecerán aquí para que decidas cuáles publicar.'}
        </Alert>
      )}
    </section>
  )
}

function ResultCard({ item }) {
  const queryClient = useQueryClient()
  const { service, barber, date } = item.appointment

  const toggle = useMutation({
    mutationFn: () => resultsApi.setPublished(item.id, !item.isPublished),
    onSuccess: ({ isPublished }) => {
      toast.success(isPublished ? 'Foto publicada en la galería' : 'Foto retirada de la galería')
      queryClient.invalidateQueries({ queryKey: ['results'] })
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Card className="flex h-full flex-col gap-3 p-3">
      <a
        href={optimizedImageUrl(item.imageUrl, { width: 1600 })}
        target="_blank"
        rel="noreferrer"
        className="relative block overflow-hidden rounded-control"
        aria-label={`Ver foto completa de ${service.name}`}
      >
        <img
          src={optimizedImageUrl(item.imageUrl, { width: 500, height: 500 })}
          alt={`${service.name} por ${barber.name}`}
          loading="lazy"
          className="aspect-square w-full object-cover"
        />
        <span
          className={`absolute top-2 left-2 rounded-control px-2 py-0.5 text-xs font-semibold ${
            item.isPublished ? 'bg-success text-bg' : 'bg-bg/80 text-muted'
          }`}
        >
          {item.isPublished ? 'Publicada' : 'Sin publicar'}
        </span>
      </a>
      <div className="space-y-0.5">
        <p className="font-semibold">{service.name}</p>
        <p className="text-sm text-muted">
          {barber.name} · {shortDate(date)}
        </p>
      </div>
      {item.notes && <p className="border-l-2 border-brand pl-3 text-sm text-muted">{item.notes}</p>}
      <Button
        size="sm"
        className="mt-auto"
        variant={item.isPublished ? 'secondary' : 'primary'}
        loading={toggle.isPending}
        onClick={() => toggle.mutate()}
      >
        {item.isPublished ? 'Retirar de la galería' : 'Publicar en la galería'}
      </Button>
    </Card>
  )
}
