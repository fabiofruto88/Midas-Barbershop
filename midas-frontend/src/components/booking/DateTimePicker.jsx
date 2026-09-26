import { useEffect } from 'react'
import { useAvailability } from '../../hooks/useCatalog'
import { formatShortDate, formatTime, nextDays, toDateString } from '../../lib/format'
import Alert from '../ui/Alert'
import SelectableCard from '../ui/SelectableCard'
import Spinner from '../ui/Spinner'

const BOOKING_WINDOW_DAYS = 14

export default function DateTimePicker({ barberId, date, timeSlot, onDateChange, onTimeChange }) {
  // isPending (aún sin datos) y no isLoading: evita mostrar "no hay horarios" un instante antes de cargar.
  const { data, isPending, error } = useAvailability(barberId, date)
  const slots = data?.availableSlots ?? []

  // Si la hora elegida deja de estar disponible (ya pasó o la tomó otra persona), se descarta.
  useEffect(() => {
    if (timeSlot && data && !data.availableSlots.includes(timeSlot)) onTimeChange(null)
  }, [timeSlot, data, onTimeChange])

  return (
    <div className="space-y-5">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2" role="group" aria-label="Día">
        {nextDays(BOOKING_WINDOW_DAYS).map((day) => {
          const value = toDateString(day)
          const { weekday, day: dayNumber, month } = formatShortDate(day)
          return (
            <SelectableCard
              key={value}
              selected={value === date}
              onSelect={() => onDateChange(value)}
              className="flex w-16 shrink-0 flex-col items-center p-3! text-center"
              aria-label={day.toLocaleDateString('es-CO', { dateStyle: 'full' })}
            >
              <span className="text-xs capitalize text-muted">{weekday}</span>
              <span className="text-lg font-semibold">{dayNumber}</span>
              <span className="text-xs capitalize text-muted">{month}</span>
            </SelectableCard>
          )
        })}
      </div>

      {date && (
        <div aria-live="polite">
          {isPending && !error ? (
            <div className="flex justify-center py-6 text-brand">
              <Spinner />
            </div>
          ) : error ? (
            <Alert tone="error">{error.message}</Alert>
          ) : slots.length === 0 ? (
            <Alert>No hay horarios disponibles este día. Prueba con otra fecha.</Alert>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" role="group" aria-label="Hora">
              {slots.map((slot) => (
                <SelectableCard
                  key={slot}
                  selected={slot === timeSlot}
                  onSelect={() => onTimeChange(slot)}
                  className="p-3! text-center text-sm font-medium"
                >
                  {formatTime(slot)}
                </SelectableCard>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
