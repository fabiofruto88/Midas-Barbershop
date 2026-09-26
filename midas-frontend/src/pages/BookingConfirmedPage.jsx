import { useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { formatLongDate, formatPrice, formatTime } from '../lib/format'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function BookingConfirmedPage() {
  const { state } = useLocation()
  const [copied, setCopied] = useState(false)

  if (!state?.appointment) return <Navigate to="/reservar" replace />
  const { appointment, service, barber } = state

  // El token va en el fragmento (#): el navegador nunca lo envía al servidor.
  const cancelUrl = appointment.guestToken
    ? `${window.location.origin}/cancelar/${appointment.id}#${appointment.guestToken}`
    : null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cancelUrl)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-8 text-center">
      <div className="space-y-2">
        <p aria-hidden className="text-4xl text-brand">✓</p>
        <h1 className="text-3xl font-bold">¡Cita reservada!</h1>
        <p className="text-muted">Te esperamos. Llega 5 minutos antes.</p>
      </div>

      <Card as="dl" className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-left text-sm">
        <dt className="text-muted">Servicio</dt>
        <dd className="font-medium">
          {service?.name ?? '—'} {service && <span className="text-muted">· {formatPrice(service.price)}</span>}
        </dd>
        <dt className="text-muted">Barbero</dt>
        <dd className="font-medium">{barber?.name ?? '—'}</dd>
        <dt className="text-muted">Fecha</dt>
        <dd className="font-medium">{formatLongDate(appointment.date)}</dd>
        <dt className="text-muted">Hora</dt>
        <dd className="font-medium">{formatTime(appointment.timeSlot)}</dd>
      </Card>

      {cancelUrl ? (
        <div className="space-y-3 text-left">
          <Alert>
            Guarda este enlace: es la única forma de cancelar tu cita sin cuenta (hasta 5 horas antes).
          </Alert>
          <div className="flex gap-2">
            <input
              readOnly
              value={cancelUrl}
              aria-label="Enlace de cancelación"
              onFocus={(event) => event.target.select()}
              className="min-w-0 flex-1 rounded-control border border-border bg-surface-2 px-3 py-2 text-xs text-muted"
            />
            <Button variant="secondary" onClick={copy}>
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>
        </div>
      ) : (
        <Button to="/mis-citas" variant="secondary">
          Ver mis citas
        </Button>
      )}

      <Button to="/" variant="ghost">
        Volver al inicio
      </Button>
    </div>
  )
}
