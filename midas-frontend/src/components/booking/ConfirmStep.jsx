import { useState } from 'react'
import { Link } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi } from '../../services/midas'
import { queryKeys } from '../../lib/queryClient'
import { serverFieldErrors, rules, validateForm } from '../../lib/validation'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import Field from '../ui/Field'

const guestSchema = { guestName: rules.name, guestPhone: rules.phone, guestEmail: rules.optionalEmail }

// Último paso: cliente con sesión confirma directamente; si no, reserva como invitado o inicia sesión.
export default function ConfirmStep({ user, draft, onBooked, onSlotTaken }) {
  const queryClient = useQueryClient()
  const [guest, setGuest] = useState({ guestName: '', guestPhone: '', guestEmail: '' })
  const [fieldErrors, setFieldErrors] = useState({})

  const isClient = user?.role === 'CLIENT'

  const booking = useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: (appointment) => {
      queryClient.invalidateQueries({ queryKey: ['availability'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.myAppointments })
      onBooked(appointment)
    },
    onError: (error) => {
      if (error.status === 409) {
        queryClient.invalidateQueries({ queryKey: queryKeys.availability(draft.barberId, draft.date) })
        onSlotTaken()
      }
      setFieldErrors(serverFieldErrors(error))
    },
  })

  const submit = (event) => {
    event.preventDefault()
    const { serviceId, barberId, date, timeSlot } = draft
    const payload = { serviceId, barberId, date, timeSlot }

    if (!isClient) {
      const errors = validateForm(guest, guestSchema)
      setFieldErrors(errors)
      if (Object.keys(errors).length) return
      payload.guestName = guest.guestName.trim()
      payload.guestPhone = guest.guestPhone.trim()
      if (guest.guestEmail.trim()) payload.guestEmail = guest.guestEmail.trim()
    }

    booking.mutate(payload)
  }

  const update = (field) => (event) => setGuest((current) => ({ ...current, [field]: event.target.value }))
  const next = encodeURIComponent('/reservar')

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {isClient ? (
        <p className="text-sm text-muted">
          Reservarás como <span className="font-medium text-text">{user.name}</span>.
        </p>
      ) : (
        <>
          {!user && (
            <Alert>
              ¿Tienes cuenta?{' '}
              <Link to={`/login?next=${next}`} className="font-medium text-brand hover:underline">
                Inicia sesión
              </Link>{' '}
              o{' '}
              <Link to={`/registro?next=${next}`} className="font-medium text-brand hover:underline">
                regístrate
              </Link>{' '}
              para ver tu historial. También puedes reservar como invitado:
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nombre"
              autoComplete="name"
              value={guest.guestName}
              onChange={update('guestName')}
              error={fieldErrors.guestName}
            />
            <Field
              label="Teléfono"
              type="tel"
              autoComplete="tel"
              placeholder="+573001234567"
              value={guest.guestPhone}
              onChange={update('guestPhone')}
              error={fieldErrors.guestPhone}
            />
            <Field
              label="Email (opcional)"
              type="email"
              autoComplete="email"
              className="sm:col-span-2"
              value={guest.guestEmail}
              onChange={update('guestEmail')}
              error={fieldErrors.guestEmail}
            />
          </div>
        </>
      )}

      {booking.error && !booking.error.details && <Alert tone="error">{booking.error.message}</Alert>}

      <Button type="submit" loading={booking.isPending} className="w-full sm:w-auto">
        Confirmar reserva
      </Button>
    </form>
  )
}
