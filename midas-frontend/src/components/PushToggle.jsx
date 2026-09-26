import { usePushNotifications } from '../hooks/usePushNotifications'
import Alert from './ui/Alert'
import Button from './ui/Button'

// Tarjeta para activar/desactivar los recordatorios push (15 minutos antes de cada cita).
export default function PushToggle() {
  const { status, error, subscribe, unsubscribe } = usePushNotifications()

  if (status === 'unsupported') return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface px-5 py-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">Recordatorios</p>
        <p className="text-xs text-muted">
          {status === 'subscribed'
            ? 'Te avisaremos 15 minutos antes de cada cita en este dispositivo.'
            : status === 'denied'
              ? 'Las notificaciones están bloqueadas en tu navegador. Actívalas desde la configuración del sitio.'
              : 'Recibe un aviso 15 minutos antes de cada cita.'}
        </p>
      </div>
      {status === 'subscribed' ? (
        <Button variant="ghost" onClick={unsubscribe}>
          Desactivar
        </Button>
      ) : (
        status !== 'denied' && (
          <Button variant="secondary" loading={status === 'loading'} onClick={subscribe}>
            Activar
          </Button>
        )
      )}
      {error && (
        <div className="w-full">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
    </div>
  )
}
