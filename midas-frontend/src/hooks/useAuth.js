import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../services/midas'
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

function useSessionMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.me, user)
      queryClient.invalidateQueries({ queryKey: queryKeys.myAppointments })
    },
  })
}

export const useLogin = () => useSessionMutation(authApi.login)
export const useRegister = () => useSessionMutation(authApi.register)

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.setQueryData(queryKeys.me, null)
      queryClient.removeQueries({ queryKey: queryKeys.myAppointments })
    },
  })
}
