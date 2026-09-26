import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { barberApi } from '../services/midas'
import { queryKeys } from '../lib/queryClient'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { PageSpinner } from '../components/ui/Spinner'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const HOURS = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`)

const toForm = (schedule) =>
  DAYS.map((_, index) => {
    const day = schedule.find((item) => item.dayOfWeek === index + 1)
    return { enabled: Boolean(day), startTime: day?.startTime ?? '10:00', endTime: day?.endTime ?? '20:00' }
  })

export default function SchedulePage() {
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({ queryKey: queryKeys.myAvailability, queryFn: barberApi.myAvailability })
  // Ediciones locales; mientras no haya cambios se muestra lo guardado en el servidor.
  const [edited, setEdited] = useState(null)
  const days = edited ?? (data ? toForm(data.schedule) : null)

  const save = useMutation({
    mutationFn: barberApi.setMyAvailability,
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.myAvailability, saved)
      queryClient.invalidateQueries({ queryKey: ['availability'] })
    },
  })

  if (isPending || (!days && !error)) return <PageSpinner />
  if (error) return <Alert tone="error">{error.message}</Alert>

  const update = (index, patch) => {
    save.reset()
    setEdited(days.map((day, i) => (i === index ? { ...day, ...patch } : day)))
  }

  const invalidDay = days.findIndex((day) => day.enabled && day.startTime >= day.endTime)

  const submit = (event) => {
    event.preventDefault()
    if (invalidDay !== -1) return
    save.mutate(
      days.flatMap((day, index) =>
        day.enabled ? [{ dayOfWeek: index + 1, startTime: day.startTime, endTime: day.endTime }] : []
      )
    )
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Mi horario</h1>
        <p className="text-muted">Define los días y horas en que atiendes. Las citas son bloques de 1 hora.</p>
      </header>

      <Card className="divide-y divide-border p-0!">
        {days.map((day, index) => (
          <fieldset key={DAYS[index]} className="flex flex-wrap items-center gap-3 px-5 py-4">
            <legend className="sr-only">{DAYS[index]}</legend>
            <label className="flex w-36 items-center gap-3 font-medium">
              <input
                type="checkbox"
                checked={day.enabled}
                onChange={(event) => update(index, { enabled: event.target.checked })}
                className="size-4 accent-brand"
              />
              {DAYS[index]}
            </label>
            {day.enabled ? (
              <div className="flex items-center gap-2 text-sm">
                <HourSelect
                  label={`Inicio ${DAYS[index]}`}
                  value={day.startTime}
                  onChange={(startTime) => update(index, { startTime })}
                />
                <span className="text-muted">a</span>
                <HourSelect
                  label={`Fin ${DAYS[index]}`}
                  value={day.endTime}
                  onChange={(endTime) => update(index, { endTime })}
                />
              </div>
            ) : (
              <span className="text-sm text-muted">No atiende</span>
            )}
          </fieldset>
        ))}
      </Card>

      {invalidDay !== -1 && (
        <Alert tone="error">El {DAYS[invalidDay].toLowerCase()} la hora de inicio debe ser anterior a la de fin.</Alert>
      )}
      <Alert tone="error">{save.error?.message}</Alert>
      {save.isSuccess && <Alert tone="success">Horario guardado.</Alert>}

      <Button type="submit" loading={save.isPending} disabled={invalidDay !== -1}>
        Guardar horario
      </Button>
    </form>
  )
}

function HourSelect({ label, value, onChange }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      className="rounded-control border border-border bg-surface-2 px-3 py-2"
    >
      {HOURS.map((hour) => (
        <option key={hour} value={hour}>
          {hour}
        </option>
      ))}
    </select>
  )
}
