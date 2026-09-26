import { useQuery } from '@tanstack/react-query'
import { appointmentsApi, catalogApi, shopApi } from '../services/midas'
import { queryKeys } from '../lib/queryClient'

export const useServices = () =>
  useQuery({ queryKey: queryKeys.services, queryFn: catalogApi.services, staleTime: 5 * 60 * 1000 })

export const useBarbers = () =>
  useQuery({ queryKey: queryKeys.barbers, queryFn: catalogApi.barbers, staleTime: 5 * 60 * 1000 })

// La disponibilidad cambia rápido (reservas de otros y el paso del tiempo): caché corta y
// refresco periódico, para que una página abierta no siga ofreciendo horas que ya pasaron.
export const availabilityQueryOptions = {
  staleTime: 15 * 1000,
  refetchInterval: 60 * 1000,
  refetchOnWindowFocus: true,
}

export const useAvailability = (barberId, date) =>
  useQuery({
    queryKey: queryKeys.availability(barberId, date),
    queryFn: () => appointmentsApi.availability({ barberId, date }),
    enabled: Boolean(barberId && date),
    ...availabilityQueryOptions,
  })

// Tienda: el catálogo de productos cambia poco, pero los precios deben verse al día en el carrito.
export const useShopProducts = ({ enabled = true } = {}) =>
  useQuery({ queryKey: queryKeys.shopProducts, queryFn: shopApi.products, staleTime: 60 * 1000, enabled })

export const useShopCategories = () =>
  useQuery({ queryKey: queryKeys.shopCategories, queryFn: shopApi.categories, staleTime: 5 * 60 * 1000 })
