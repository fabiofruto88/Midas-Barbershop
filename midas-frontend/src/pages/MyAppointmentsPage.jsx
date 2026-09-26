import { useState } from 'react'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi } from '../services/midas'
import { queryKeys } from '../lib/queryClient'
import { formatLongDate, formatTime, hoursUntil } from '../lib/format'
import { optimizedImageUrl } from '../lib/images'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import StatusBadge from '../components/StatusBadge'
import PushToggle from '../components/PushToggle'
import ReviewForm from '../components/ReviewForm'
import { PageSpinner } from '../components/ui/Spinner'

const CANCELLATION_WINDOW_HOURS = 5

const isUpcoming = (appointment) => appointment.status === 'PENDING' && hoursUntil(appointment.date, appointment.timeSlot) > 0

export default function MyAppointmentsPage() {
  const { data: appointments, isPending, error } = useQuery({
    queryKey: queryKeys.myAppointments,
    queryFn: appointmentsApi.mine,
  })

  if (isPending) return <PageSpinner />
  if (error) return <Alert tone="error">{error.message}</Alert>

  // El backend ordena de más reciente a más antigua; las próximas se muestran de la más cercana a la más lejana.
  const upcoming = appointments.filter(isUpcoming).reverse()
  const history = appointments.filter((appointment) => !isUpcoming(appointment))

  return (
    <div className="space-y-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">Mis citas</h1>
        <Button to="/reservar">Nueva reserva</Button>
      </header>

      <PushToggle />

      <section className="space-y-4" aria-labelledby="proximas">
        <h2 id="proximas" className="text-xl font-semibold">
          Próximas
        </h2>
        {upcoming.length ? (
          <ul className="space-y-3">
            {upcoming.map((appointment) => (
              <li key={appointment.id}>
                <AppointmentCard appointment={appointment} cancellable />
              </li>
            ))}
          </ul>
        ) : (
          <Alert>No tienes citas próximas.</Alert>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="historial">
        <h2 id="historial" className="text-xl font-semibold">
          Historial
        </h2>
        {history.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {history.map((appointment) => (
              <li key={appointment.id}>
                <AppointmentCard appointment={appointment} />
              </li>
            ))}
          </ul>
        ) : (
          <Alert>Aquí aparecerán tus citas pasadas y las fotos de tus cortes.</Alert>
        )}
      </section>
    </div>
  )
}

function AppointmentCard({ appointment, cancellable = false }) {
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)

  const cancel = useMutation({
    mutationFn: () => appointmentsApi.cancel(appointment.id),
    onSuccess: () => {
      toast.success('Cita cancelada')
      queryClient.invalidateQueries({ queryKey: queryKeys.myAppointments })
      queryClient.invalidateQueries({ queryKey: ['availability'] })
    },
  })

  const canCancel = hoursUntil(appointment.date, appointment.timeSlot) > CANCELLATION_WINDOW_HOURS

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-semibold">{appointment.service.name}</p>
          <p className="text-sm text-muted">
            {formatLongDate(appointment.date)} · {formatTime(appointment.timeSlot)}
          </p>
          <p className="text-sm text-muted">con {appointment.barber.name}</p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      {appointment.result?.imageUrl && (
        <img
          src={optimizedImageUrl(appointment.result.imageUrl, { width: 800, height: 800 })}
          alt={`Resultado de ${appointment.service.name}`}
          loading="lazy"
          className="aspect-square w-full rounded-control object-cover"
        />
      )}

      {appointment.status === 'COMPLETED' && <ReviewForm appointment={appointment} />}

      {cancellable &&
        (canCancel ? (
          <div className="space-y-3">
            {cancel.error && <Alert tone="error">{cancel.error.message}</Alert>}
            {confirming ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm">¿Cancelar esta cita?</span>
                <Button variant="danger" loading={cancel.isPending} onClick={() => cancel.mutate()}>
                  Sí, cancelar
                </Button>
                <Button variant="ghost" onClick={() => setConfirming(false)}>
                  No
                </Button>
              </div>
            ) : (
              <Button variant="danger" onClick={() => setConfirming(true)}>
                Cancelar cita
              </Button>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted">
            Ya no es posible cancelar: faltan menos de {CANCELLATION_WINDOW_HOURS} horas.
          </p>
        ))}
    </Card>
  )
}
