import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { PageSpinner } from './ui/Spinner'

// Protege rutas por sesión y, opcionalmente, por rol.
export default function RequireAuth({ roles }) {
  const { user, isPending } = useAuth()
  const location = useLocation()

  if (isPending) return <PageSpinner />
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />

  return <Outlet />
}
