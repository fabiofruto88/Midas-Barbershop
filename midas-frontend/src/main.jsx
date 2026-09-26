import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { MotionConfig } from 'motion/react'
import './index.css'
import router from './router'
import { queryClient } from './lib/queryClient'
import { registerServiceWorker } from './hooks/usePushNotifications'
import AppToaster from './components/ui/AppToaster'

registerServiceWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* Respeta prefers-reduced-motion: sin desplazamientos, solo opacidad. */}
      <MotionConfig reducedMotion="user">
        <RouterProvider router={router} />
        <AppToaster />
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
)
