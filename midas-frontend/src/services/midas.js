import { api } from '../lib/api'

// Endpoints del backend (ver database_schema_and_api_contracts.md).
const imageForm = (file) => {
  const form = new FormData()
  form.append('image', file)
  return form
}

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
  uploadAvatar: (id, file) => api(`/users/${id}/avatar`, { method: 'POST', body: imageForm(file) }),
  removeAvatar: (id) => api(`/users/${id}/avatar`, { method: 'DELETE' }),
  products: () => api('/shop/products?includeHidden=true'),
  createCategory: (data) => api('/shop/categories', { method: 'POST', body: data }),
  updateCategory: (id, data) => api(`/shop/categories/${id}`, { method: 'PATCH', body: data }),
  deleteCategory: (id) => api(`/shop/categories/${id}`, { method: 'DELETE' }),
  createProduct: (data) => api('/shop/products', { method: 'POST', body: data }),
  updateProduct: (id, data) => api(`/shop/products/${id}`, { method: 'PATCH', body: data }),
  deleteProduct: (id) => api(`/shop/products/${id}`, { method: 'DELETE' }),
  uploadProductImage: (id, file) => api(`/shop/products/${id}/image`, { method: 'POST', body: imageForm(file) }),
  removeProductImage: (id) => api(`/shop/products/${id}/image`, { method: 'DELETE' }),
}

// Tienda pública: no requiere sesión.
export const shopApi = {
  categories: () => api('/shop/categories'),
  products: () => api('/shop/products'),
}

export const reviewsApi = {
  published: () => api('/reviews/public'),
  all: () => api('/reviews'),
  setVisible: (id, isVisible) => api(`/reviews/${id}`, { method: 'PATCH', body: { isVisible } }),
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
  // charge: { chargedAmount, tipAmount, paymentMethod, priceNote } (todo opcional).
  complete: (id, charge) => api(`/appointments/${id}/complete`, { method: 'PATCH', body: charge }),
  updateCharge: (id, charge) => api(`/appointments/${id}/charge`, { method: 'PATCH', body: charge }),
  review: (id, { rating, comment }) => api(`/appointments/${id}/review`, { method: 'PUT', body: { rating, comment } }),
  uploadResult: (id, { file, notes }) => {
    const form = imageForm(file)
    if (notes?.trim()) form.append('notes', notes.trim())
    return api(`/appointments/${id}/results`, { method: 'POST', body: form })
  },
}

export const financeApi = {
  summary: ({ period, date, barberId }) => api(`/finance/summary${query({ period, date, barberId })}`),
}
