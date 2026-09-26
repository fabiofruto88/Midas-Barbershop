import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useBarbers, useServices } from '../hooks/useCatalog'
import { useBookingStore } from '../store/bookingStore'
import { formatLongDate, formatPrice, formatTime, businessToday } from '../lib/format'
import { barberPortrait } from '../lib/barberPortrait'
import ServiceList from '../components/ServiceList'
import Step from '../components/booking/Step'
import DateTimePicker from '../components/booking/DateTimePicker'
import ConfirmStep from '../components/booking/ConfirmStep'
import Alert from '../components/ui/Alert'
import SelectableCard from '../components/ui/SelectableCard'
import { PageSpinner } from '../components/ui/Spinner'

export default function BookingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: services } = useServices()
  const { data: barbers, isPending: loadingBarbers, error: barbersError } = useBarbers()
  const [slotTaken, setSlotTaken] = useState(false)

  const draft = useBookingStore()
  const { serviceId, barberId, date, timeSlot, selectService, selectBarber, selectDate, selectTimeSlot, reset } = draft

  // Descarta del borrador guardado una fecha que ya pasó.
  useEffect(() => {
    if (date && date < businessToday()) selectDate(null)
  }, [date, selectDate])

  const service = services?.find((item) => item.id === serviceId)
  const barber = barbers?.find((item) => item.id === barberId)

  const handleBooked = (appointment) => {
    reset()
    navigate('/reservar/confirmada', { state: { appointment, service, barber }, replace: true })
  }

  const chooseTime = useCallback(
    (slot) => {
      if (slot) setSlotTaken(false)
      selectTimeSlot(slot)
    },
    [selectTimeSlot]
  )

  const handleSlotTaken = () => {
    selectTimeSlot(null)
    setSlotTaken(true)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Reserva tu cita</h1>
        <p className="text-muted">Cada servicio dura 1 hora.</p>
      </header>

      <Step number={1} title="Servicio" summary={service && `${service.name} · ${formatPrice(service.price)}`}>
        <ServiceList
          renderItem={(item) => (
            <SelectableCard selected={item.id === serviceId} onSelect={() => selectService(item.id)} className="w-full">
              <div className="flex items-start justify-between gap-4">
                <span className="font-medium">{item.name}</span>
                <span className="shrink-0 text-sm font-semibold text-brand">{formatPrice(item.price)}</span>
              </div>
              {item.description && <p className="mt-1 text-sm text-muted">{item.description}</p>}
            </SelectableCard>
          )}
        />
      </Step>

      <Step number={2} title="Barbero" summary={barber?.name} locked={!service}>
        {loadingBarbers ? (
          <PageSpinner />
        ) : barbersError ? (
          <Alert tone="error">{barbersError.message}</Alert>
        ) : !barbers.length ? (
          <Alert>Todavía no hay barberos disponibles.</Alert>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {barbers.map((item) => (
              <SelectableCard key={item.id} selected={item.id === barberId} onSelect={() => selectBarber(item.id)}>
                <span className="flex items-center gap-3">
                  <img
                    src={barberPortrait(item, barbers.indexOf(item), { width: 80, height: 80 })}
                    alt=""
                    className="size-10 shrink-0 rounded-full object-cover"
                  />
                  <span className="font-medium">{item.name}</span>
                </span>
              </SelectableCard>
            ))}
          </div>
        )}
      </Step>

      <Step
        number={3}
        title="Fecha y hora"
        summary={date && timeSlot && `${formatLongDate(date)} · ${formatTime(timeSlot)}`}
        locked={!service || !barber}
      >
        {slotTaken && (
          <Alert tone="error">Ese horario acaba de ser reservado por otra persona. Elige otro, por favor.</Alert>
        )}
        <DateTimePicker
          barberId={barberId}
          date={date}
          timeSlot={timeSlot}
          onDateChange={selectDate}
          onTimeChange={chooseTime}
        />
      </Step>

      <Step number={4} title="Confirmar" locked={!service || !barber || !date || !timeSlot}>
        <ConfirmStep user={user} draft={draft} onBooked={handleBooked} onSlotTaken={handleSlotTaken} />
      </Step>
    </div>
  )
}
