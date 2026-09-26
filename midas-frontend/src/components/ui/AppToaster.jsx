import { Toaster } from 'sonner'

// Snackbars de la app (Sonner). Se monta una sola vez en main.jsx; desde cualquier parte:
//   import { toast } from 'sonner'
//   toast.success('Cuenta creada', { description: '…' })
// Colores tomados de los tokens de index.css para que encaje con el diseño dorado/oscuro.
export default function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      theme="dark"
      richColors
      closeButton
      duration={4000}
      offset={24}
      mobileOffset={16}
      style={{
        '--normal-bg': 'var(--color-card)',
        '--normal-text': 'var(--color-text)',
        '--normal-border': 'var(--color-line)',
        '--success-bg': 'var(--color-card)',
        '--success-text': 'var(--color-brand)',
        '--success-border': 'var(--color-brand-deep)',
        '--error-bg': 'var(--color-card)',
        '--error-text': 'var(--color-danger)',
        '--error-border': 'rgb(248 113 113 / 0.4)',
        '--border-radius': '4px',
      }}
      toastOptions={{
        style: { fontFamily: 'var(--font-sans)' },
        classNames: { description: '!text-muted' },
      }}
    />
  )
}
