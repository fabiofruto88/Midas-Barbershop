// Solo permite redirecciones internas ("/ruta"), nunca a otro dominio ("//evil.com", "https://...").
// Página de inicio según el rol cuando no hay un ?next= explícito.
export const homeFor = (user) => (user?.role === 'ADMIN' ? '/admin' : user?.role === 'BARBER' ? '/agenda' : '/')

export const safeNext =(value, fallback = '/') =>
  value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : fallback
