// Solo permite redirecciones internas ("/ruta"), nunca a otro dominio ("//evil.com", "https://...").
// Página de inicio según el rol cuando no hay un ?next= explícito.
export const homeFor = (user) => (user?.role === 'BARBER' || user?.role === 'ADMIN' ? '/agenda' : '/')

export const safeNext =(value, fallback = '/') =>
  value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : fallback
