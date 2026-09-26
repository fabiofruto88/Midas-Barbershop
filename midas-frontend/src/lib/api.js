// Cliente HTTP mínimo sobre fetch. La sesión viaja en la cookie HttpOnly (credentials: 'include'),
// nunca en localStorage.
import { queryClient, queryKeys } from './queryClient'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export async function api(path, { method = 'GET', body, headers } = {}) {
  // FormData (subida de archivos) se envía tal cual: el navegador pone el boundary del multipart.
  const isForm = body instanceof FormData
  const isJson = body !== undefined && !isForm

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: { ...(isJson && { 'Content-Type': 'application/json' }), ...headers },
      body: isJson ? JSON.stringify(body) : body,
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa tu conexión.')
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    // Sesión caducada: se olvida el usuario en caché para que la UI no siga actuando como si hubiera sesión
    // (p. ej. reservar como cliente sin enviar datos de invitado). /auth/* gestiona sus propios 401.
    if (response.status === 401 && !path.startsWith('/auth/')) queryClient.setQueryData(queryKeys.me, null)
    throw new ApiError(response.status, data?.error ?? 'Ocurrió un error inesperado.', data?.details)
  }
  return data
}
