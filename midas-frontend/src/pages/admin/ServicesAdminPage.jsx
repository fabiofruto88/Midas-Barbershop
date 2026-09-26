import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../services/midas'
import { queryKeys } from '../../lib/queryClient'
import { formatPrice } from '../../lib/format'
import { serverFieldErrors } from '../../lib/validation'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Field from '../../components/ui/Field'
import { PageSpinner } from '../../components/ui/Spinner'

const ADMIN_SERVICES = ['services', 'admin']
const emptyForm = { name: '', description: '', price: '' }

const validate = ({ name, price }) => {
  const errors = {}
  if (name.trim().length < 2) errors.name = 'El nombre debe tener al menos 2 caracteres.'
  if (!(Number(price) > 0)) errors.price = 'El precio debe ser mayor que 0.'
  else if (!/^\d+(\.\d{1,2})?$/.test(String(price).trim())) errors.price = 'Máximo 2 decimales.'
  return errors
}

const toPayload = ({ name, description, price }) => ({
  name: name.trim(),
  description: description.trim() || null,
  price: Number(price),
})

export default function ServicesAdminPage() {
  const { data: services, isPending, error } = useQuery({ queryKey: ADMIN_SERVICES, queryFn: adminApi.services })
  const [editingId, setEditingId] = useState(null)

  if (isPending) return <PageSpinner />
  if (error) return <Alert tone="error">{error.message}</Alert>

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <section className="space-y-3" aria-labelledby="lista-servicios">
        <h2 id="lista-servicios" className="text-lg font-semibold">
          Catálogo ({services.length})
        </h2>
        {services.length === 0 && <Alert>Aún no hay servicios. Crea el primero.</Alert>}
        <ul className="space-y-3">
          {services.map((service) => (
            <li key={service.id}>
              {editingId === service.id ? (
                <ServiceForm service={service} onDone={() => setEditingId(null)} />
              ) : (
                <ServiceRow service={service} onEdit={() => setEditingId(service.id)} />
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3" aria-labelledby="nuevo-servicio">
        <h2 id="nuevo-servicio" className="text-lg font-semibold">
          Nuevo servicio
        </h2>
        <ServiceForm />
      </section>
    </div>
  )
}

function useInvalidateServices() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ADMIN_SERVICES })
    queryClient.invalidateQueries({ queryKey: queryKeys.services, exact: true })
  }
}

function ServiceRow({ service, onEdit }) {
  const invalidate = useInvalidateServices()
  const toggle = useMutation({
    mutationFn: () => adminApi.updateService(service.id, { isActive: !service.isActive }),
    onSuccess: invalidate,
  })

  return (
    <Card className={`flex flex-wrap items-start gap-4 ${service.isActive ? '' : 'opacity-60'}`}>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-semibold">
          {service.name}
          {!service.isActive && <span className="ml-2 text-xs font-normal text-muted">(inactivo)</span>}
        </p>
        {service.description && <p className="text-sm text-muted">{service.description}</p>}
        <p className="text-sm font-semibold text-brand">{formatPrice(service.price)}</p>
        <Alert tone="error">{toggle.error?.message}</Alert>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onEdit}>
          Editar
        </Button>
        <Button variant={service.isActive ? 'ghost' : 'secondary'} loading={toggle.isPending} onClick={() => toggle.mutate()}>
          {service.isActive ? 'Desactivar' : 'Activar'}
        </Button>
      </div>
    </Card>
  )
}

// Crea (sin `service`) o edita un servicio. La duración no se edita: es fija a 60 minutos.
function ServiceForm({ service, onDone }) {
  const invalidate = useInvalidateServices()
  const [values, setValues] = useState(
    service ? { name: service.name, description: service.description ?? '', price: String(Number(service.price)) } : emptyForm
  )
  const [errors, setErrors] = useState({})

  const save = useMutation({
    mutationFn: (payload) => (service ? adminApi.updateService(service.id, payload) : adminApi.createService(payload)),
    onSuccess: () => {
      invalidate()
      if (service) onDone()
      else setValues(emptyForm)
    },
    onError: (error) => setErrors(serverFieldErrors(error)),
  })

  const update = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) return
    const payload = toPayload(values)
    if (!service && payload.description === null) delete payload.description
    save.mutate(payload)
  }

  return (
    <Card as="form" onSubmit={submit} noValidate className="space-y-4">
      <Field label="Nombre" value={values.name} onChange={update('name')} error={errors.name} />
      <Field label="Descripción (opcional)" value={values.description} onChange={update('description')} error={errors.description} />
      <Field
        label="Precio (COP)"
        inputMode="decimal"
        value={values.price}
        onChange={update('price')}
        error={errors.price}
        hint="Duración fija: 60 minutos."
      />
      {save.error && !save.error.details && <Alert tone="error">{save.error.message}</Alert>}
      {!service && save.isSuccess && <Alert tone="success">Servicio creado.</Alert>}
      <div className="flex gap-2">
        <Button type="submit" loading={save.isPending}>
          {service ? 'Guardar' : 'Crear servicio'}
        </Button>
        {service && (
          <Button variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
        )}
      </div>
    </Card>
  )
}
