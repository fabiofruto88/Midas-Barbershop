import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../services/midas'
import { useAuth } from '../../hooks/useAuth'
import { queryKeys } from '../../lib/queryClient'
import { rules, serverFieldErrors, validateForm } from '../../lib/validation'
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
            {users.map((user) => (
              <li key={user.id}>
                <UserRow user={user} />
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

function UserRow({ user }) {
  const { user: me } = useAuth()
  const invalidate = useInvalidateTeam()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isMe = me?.id === user.id

  const changeRole = useMutation({
    mutationFn: (role) => adminApi.updateUser(user.id, { role }),
    onSuccess: invalidate,
  })
  const remove = useMutation({ mutationFn: () => adminApi.deleteUser(user.id), onSuccess: invalidate })
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
      <Alert tone="error">{actionError?.message}</Alert>
    </Card>
  )
}

function CreateUserForm() {
  const invalidate = useInvalidateTeam()
  const [values, setValues] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const create = useMutation({
    mutationFn: adminApi.createUser,
    onSuccess: () => {
      invalidate()
      setValues(emptyForm)
    },
    onError: (error) => setErrors(serverFieldErrors(error)),
  })

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
    create.mutate(payload)
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
      {create.error && !create.error.details && <Alert tone="error">{create.error.message}</Alert>}
      {create.isSuccess && <Alert tone="success">Cuenta creada.</Alert>}
      <Button type="submit" loading={create.isPending} className="w-full">
        Crear cuenta
      </Button>
    </Card>
  )
}
