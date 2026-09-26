import { NavLink, Outlet } from 'react-router'

const tabClass = ({ isActive }) =>
  `rounded-control px-4 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand text-on-brand' : 'text-muted hover:text-text'
  }`

export default function AdminLayout() {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">Administración</h1>
        <nav className="flex gap-1 rounded-card border border-border bg-surface p-1" aria-label="Secciones">
          <NavLink to="/admin/servicios" className={tabClass}>
            Servicios
          </NavLink>
          <NavLink to="/admin/equipo" className={tabClass}>
            Equipo
          </NavLink>
          <NavLink to="/admin/galeria" className={tabClass}>
            Galería
          </NavLink>
        </nav>
      </header>
      <Outlet />
    </div>
  )
}
