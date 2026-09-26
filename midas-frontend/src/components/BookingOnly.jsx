import { Navigate, Outlet } from 'react-router'
import { useBookingAccess } from '../hooks/useAuth'
import { PageSpinner } from './ui/Spinner'

// Rutas de reserva: solo invitados y clientes. El personal va a su panel.
export default function BookingOnly() {
  const { staffHome, isPending } = useBookingAccess()
  if (isPending) return <PageSpinner />
  if (staffHome) return <Navigate to={staffHome.to} replace />
  return <Outlet />
}
