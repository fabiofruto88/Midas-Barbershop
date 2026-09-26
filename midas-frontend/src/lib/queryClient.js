import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // El catálogo cambia poco: se cachea para no golpear el servidor en cada navegación.
      staleTime: 60 * 1000,
      retry: (failureCount, error) => error?.status >= 500 && failureCount < 2,
      refetchOnWindowFocus: false,
    },
  },
})

export const queryKeys = {
  me: ['me'],
  services: ['services'],
  barbers: ['barbers'],
  availability: (barberId, date) => ['availability', barberId, date],
  myAppointments: ['appointments', 'me'],
  agenda: (date, barberId) => ['appointments', 'agenda', date, barberId ?? 'all'],
  myAvailability: ['availability', 'me'],
  publishedResults: ['results', 'public'],
  allResults: ['results', 'all'],
  publicReviews: ['reviews', 'public'],
  allReviews: ['reviews', 'all'],
  finance: (period, date, barberId) => ['finance', period, date, barberId ?? 'me'],
}
