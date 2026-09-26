const tones = {
  error: 'border-danger/40 bg-danger/10 text-danger',
  success: 'border-success/40 bg-success/10 text-success',
  info: 'border-border bg-surface-2 text-muted',
}

export default function Alert({ tone = 'info', children }) {
  if (!children) return null
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-control border px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  )
}
