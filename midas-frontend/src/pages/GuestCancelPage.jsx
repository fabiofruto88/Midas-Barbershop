import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useLocation, useParams } from 'react-router'
import { appointmentsApi } from '../services/midas'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

// Cancelación para invitados: /cancelar/:id#<guestToken>
export default function GuestCancelPage() {
  const { id } = useParams()
  const { hash } = useLocation()
  const token = hash.slice(1)

  const cancel = useMutation({
    mutationFn: () => appointmentsApi.cancel(id, token),
    onSuccess: () => toast.success('Cita cancelada'),
  })

  return (
    <div className="mx-auto max-w-md">
      <Card className="space-y-5 text-center">
        <h1 className="text-2xl font-bold">Cancelar cita</h1>

        {!token ? (
          <Alert tone="error">El enlace no es válido. Usa el enlace completo que recibiste al reservar.</Alert>
        ) : cancel.isSuccess ? (
          <>
            <Alert tone="success">Cita cancelada exitosamente.</Alert>
            <Button to="/reservar">Reservar otra cita</Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">
              Solo puedes cancelar hasta 5 horas antes de la cita. Esta acción no se puede deshacer.
            </p>
            {cancel.error && <Alert tone="error">{cancel.error.message}</Alert>}
            <Button variant="danger" loading={cancel.isPending} onClick={() => cancel.mutate()}>
              Sí, cancelar mi cita
            </Button>
          </>
        )}
      </Card>
    </div>
  )
}
