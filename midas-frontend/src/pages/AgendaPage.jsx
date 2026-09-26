import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi } from '../services/midas'
import { useAuth } from '../hooks/useAuth'
import { useBarbers } from '../hooks/useCatalog'
import { queryKeys } from '../lib/queryClient'
import { formatLongDate, formatPrice, formatTime, hoursUntil, parseDate, toDateString } from '../lib/format'
import ResultUploader from '../components/agenda/ResultUploader'
import StatusBadge from '../components/StatusBadge'
import PushToggle from '../components/PushToggle'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { PageSpinner } from '../components/ui/Spinner'

const shiftDate = (date, days) => {
  const next = parseDate(date)
  next.setDate(next.getDate() + days)
  return toDateString(next)
}

export default function AgendaPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const today = toDateString(new Date())
  const [date, setDate] = useState(today)
  const [barberId, setBarberId] = useState('')
  const { data: barbers } = useBarbers()

  const { data, isPending, error } = useQuery({
    queryKey: queryKeys.agenda(date, barberId),
    queryFn: () => appointmentsApi.agenda({ date, barberId }),
    staleTime: 15 * 1000,
    refetchInterval: 60 * 1000, // nuevas reservas aparecen solas
  })

  const appointments = data?.appointments ?? []
  const active = appointments.filter((item) => item.status !== 'CANCELLED')

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted">
            {formatLongDate(date)} · {active.length} {active.length === 1 ? 'cita' : 'citas'}
          </p>
        </div>
        {!isAdmin && (
          <Button to="/agenda/horario" variant="secondary">
            Mi horario
          </Button>
        )}
      </header>

      {!isAdmin && <PushToggle />}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => setDate(shiftDate(date, -1))} aria-label="Día anterior">
          ←
        </Button>
        <Button variant={date === today ? 'primary' : 'secondary'} onClick={() => setDate(today)}>
          Hoy
        </Button>
        <Button variant="secondary" onClick={() => setDate(shiftDate(date, 1))} aria-label="Día siguiente">
          →
        </Button>
        <input
          type="date"
          value={date}
          onChange={(event) => event.target.value && setDate(event.target.value)}
          aria-label="Elegir fecha"
          className="rounded-control border border-border bg-surface-2 px-3 py-2 text-sm"
        />
        {isAdmin && (
          <select
            value={barberId}
            onChange={(event) => setBarberId(event.target.value)}
            aria-label="Filtrar por barbero"
            className="rounded-control border border-border bg-surface-2 px-3 py-2 text-sm"
          >
            <option value="">Todos los barberos</option>
            {barbers?.map((barber) => (
              <option key={barber.id} value={barber.id}>
                {barber.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {isPending ? (
        <PageSpinner />
      ) : error ? (
        <Alert tone="error">{error.message}</Alert>
      ) : appointments.length === 0 ? (
        <Alert>No hay citas para este día.</Alert>
      ) : (
        <ul className="space-y-3">
          {appointments.map((appointment) => (
            <li key={appointment.id}>
              <AgendaItem appointment={appointment} showBarber={isAdmin && !barberId} canUpload={!isAdmin} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AgendaItem({ appointment, showBarber, canUpload }) {
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['appointments'] })
    queryClient.invalidateQueries({ queryKey: ['availability'] })
  }

  const complete = useMutation({ mutationFn: () => appointmentsApi.complete(appointment.id), onSuccess: refresh })
  const cancel = useMutation({ mutationFn: () => appointmentsApi.cancel(appointment.id), onSuccess: refresh })

  const customer = appointment.client ?? {
    name: appointment.guestName,
    phone: appointment.guestPhone,
    email: appointment.guestEmail,
  }
  const isGuest = !appointment.client
  const started = hoursUntil(appointment.date, appointment.timeSlot) <= 0
  const isPending = appointment.status === 'PENDING'
  const actionError = complete.error ?? cancel.error

  return (
    <Card className={`space-y-4 ${appointment.status === 'CANCELLED' ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-start gap-4">
        <p className="w-28 shrink-0 whitespace-nowrap text-lg font-semibold text-brand">{formatTime(appointment.timeSlot)}</p>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-semibold">
            {customer.name}
            {isGuest && <span className="ml-2 text-xs font-normal text-muted">(invitado)</span>}
          </p>
          <p className="text-sm text-muted">
            {appointment.service.name} · {formatPrice(appointment.service.price)}
            {showBarber && ` · con ${appointment.barber.name}`}
          </p>
          {customer.phone && (
            <a href={`tel:${customer.phone}`} className="text-sm text-brand hover:underline">
              {customer.phone}
            </a>
          )}
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      {appointment.result && (
        <div className="flex items-start gap-4">
          <img
            src={appointment.result.imageUrl}
            alt={`Resultado de ${customer.name}`}
            loading="lazy"
            className="size-24 rounded-control object-cover"
          />
          {appointment.result.notes && <p className="text-sm text-muted">{appointment.result.notes}</p>}
        </div>
      )}

      <Alert tone="error">{actionError?.message}</Alert>

      {uploading ? (
        <ResultUploader
          appointmentId={appointment.id}
          onCancel={() => setUploading(false)}
          onUploaded={() => {
            setUploading(false)
            refresh()
          }}
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {isPending && started && (
            <Button variant="secondary" loading={complete.isPending} onClick={() => complete.mutate()}>
              Marcar completada
            </Button>
          )}
          {canUpload && appointment.status !== 'CANCELLED' && started && (
            <Button variant="secondary" onClick={() => setUploading(true)}>
              {appointment.result ? 'Cambiar foto' : 'Subir foto'}
            </Button>
          )}
          {isPending &&
            (confirmCancel ? (
              <>
                <Button variant="danger" loading={cancel.isPending} onClick={() => cancel.mutate()}>
                  Confirmar cancelación
                </Button>
                <Button variant="ghost" onClick={() => setConfirmCancel(false)}>
                  No
                </Button>
              </>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmCancel(true)}>
                Cancelar cita
              </Button>
            ))}
        </div>
      )}
    </Card>
  )
}
