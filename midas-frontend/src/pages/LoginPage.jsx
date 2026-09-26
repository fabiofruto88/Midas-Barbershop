import { useState } from 'react'
import { toast } from 'sonner'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { useAuth, useLogin } from '../hooks/useAuth'
import { rules, validateForm } from '../lib/validation'
import { homeFor, safeNext } from '../lib/safeNext'
import AuthCard from '../components/AuthCard'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedNext = searchParams.get('next')
  const next = safeNext(requestedNext)
  const { user } = useAuth()
  const login = useLogin()

  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})

  if (user && !login.isSuccess) return <Navigate to={requestedNext ? next : homeFor(user)} replace />

  const update = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()
    const found = validateForm(values, { email: rules.email, password: rules.required })
    setErrors(found)
    if (Object.keys(found).length) return

    login.mutate(
      { email: values.email.trim(), password: values.password },
      {
        onSuccess: (loggedIn) => {
          toast.success(`Hola de nuevo, ${loggedIn.name}`)
          navigate(requestedNext ? next : homeFor(loggedIn), { replace: true })
        },
      }
    )
  }

  return (
    <AuthCard
      title="Ingresar"
      subtitle="Accede para ver y gestionar tus citas."
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to={`/registro?next=${encodeURIComponent(next)}`} className="font-medium text-brand hover:underline">
            Regístrate
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={update('email')}
          error={errors.email}
        />
        <Field
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={update('password')}
          error={errors.password}
        />
        {login.error && <Alert tone="error">{login.error.message}</Alert>}
        <Button type="submit" loading={login.isPending} className="w-full">
          Ingresar
        </Button>
      </form>
    </AuthCard>
  )
}
