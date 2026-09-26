import { useId, useState } from 'react'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../services/midas'
import { useAuth } from '../../hooks/useAuth'
import { useFilePreview } from '../../hooks/useFilePreview'
import { queryKeys } from '../../lib/queryClient'
import { rules, serverFieldErrors, validateForm } from '../../lib/validation'
import { ACCEPTED_IMAGES, imageFileError } from '../../lib/imageFile'
import { barberPortrait } from '../../lib/barberPortrait'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Field from '../../components/ui/Field'
import { PageSpinner } from '../../components/ui/Spinner'

const ROLE_LABELS = { ADMIN: 'Admin', BARBER: 'Barbero', CLIENT: 'Cliente' }
const USERS_KEY = ['users']
const emptyForm = { name: '', email: '', phone: '', password: '', role: 'BARBER' }
const schema = { name: rules.name, email: rules.email, phone: rules.optionalPhone, password: rules.password }

export default function TeamAdminPage() {
  const [role, setRole] = useState('BARBER')
  const { data: users, isPending, error } = useQuery({
    queryKey: [...USERS_KEY, role],
    queryFn: () => adminApi.users(role || undefined),
  })

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <section className="space-y-3" aria-labelledby="lista-equipo">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="lista-equipo" className="text-lg font-semibold">
            Usuarios
          </h2>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            aria-label="Filtrar por rol"
            className="rounded-control border border-border bg-surface-2 px-3 py-2 text-sm"
          >
            <option value="BARBER">Barberos</option>
            <option value="ADMIN">Administradores</option>
            <option value="CLIENT">Clientes</option>
            <option value="">Todos</option>
          </select>
        </div>

        {isPending ? (
          <PageSpinner />
        ) : error ? (
          <Alert tone="error">{error.message}</Alert>
        ) : users.length === 0 ? (
          <Alert>No hay usuarios con este rol.</Alert>
        ) : (
          <ul className="space-y-3">
            {users.map((user, index) => (
              <li key={user.id}>
                <UserRow user={user} index={index} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="nuevo-usuario">
        <h2 id="nuevo-usuario" className="text-lg font-semibold">
          Nueva cuenta
        </h2>
        <CreateUserForm />
      </section>
    </div>
  )
}

function useInvalidateTeam() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: USERS_KEY })
    queryClient.invalidateQueries({ queryKey: queryKeys.barbers })
  }
}

// Vista previa local de un archivo; la URL temporal se libera al cambiar de archivo o desmontar.
// Foto del barbero en su fila: cambiarla o volver a la foto por defecto.
function BarberPhoto({ user, index }) {
  const invalidate = useInvalidateTeam()
  const inputId = useId()
  const [error, setError] = useState(null)

  const upload = useMutation({
    mutationFn: (file) => adminApi.uploadAvatar(user.id, file),
    onSuccess: () => {
      toast.success('Foto actualizada', { description: user.name })
      invalidate()
    },
    onError: (err) => setError(err.message),
  })
  const remove = useMutation({
    mutationFn: () => adminApi.removeAvatar(user.id),
    onSuccess: () => {
      toast.success('Se usará la foto por defecto', { description: user.name })
      invalidate()
    },
    onError: (err) => setError(err.message),
  })

  const choose = (event) => {
    const file = event.target.files?.[0]
    event.target.value = '' // permite volver a elegir el mismo archivo
    if (!file) return
    const invalid = imageFileError(file)
    setError(invalid)
    if (!invalid) upload.mutate(file)
  }

  const busy = upload.isPending || remove.isPending

  return (
    <div className="flex items-center gap-3">
      <img
        src={barberPortrait(user, index, { width: 96, height: 120 })}
        alt={`Foto de ${user.name}`}
        className={`h-15 w-12 shrink-0 rounded-control object-cover ${busy ? 'opacity-50' : ''}`}
      />
      <div className="flex flex-col items-start gap-1">
        <label
          htmlFor={inputId}
          className={`cursor-pointer text-sm font-medium text-brand hover:underline has-focus-visible:outline-2 ${busy ? 'pointer-events-none opacity-50' : ''}`}
        >
          {upload.isPending ? 'Subiendo…' : user.avatarUrl ? 'Cambiar foto' : 'Subir foto'}
          <input id={inputId} type="file" accept={ACCEPTED_IMAGES.join(',')} onChange={choose} className="sr-only" />
        </label>
        {user.avatarUrl ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => remove.mutate()}
            className="text-xs text-muted hover:text-text disabled:opacity-50"
          >
            Usar foto por defecto
          </button>
        ) : (
          <span className="text-xs text-muted">Foto por defecto</span>
        )}
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    </div>
  )
}

function UserRow({ user, index }) {
  const { user: me } = useAuth()
  const invalidate = useInvalidateTeam()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isMe = me?.id === user.id

  const changeRole = useMutation({
    mutationFn: (role) => adminApi.updateUser(user.id, { role }),
    onSuccess: () => {
      toast.success('Rol actualizado', { description: user.name })
      invalidate()
    },
  })
  const remove = useMutation({
    mutationFn: () => adminApi.deleteUser(user.id),
    onSuccess: () => {
      toast.success('Cuenta eliminada', { description: user.name })
      invalidate()
    },
  })
  const actionError = changeRole.error ?? remove.error

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="font-semibold">
            {user.name} {isMe && <span className="text-xs font-normal text-muted">(tú)</span>}
          </p>
          <p className="truncate text-sm text-muted">{user.email}</p>
          {user.phone && <p className="text-sm text-muted">{user.phone}</p>}
        </div>
        {isMe ? (
          <span className="text-sm text-muted">{ROLE_LABELS[user.role]}</span>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={user.role}
              disabled={changeRole.isPending}
              onChange={(event) => changeRole.mutate(event.target.value)}
              aria-label={`Rol de ${user.name}`}
              className="rounded-control border border-border bg-surface-2 px-3 py-2 text-sm"
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {confirmDelete ? (
              <>
                <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate()}>
                  Confirmar
                </Button>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                  No
                </Button>
              </>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
                Eliminar
              </Button>
            )}
          </div>
        )}
      </div>
      {user.role === 'BARBER' && <BarberPhoto user={user} index={index} />}
      <Alert tone="error">{actionError?.message}</Alert>
    </Card>
  )
}

function CreateUserForm() {
  const invalidate = useInvalidateTeam()
  const photoId = useId()
  const [values, setValues] = useState(emptyForm)
  const [photo, setPhoto] = useState(null)
  const [photoInputKey, setPhotoInputKey] = useState(0)
  const [errors, setErrors] = useState({})
  const preview = useFilePreview(photo)

  // La foto es opcional y se sube después de crear la cuenta; si falla, la cuenta queda creada igualmente.
  const create = useMutation({
    mutationFn: async ({ payload, photo: file }) => {
      const created = await adminApi.createUser(payload)
      if (!file) return { created }
      try {
        await adminApi.uploadAvatar(created.id, file)
        return { created }
      } catch (photoError) {
        return { created, photoError }
      }
    },
    onSuccess: ({ created, photoError }) => {
      toast.success('Cuenta creada', { description: `${created.name} ya puede ingresar.` })
      if (photoError) {
        toast.warning('No se pudo subir la foto', {
          description: `${photoError.message} Puedes subirla desde la lista del equipo.`,
        })
      }
      invalidate()
      setValues(emptyForm)
      setPhoto(null)
      setPhotoInputKey((key) => key + 1) // limpia el archivo elegido en el input
    },
    onError: (error) => setErrors(serverFieldErrors(error)),
  })

  const choosePhoto = (event) => {
    const file = event.target.files?.[0] ?? null
    const invalid = file && imageFileError(file)
    setErrors((current) => ({ ...current, photo: invalid || undefined }))
    setPhoto(invalid ? null : file)
    if (invalid) event.target.value = ''
  }

  const update = (field) => (event) => {
    create.reset()
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  const submit = (event) => {
    event.preventDefault()
    const found = validateForm(values, schema)
    setErrors(found)
    if (Object.keys(found).length) return
    const payload = { name: values.name.trim(), email: values.email.trim(), password: values.password, role: values.role }
    if (values.phone.trim()) payload.phone = values.phone.trim()
    create.mutate({ payload, photo: values.role === 'BARBER' ? photo : null })
  }

  return (
    <Card as="form" onSubmit={submit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="nuevo-rol" className="block text-sm font-medium">
          Rol
        </label>
        <select
          id="nuevo-rol"
          value={values.role}
          onChange={update('role')}
          className="w-full rounded-control border border-border bg-surface-2 px-3.5 py-2.5 text-sm"
        >
          <option value="BARBER">Barbero</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </div>
      <Field label="Nombre" value={values.name} onChange={update('name')} error={errors.name} />
      <Field label="Email" type="email" value={values.email} onChange={update('email')} error={errors.email} />
      <Field label="Teléfono (opcional)" type="tel" value={values.phone} onChange={update('phone')} error={errors.phone} />
      <Field
        label="Contraseña inicial"
        type="password"
        autoComplete="new-password"
        hint="Mínimo 8 caracteres. Compártela de forma segura."
        value={values.password}
        onChange={update('password')}
        error={errors.password}
      />
      {values.role === 'BARBER' && (
        <div className="space-y-1.5">
          <label htmlFor={photoId} className="block text-sm font-medium">
            Foto del barbero (opcional)
          </label>
          <div className="flex items-center gap-3">
            {preview && <img src={preview} alt="Vista previa" className="h-15 w-12 shrink-0 rounded-control object-cover" />}
            <input
              key={photoInputKey}
              id={photoId}
              type="file"
              accept={ACCEPTED_IMAGES.join(',')}
              onChange={choosePhoto}
              className="block w-full text-sm text-muted file:mr-3 file:rounded-control file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-sm file:text-text"
            />
          </div>
          <p className={`text-xs ${errors.photo ? 'text-danger' : 'text-muted'}`}>
            {errors.photo ?? 'JPEG, PNG o WebP de hasta 5MB. Si no subes una, se usa la foto por defecto.'}
          </p>
        </div>
      )}
      {create.error && !create.error.details && <Alert tone="error">{create.error.message}</Alert>}
      <Button type="submit" loading={create.isPending} className="w-full">
        Crear cuenta
      </Button>
    </Card>
  )
}
