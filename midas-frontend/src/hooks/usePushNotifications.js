import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { notificationsApi } from '../services/midas'

const isSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

// Clave VAPID (base64url) → Uint8Array para pushManager.subscribe.
const toUint8Array = (base64url) => {
  const base64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
}

export const registerServiceWorker = () => {
  if (!isSupported()) return
  navigator.serviceWorker.register('/sw.js').catch((error) => console.error('No se pudo registrar el Service Worker', error))
}

// Estado: 'unsupported' | 'denied' | 'idle' | 'subscribed' | 'loading'
export function usePushNotifications() {
  const [status, setStatus] = useState(() => {
    if (!isSupported()) return 'unsupported'
    return Notification.permission === 'denied' ? 'denied' : 'loading'
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    if (status !== 'loading') return
    let active = true
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then(async (subscription) => {
        // Si el navegador ya está suscrito, se asocia al usuario actual (p. ej. tras cambiar de cuenta).
        if (subscription) await notificationsApi.subscribe(subscription.toJSON())
        if (active) setStatus(subscription ? 'subscribed' : 'idle')
      })
      .catch(() => active && setStatus('idle'))
    return () => {
      active = false
    }
  }, [status])

  const subscribe = useCallback(async () => {
    setError(null)
    setStatus('loading')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'idle')
        return
      }
      const { publicKey } = await notificationsApi.publicKey()
      const registration = await navigator.serviceWorker.ready
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toUint8Array(publicKey) }))
      await notificationsApi.subscribe(subscription.toJSON())
      setStatus('subscribed')
      toast.success('Recordatorios activados', { description: 'Te avisaremos 15 minutos antes de cada cita.' })
    } catch (caught) {
      // Los errores del navegador (DOMException) llegan en inglés; los de la API ya vienen en español.
      setError(
        caught instanceof DOMException
          ? 'Tu navegador no permitió activar las notificaciones en este dispositivo.'
          : caught.message || 'No se pudieron activar las notificaciones.'
      )
      setStatus('idle')
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    setError(null)
    setStatus('loading')
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      await subscription?.unsubscribe()
      await notificationsApi.unsubscribe()
      setStatus('idle')
      toast('Recordatorios desactivados')
    } catch (caught) {
      setError(caught.message || 'No se pudieron desactivar las notificaciones.')
      setStatus('subscribed')
    }
  }, [])

  return { status, error, subscribe, unsubscribe }
}
