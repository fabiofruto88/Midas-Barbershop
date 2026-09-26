import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <section className="space-y-4 text-center">
      <h1 className="text-3xl font-bold">Página no encontrada</h1>
      <Link to="/" className="text-amber-400 hover:underline">
        Volver al inicio
      </Link>
    </section>
  )
}
