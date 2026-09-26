import { useState } from 'react'
import { toast } from 'sonner'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { useAuth, useRegister } from '../hooks/useAuth'
import { rules, serverFieldErrors, validateForm } from '../lib/validation'
import { safeNext } from '../lib/safeNext'
import AuthCard from '../components/AuthCard'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'

const schema = { name: rules.name, email: rules.email, phone: rules.optionalPhone, password: rules.password }

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = safeNext(searchParams.get('next'))
  const { user } = useAuth()
  const register = useRegister()

  const [values, setValues] = useState({ name: '', email: '', phone: '', password: '' })
  const [errors, setErrors] = useState({})

  if (user && !register.isSuccess) return <Navigate to={next} replace />

  const update = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()
    const found = validateForm(values, schema)
    setErrors(found)
    if (Object.keys(found).length) return

    const payload = { name: values.name.trim(), email: values.email.trim(), password: values.password }
    if (values.phone.trim()) payload.phone = values.phone.trim()

    register.mutate(payload, {
      onSuccess: (created) => {
        toast.success('¡Cuenta creada con éxito!', { description: `Bienvenido a Midas, ${created.name}.` })
        navigate(next, { replace: true })
      },
      onError: (error) => setErrors(serverFieldErrors(error)),
    })
  }

  return (
    <AuthCard
      title="Crear cuenta"
      subtitle="Guarda tu historial y reserva más rápido."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-brand hover:underline">
            Ingresa
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Nombre" autoComplete="name" value={values.name} onChange={update('name')} error={errors.name} />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={update('email')}
          error={errors.email}
        />
        <Field
          label="Teléfono (opcional)"
          type="tel"
          autoComplete="tel"
          placeholder="+573001234567"
          value={values.phone}
          onChange={update('phone')}
          error={errors.phone}
        />
        <Field
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          hint="Mínimo 8 caracteres."
          value={values.password}
          onChange={update('password')}
          error={errors.password}
        />
        {register.error && !register.error.details && <Alert tone="error">{register.error.message}</Alert>}
        <Button type="submit" loading={register.isPending} className="w-full">
          Crear cuenta
        </Button>
      </form>
    </AuthCard>
  )
}
