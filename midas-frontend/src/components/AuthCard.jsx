import Card from './ui/Card'

export default function AuthCard({ title, subtitle, footer, children }) {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="text-muted">{subtitle}</p>}
      </div>
      <Card className="space-y-5">{children}</Card>
      {footer && <p className="text-center text-sm text-muted">{footer}</p>}
    </div>
  )
}
