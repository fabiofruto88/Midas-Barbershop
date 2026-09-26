import { api } from '../lib/api'

// Endpoints del backend (ver database_schema_and_api_contracts.md).
const query = (params) => {
  const search = new URLSearchParams(Object.entries(params).filter(([, value]) => value))
  return search.size ? `?${search}` : ''
}

export const authApi = {
  me: () => api('/auth/me'),
  login: (credentials) => api('/auth/login', { method: 'POST', body: credentials }),
  register: (data) => api('/auth/register', { method: 'POST', body: data }),
  logout: () => api('/auth/logout', { method: 'POST' }),
}

export const catalogApi = {
  services: () => api('/services'),
  barbers: () => api('/barbers'),
}

export const adminApi = {
  services: () => api('/services?includeInactive=true'),
  createService: (data) => api('/services', { method: 'POST', body: data }),
  updateService: (id, data) => api(`/services/${id}`, { method: 'PATCH', body: data }),
  users: (role) => api(`/users${query({ role })}`),
  createUser: (data) => api('/users', { method: 'POST', body: data }),
  updateUser: (id, data) => api(`/users/${id}`, { method: 'PATCH', body: data }),
  deleteUser: (id) => api(`/users/${id}`, { method: 'DELETE' }),
}

export const resultsApi = {
  published: () => api('/results/public'),
  all: () => api('/results'),
  setPublished: (id, isPublished) => api(`/results/${id}`, { method: 'PATCH', body: { isPublished } }),
}

export const barberApi = {
  myAvailability: () => api('/barbers/me/availability'),
  setMyAvailability: (schedule) => api('/barbers/me/availability', { method: 'PUT', body: { schedule } }),
}

export const notificationsApi = {
  publicKey: () => api('/notifications/vapid-public-key'),
  subscribe: (subscription) => api('/notifications/subscribe', { method: 'POST', body: subscription }),
  unsubscribe: () => api('/notifications/subscribe', { method: 'DELETE' }),
}

export const appointmentsApi = {
  availability: ({ barberId, date }) => api(`/appointments/availability${query({ barberId, date })}`),
  create: (data) => api('/appointments', { method: 'POST', body: data }),
  cancel: (id, guestToken) =>
    api(`/appointments/${id}/cancel`, {
      method: 'PATCH',
      headers: guestToken ? { 'X-Guest-Token': guestToken } : undefined,
    }),
  mine: () => api('/appointments/me'),
  agenda: ({ date, barberId }) => api(`/appointments/agenda${query({ date, barberId })}`),
  complete: (id) => api(`/appointments/${id}/complete`, { method: 'PATCH' }),
  uploadResult: (id, { file, notes }) => {
    const form = new FormData()
    form.append('image', file)
    if (notes?.trim()) form.append('notes', notes.trim())
    return api(`/appointments/${id}/results`, { method: 'POST', body: form })
  },
}
