import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi, notificationsApi } from '../services/midas'
import { queryKeys } from '../lib/queryClient'

// Sesión actual. `user` es null si no hay sesión (401 no es un error aquí).
export function useAuth() {
  const query = useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      try {
        return await authApi.me()
      } catch (error) {
        if (error.status === 401) return null
        throw error
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  return { user: query.data ?? null, isPending: query.isPending }
}

// Inicio del personal: admin y barbero gestionan citas, no las reservan.
export const STAFF_HOME = {
  ADMIN: { to: '/admin', label: 'Administración' },
  BARBER: { to: '/agenda', label: 'Mi agenda' },
}

// Reservan los invitados (sin sesión) y los clientes. `staffHome` es el destino del personal.
export function useBookingAccess() {
  const { user, isPending } = useAuth()
  const staffHome = user ? STAFF_HOME[user.role] ?? null : null
  return { canBook: !staffHome, staffHome, isPending }
}

// Al cambiar de usuario se vacía toda la caché: agenda, horario y finanzas no llevan el usuario en
// la clave, y en un dispositivo compartido el siguiente vería (y podría guardar) los datos del anterior.
function useSessionMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (user) => {
      queryClient.clear()
      queryClient.setQueryData(queryKeys.me, user)
    },
  })
}

export const useLogin = () => useSessionMutation(authApi.login)
export const useRegister = () => useSessionMutation(authApi.register)

// Los recordatorios son de la persona, no del dispositivo: al salir se da de baja la suscripción
// para que el siguiente usuario no reciba avisos (con nombres de clientes) del anterior.
const dropPushSubscription = async () => {
  try {
    const registration = await navigator.serviceWorker?.getRegistration()
    const subscription = await registration?.pushManager?.getSubscription()
    if (!subscription) return
    await subscription.unsubscribe()
    await notificationsApi.unsubscribe()
  } catch {
    // Sin soporte o sin red: no debe impedir cerrar sesión.
  }
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await dropPushSubscription()
      return authApi.logout()
    },
    onSettled: () => {
      queryClient.clear()
      queryClient.setQueryData(queryKeys.me, null)
    },
  })
}
