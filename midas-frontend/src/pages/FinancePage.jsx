import { useState } from 'react'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi, financeApi } from '../services/midas'
import { useAuth } from '../hooks/useAuth'
import { useBarbers } from '../hooks/useCatalog'
import { queryKeys } from '../lib/queryClient'
import { formatLongDate, formatPrice, formatTime, parseDate, toDateString, businessToday } from '../lib/format'
import { paymentLabel } from '../lib/payments'
import ChargeForm from '../components/agenda/ChargeForm'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { PageSpinner } from '../components/ui/Spinner'

const periods = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
]

const shiftPeriod = (period, date, step) => {
  const next = parseDate(date)
  if (period === 'day') next.setDate(next.getDate() + step)
  if (period === 'week') next.setDate(next.getDate() + 7 * step)
  if (period === 'month') next.setMonth(next.getMonth() + step, 1) // día 1: evita saltos 31 → mes corto
  return toDateString(next)
}

const dayMonth = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' })
const monthYear = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' })
const weekday = new Intl.DateTimeFormat('es-CO', { weekday: 'short' })
const clean = (text) => text.replace('.', '')

const periodTitle = (period, date, range) => {
  if (period === 'day') return formatLongDate(date)
  if (period === 'week') return `Semana del ${clean(dayMonth.format(parseDate(range.from)))} al ${clean(dayMonth.format(parseDate(range.to)))}`
  const text = monthYear.format(parseDate(date))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const pointLabel = (period, key) => {
  if (period === 'day') return formatTime(key)
  const date = parseDate(key)
  return `${clean(weekday.format(date))} ${clean(dayMonth.format(date))}`
}

// Etiqueta corta del eje: hora, día de la semana o número de día (en el mes, uno de cada 5).
const axisLabel = (period, key, index) => {
  if (period === 'day') return key.slice(0, 2) + 'h'
  const date = parseDate(key)
  if (period === 'week') return clean(weekday.format(date))
  return index === 0 || (index + 1) % 5 === 0 ? String(date.getDate()) : ''
}

function Change({ value }) {
  if (value === null || value === undefined) return <span className="text-muted">Sin datos del periodo anterior</span>
  const tone = value > 0 ? 'text-success' : value < 0 ? 'text-danger' : 'text-muted'
  return (
    <span className={tone}>
      {value > 0 ? '▲' : value < 0 ? '▼' : '='} {Math.abs(value)} % vs. periodo anterior
    </span>
  )
}

function Kpi({ label, value, detail }) {
  return (
    <Card className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="font-display text-2xl font-semibold text-text">{value}</p>
      {detail && <p className="text-xs">{detail}</p>}
    </Card>
  )
}

// Gráfica de barras de una sola serie (total cobrado). La lectura del punto activo va arriba.
function RevenueChart({ period, series }) {
  const [active, setActive] = useState(null)
  const max = Math.max(...series.map((point) => point.total), 0)
  const point = active === null ? null : series[active]

  if (!series.length) return null

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Ingresos {period === 'day' ? 'por hora' : 'por día'}</h2>
        <p className="min-h-5 text-sm text-muted" aria-live="polite">
          {point
            ? `${pointLabel(period, point.key)} · ${point.services} ${point.services === 1 ? 'servicio' : 'servicios'} · ${formatPrice(point.total)}`
            : 'Pasa el cursor por una barra para ver el detalle'}
        </p>
      </div>
      <div className="flex h-44 items-end gap-0.5 border-b border-line" onMouseLeave={() => setActive(null)}>
        {series.map((item, index) => (
          <button
            key={item.key}
            type="button"
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onBlur={() => setActive(null)}
            aria-label={`${pointLabel(period, item.key)}: ${formatPrice(item.total)}`}
            className="group flex h-full min-w-0 flex-1 items-end focus:outline-none"
          >
            <span
              className={`block w-full transition-colors ${
                active === index ? 'bg-brand-strong' : 'bg-brand/80 group-focus-visible:bg-brand-strong'
              }`}
              style={{ height: max ? `${(item.total / max) * 100}%` : 0 }}
            />
          </button>
        ))}
      </div>
      <div className="flex gap-0.5 text-[10px] text-muted" aria-hidden>
        {series.map((item, index) => (
          <span key={item.key} className="min-w-0 flex-1 truncate text-center">
            {axisLabel(period, item.key, index)}
          </span>
        ))}
      </div>
    </Card>
  )
}

function ShareList({ title, rows }) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  return (
    <Card className="space-y-4">
      <h2 className="font-semibold">{title}</h2>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.key} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span>
                {row.label} <span className="text-muted">· {row.count}</span>
              </span>
              <span className="font-semibold">{formatPrice(row.amount)}</span>
            </div>
            <div className="h-1.5 bg-surface-2">
              <div className="h-full bg-brand/80" style={{ width: total ? `${(row.amount / total) * 100}%` : 0 }} />
            </div>
            {row.detail && <p className="text-xs text-muted">{row.detail}</p>}
          </li>
        ))}
      </ul>
    </Card>
  )
}

function EntryItem({ entry, showBarber }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const difference = entry.chargedAmount - entry.listPrice

  const update = useMutation({
    mutationFn: (charge) => appointmentsApi.updateCharge(entry.id, charge),
    onSuccess: () => {
      toast.success('Cobro corregido')
      setEditing(false)
      queryClient.invalidateQueries({ queryKey: ['finance'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })

  return (
    <li className="space-y-3 border-b border-border py-3 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">
            {entry.service.name}
            {difference !== 0 && (
              <span
                className={`ml-2 px-1.5 py-0.5 text-xs font-semibold ${
                  difference > 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                }`}
              >
                {difference > 0 ? '+' : '−'}
                {formatPrice(Math.abs(difference))}
              </span>
            )}
          </p>
          <p className="text-sm text-muted">
            {pointLabel('week', entry.date)} · {formatTime(entry.timeSlot)}
            {entry.clientName && ` · ${entry.clientName}`}
            {showBarber && ` · con ${entry.barber.name}`}
          </p>
          <p className="text-xs text-muted">
            {paymentLabel(entry.paymentMethod)}
            {entry.priceNote && ` · ${entry.priceNote}`}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold">{formatPrice(entry.chargedAmount)}</p>
          {entry.tipAmount > 0 && <p className="text-xs text-muted">+ {formatPrice(entry.tipAmount)} propina</p>}
          {!editing && (
            <button type="button" onClick={() => setEditing(true)} className="hit-area text-xs text-brand hover:underline">
              Corregir
            </button>
          )}
        </div>
      </div>
      {editing && (
        <ChargeForm
          listPrice={entry.listPrice}
          initial={entry}
          title="Corregir cobro"
          submitLabel="Guardar"
          loading={update.isPending}
          error={update.error}
          onSubmit={(charge) => update.mutate(charge)}
          onCancel={() => setEditing(false)}
        />
      )}
    </li>
  )
}

// Finanzas del barbero: lo generado por día, semana o mes (el admin puede elegir barbero).
export default function FinancePage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const today = businessToday()
  const [period, setPeriod] = useState('day')
  const [date, setDate] = useState(today)
  const [barberId, setBarberId] = useState('')
  const { data: barbers } = useBarbers()

  const { data, isPending, error } = useQuery({
    queryKey: queryKeys.finance(period, date, barberId || undefined),
    queryFn: () => financeApi.summary({ period, date, barberId }),
    placeholderData: (previous) => previous,
  })

  const isCurrent = data ? today >= data.range.from && today <= data.range.to : false

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Finanzas</h1>
          <p className="text-muted">{data ? periodTitle(data.period, data.date, data.range) : ' '}</p>
        </div>
        <Button to="/agenda" variant="secondary">
          Volver a la agenda
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-2" role="group" aria-label="Periodo">
          {periods.map(({ id, label }) => (
            <Button
              key={id}
              size="sm"
              variant={period === id ? 'primary' : 'secondary'}
              aria-pressed={period === id}
              onClick={() => setPeriod(id)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setDate(shiftPeriod(period, date, -1))} aria-label="Periodo anterior">
            ←
          </Button>
          <Button variant={isCurrent ? 'primary' : 'secondary'} onClick={() => setDate(today)}>
            Hoy
          </Button>
          <Button variant="secondary" onClick={() => setDate(shiftPeriod(period, date, 1))} aria-label="Periodo siguiente">
            →
          </Button>
        </div>
        {isAdmin && (
          <select
            value={barberId}
            onChange={(event) => setBarberId(event.target.value)}
            aria-label="Filtrar por barbero"
            className="rounded-control border border-border bg-surface-2 px-3 py-2 text-sm"
          >
            <option value="">Toda la barbería</option>
            {barbers?.map((barber) => (
              <option key={barber.id} value={barber.id}>
                {barber.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {isPending ? (
        <PageSpinner />
      ) : error ? (
        <Alert tone="error">{error.message}</Alert>
      ) : (
        // Periodo de la respuesta (no del selector): al cambiarlo se muestran los datos previos hasta que llegan los nuevos.
        <FinanceSummary data={data} period={data.period} showBarber={isAdmin && !barberId} />
      )}
    </div>
  )
}

function FinanceSummary({ data, period, showBarber }) {
  const { totals, previous, upcoming } = data

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total generado" value={formatPrice(totals.total)} detail={<Change value={previous.change.total} />} />
        <Kpi
          label="Servicios"
          value={totals.services}
          detail={<Change value={previous.change.services} />}
        />
        <Kpi label="Ticket medio" value={formatPrice(totals.averageTicket)} detail={<span className="text-muted">Sin propinas</span>} />
        <Kpi
          label="Propinas"
          value={formatPrice(totals.tips)}
          detail={<span className="text-muted">Servicios: {formatPrice(totals.revenue)}</span>}
        />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
        <p>
          Ajuste vs. precio fijo:{' '}
          <span className={totals.adjustment > 0 ? 'text-success' : totals.adjustment < 0 ? 'text-danger' : 'text-text'}>
            {totals.adjustment > 0 ? '+' : totals.adjustment < 0 ? '−' : ''}
            {formatPrice(Math.abs(totals.adjustment))}
          </span>{' '}
          ({totals.adjustedUp} al alza · {totals.adjustedDown} a la baja)
        </p>
        {upcoming.count > 0 && (
          <p>
            Pendientes: {upcoming.count} {upcoming.count === 1 ? 'cita' : 'citas'} · previsto {formatPrice(upcoming.expected)}
          </p>
        )}
        {data.cancelled > 0 && (
          <p>
            Canceladas: {data.cancelled}
          </p>
        )}
      </div>

      {totals.services === 0 ? (
        <Alert>No hay servicios completados en este periodo.</Alert>
      ) : (
        <>
          <RevenueChart period={period} series={data.series} />

          <div className="grid gap-4 lg:grid-cols-2">
            <ShareList
              title="Por servicio"
              rows={data.byService.map((service) => ({
                key: service.serviceId,
                label: service.name,
                count: service.count,
                amount: service.revenue,
                detail: `Precio medio cobrado: ${formatPrice(service.averagePrice)}`,
              }))}
            />
            <ShareList
              title="Por método de pago"
              rows={data.byPaymentMethod.map((method) => ({
                key: method.method,
                label: paymentLabel(method.method),
                count: method.count,
                amount: method.amount,
              }))}
            />
          </div>

          <Card className="space-y-2">
            <h2 className="font-semibold">Detalle de servicios</h2>
            <ul>
              {data.entries.map((entry) => (
                <EntryItem key={entry.id} entry={entry} showBarber={showBarber} />
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  )
}
