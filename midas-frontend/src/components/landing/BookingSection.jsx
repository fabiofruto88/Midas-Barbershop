import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useQueries } from '@tanstack/react-query'
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
import { availabilityQueryOptions, useBarbers, useServices } from '../../hooks/useCatalog'
import { useBookingStore } from '../../store/bookingStore'
import { appointmentsApi } from '../../services/midas'
import { queryKeys } from '../../lib/queryClient'
import { formatPrice, nextDays, parseDate, toDateString, businessToday } from '../../lib/format'
import { barberProfiles } from '../../content/landing'
import { barberPortrait } from '../../lib/barberPortrait'
import { distance, duration, ease, exitDuration, spring, useMotionPrefs } from '../../lib/motion'
import iconRadioChecked from '../../assets/landing/icon-radio-checked.svg'
import iconRadio from '../../assets/landing/icon-radio.svg'
import SectionHeading, { Accent } from './SectionHeading'
import Icon from './Icon'
import Reveal from './Reveal'

const DAYS_SHOWN = 5

const label = 'text-[9px] leading-3 font-bold tracking-[0.2em] text-muted uppercase'
const option = 'pressable relative border text-[9px] leading-3 font-bold uppercase'
const optionIdle = 'border-line/30 bg-card text-text hover:border-brand/50'

// Próximos días hábiles (el domingo es solo para citas VIP).
const bookableDays = () =>
  nextDays(DAYS_SHOWN + 2)
    .filter((day) => day.getDay() !== 0)
    .slice(0, DAYS_SHOWN)

const weekday = (date) =>
  new Intl.DateTimeFormat('es-CO', { weekday: 'short' }).format(date).replace('.', '').slice(0, 3)
const month = (date, style) => new Intl.DateTimeFormat('es-CO', { month: style }).format(date).replace('.', '')
// Formatos del diseño: "NOVIEMBRE 2024", "15 Nov", "12:00 PM".
const monthYear = (date) => `${month(date, 'long')} ${date.getFullYear()}`
const dayMonth = (value) => {
  const date = parseDate(value)
  const short = month(date, 'short')
  return `${date.getDate()} ${short.charAt(0).toUpperCase()}${short.slice(1)}`
}
const slotTime = (slot) => {
  const [hours, minutes] = slot.split(':').map(Number)
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(2000, 0, 1, hours, minutes))
}

// Fondo de la opción elegida: se desliza de una opción a otra en lugar de saltar (layoutId).
function SelectedFill({ id, className }) {
  return <motion.span layoutId={id} aria-hidden className={`absolute inset-0 ${className}`} transition={spring.layout} />
}

function Skeleton({ className }) {
  return <span aria-hidden className={`block animate-pulse bg-surface-2/60 motion-reduce:animate-none ${className}`} />
}

function BarberCard({ barber, index, selected, onSelect }) {
  const profile = barberProfiles[index % barberProfiles.length]
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`pressable flex w-full items-center gap-4 border bg-card p-4 text-left ${
        selected ? 'border-brand' : 'border-line/30 hover:border-brand/40'
      }`}
    >
      <span
        aria-hidden
        className={`relative h-20 w-16 shrink-0 overflow-hidden border bg-surface-2 p-px ${
          selected ? 'border-brand/40' : 'border-line/40'
        }`}
      >
        <img src={barberPortrait(barber, index)} alt="" className="size-full object-cover grayscale" />
        <span
          className={`absolute inset-0 transition-colors duration-200 ${selected ? 'bg-brand/10' : 'bg-black/30'}`}
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center justify-between gap-2">
          <span
            className={`truncate font-display text-xl leading-7 font-medium uppercase transition-colors duration-200 ${
              selected ? 'text-brand' : 'text-text'
            }`}
          >
            {barber.name}
          </span>
          <Icon src={selected ? iconRadioChecked : iconRadio} className="size-[16.667px]" />
        </span>
        <span
          className={`text-[9px] leading-3 font-bold tracking-[0.1em] uppercase ${
            selected ? 'text-brand-soft' : 'text-muted'
          }`}
        >
          {barber.specialty ?? profile.specialty}
        </span>
        <span className="pt-0.5 text-xs leading-[18px] tracking-[0.02em] text-muted">{barber.bio ?? profile.bio}</span>
      </span>
    </button>
  )
}

function BarberList({ barbers, isPending, error, barberId, onSelect }) {
  if (isPending)
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Cargando barberos">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-[116px] w-full border border-line/20" />
        ))}
      </div>
    )
  if (error) return <p role="alert" className="border border-danger/40 p-4 text-xs text-danger">{error.message}</p>
  if (!barbers.length)
    return <p className="border border-line/30 bg-card p-4 text-xs text-muted">Todavía no hay barberos disponibles.</p>

  return (
    <div role="group" aria-label="Maestro barbero" className="flex flex-col gap-4">
      {barbers.map((barber, index) => (
        <BarberCard
          key={barber.id}
          barber={barber}
          index={index}
          selected={barber.id === barberId}
          onSelect={() => onSelect(barber.id)}
        />
      ))}
    </div>
  )
}

export default function BookingSection() {
  const navigate = useNavigate()
  const sectionRef = useRef(null)
  const { parallax } = useMotionPrefs()
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const haloShift = useTransform(
    scrollYProgress,
    (progress) => `translate3d(0, ${(progress * 2 - 1) * distance.halo}px, 0)`,
  )
  const { data: barbers, isPending: loadingBarbers, error: barbersError } = useBarbers()
  const { data: services, isPending: loadingServices, error: servicesError } = useServices()
  const { serviceId, barberId, date, timeSlot, selectService, selectBarber, selectDate, selectTimeSlot } =
    useBookingStore()

  const days = useMemo(() => bookableDays(), [])
  const dayValues = useMemo(() => days.map(toDateString), [days])
  const today = businessToday()

  // Valores por defecto (el diseño muestra un barbero, servicio y día activos).
  useEffect(() => {
    if (barbers?.length && !barbers.some((item) => item.id === barberId)) selectBarber(barbers[0].id)
  }, [barbers, barberId, selectBarber])
  useEffect(() => {
    if (services?.length && !services.some((item) => item.id === serviceId)) selectService(services[0].id)
  }, [services, serviceId, selectService])
  useEffect(() => {
    if (!date || !dayValues.includes(date)) selectDate(dayValues[0])
  }, [date, dayValues, selectDate])

  const availability = useQueries({
    queries: dayValues.map((value) => ({
      queryKey: queryKeys.availability(barberId, value),
      queryFn: () => appointmentsApi.availability({ barberId, date: value }),
      enabled: Boolean(barberId),
      ...availabilityQueryOptions,
    })),
  })

  const selectedIndex = dayValues.indexOf(date)
  const selectedDay = availability[selectedIndex]
  const slots = selectedDay?.data?.availableSlots ?? []
  const todaySlots = availability[dayValues.indexOf(today)]?.data?.availableSlots

  // Si la hora elegida deja de estar disponible (ya pasó o la tomó otra persona), se descarta.
  const loadedSlots = selectedDay?.data?.availableSlots
  useEffect(() => {
    if (timeSlot && loadedSlots && !loadedSlots.includes(timeSlot)) selectTimeSlot(null)
  }, [timeSlot, loadedSlots, selectTimeSlot])

  const barber = barbers?.find((item) => item.id === barberId)
  const service = services?.find((item) => item.id === serviceId)
  const ready = Boolean(barber && service && date && timeSlot)

  const summary = [
    barber?.name,
    service && `${service.name} (${formatPrice(service.price)})`,
    date && `${dayMonth(date)}${timeSlot ? `, ${slotTime(timeSlot)}` : ''}`,
  ]
    .filter(Boolean)
    .join(' • ')

  const confirm = () => {
    if (ready) navigate('/reservar')
  }

  return (
    <section
      ref={sectionRef}
      id="barberos"
      aria-labelledby="barberos-title"
      className="relative overflow-clip bg-bg py-20 lg:py-28"
    >
      {/* Halo dorado con parallax sutil (solo desktop); -translate-1/2 usa `translate` y se compone con él. */}
      <motion.div
        aria-hidden
        style={parallax ? { transform: haloShift } : undefined}
        className="absolute top-1/2 left-1/2 h-[500px] w-[900px] -translate-1/2 rounded-full bg-brand/5 blur-[70px]"
      />
      <div className="relative mx-auto flex max-w-[1440px] flex-col items-center gap-10 px-4 sm:px-8 xl:px-16">
        <Reveal className="w-full max-w-[768px] pt-1.5">
          <SectionHeading
            id="barberos-title"
            align="center"
            eyebrow="Maestría & reserva online"
            eyebrowTracking="tracking-[0.3em]"
            title={
              <>
                Los artistas detrás <Accent className="text-brand">del toque</Accent>
              </>
            }
            titleClassName="text-[32px] leading-10 tracking-[0.025em] sm:text-[42px]"
            description="Seleccione a su artesano de cabecera, elija el ritual deseado y fije su momento sagrado de desconexión sin intermediarios."
          />
        </Reveal>

        <div className="grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <Reveal className="flex flex-col gap-4 lg:col-span-5">
            <h3 className="text-[9px] leading-3 font-bold tracking-[0.25em] text-muted uppercase">
              1. Seleccione su maestro barbero
            </h3>
            <BarberList
              barbers={barbers}
              isPending={loadingBarbers}
              error={barbersError}
              barberId={barberId}
              onSelect={selectBarber}
            />
          </Reveal>

          <Reveal
            id="reservas"
            delay={0.08}
            className="flex flex-col gap-6 border border-brand/30 bg-surface p-5 shadow-[0px_16px_48px_0px_rgba(0,0,0,0.85),0px_0px_2px_0px_rgba(212,175,55,0.3)] sm:p-10 lg:col-span-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/30 pb-4">
              <div className="flex flex-col gap-[4.5px] pt-[7.5px] uppercase">
                <p className="text-[9px] leading-3 font-bold tracking-[0.25em] text-brand">Terminal de reserva directa</p>
                <h3 className="font-display text-xl leading-7 font-medium text-text">Configure su asiento</h3>
              </div>
              {todaySlots && (
                <p className="flex items-center gap-1.5 border border-brand/20 bg-bg px-3 py-1 text-[9px] leading-3 font-bold tracking-[0.1em] text-brand uppercase">
                  <span
                    aria-hidden
                    className={`size-2 rounded-full ${todaySlots.length ? 'bg-success' : 'bg-muted'}`}
                  />
                  {todaySlots.length ? 'Disponible hoy' : 'Sin cupos hoy'}
                </p>
              )}
            </div>

            <div role="group" aria-labelledby="paso-servicio" className="flex flex-col gap-1">
              <p id="paso-servicio" className={label}>
                2. Servicio a disfrutar
              </p>
              {loadingServices ? (
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                  {[0, 1, 2, 3].map((key) => (
                    <Skeleton key={key} className="h-9" />
                  ))}
                </div>
              ) : servicesError ? (
                <p role="alert" className="text-xs text-danger">{servicesError.message}</p>
              ) : !services.length ? (
                <p className="border border-line/30 bg-card px-4 py-[11px] text-xs text-muted">
                  Todavía no hay servicios disponibles.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                  {services.map((item) => {
                    const selected = item.id === serviceId
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => selectService(item.id)}
                        className={`${option} px-2 py-[11px] tracking-[0.05em] ${
                          selected ? 'border-brand text-on-brand' : optionIdle
                        }`}
                      >
                        {selected && <SelectedFill id="reserva-servicio" className="bg-brand" />}
                        <span className="relative">{item.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div role="group" aria-labelledby="paso-dia" className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p id="paso-dia" className={label}>
                  3. Día de audiencia
                </p>
                <p className="text-[9px] leading-3 font-bold tracking-[0.1em] text-brand-soft uppercase">
                  {monthYear(days[Math.max(selectedIndex, 0)])}
                </p>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {days.map((day, index) => {
                  const value = dayValues[index]
                  const selected = value === date
                  const count = availability[index]?.data?.availableSlots?.length
                  const note = value === today ? 'Hoy' : count === undefined ? '' : count ? `${count} libres` : 'Completo'
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${day.toLocaleDateString('es-CO', { dateStyle: 'full' })}${
                        count !== undefined ? `, ${count} horarios libres` : ''
                      }`}
                      onClick={() => selectDate(value)}
                      className={`pressable flex flex-col items-center text-center ${
                        selected ? 'border-2 border-brand bg-brand/10 p-2' : `border px-2 pt-2 pb-2.5 ${optionIdle}`
                      }`}
                    >
                      <span
                        className={`text-[9px] leading-3 font-bold tracking-[0.2em] uppercase ${
                          selected ? 'text-brand' : 'text-muted'
                        }`}
                      >
                        {weekday(day)}
                      </span>
                      <span
                        className={`font-display text-xl leading-7 ${
                          selected ? 'font-bold text-brand' : 'font-semibold text-text'
                        }`}
                      >
                        {day.getDate()}
                      </span>
                      <span
                        className={`min-h-3 text-[8px] leading-3 uppercase ${
                          selected ? 'font-bold text-brand' : count ? 'text-brand/70' : 'text-muted'
                        }`}
                      >
                        {note}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div role="group" aria-labelledby="paso-hora" className="flex flex-col gap-1 pb-4">
              <p id="paso-hora" className={label}>
                4. Hora preferida
              </p>
              <div aria-live="polite" className="min-h-9">
                {!barberId || (selectedDay?.isPending && !selectedDay?.error) ? (
                  <div className="grid grid-cols-3 gap-1 sm:grid-cols-5">
                    {[0, 1, 2, 3, 4].map((key) => (
                      <Skeleton key={key} className="h-9" />
                    ))}
                  </div>
                ) : selectedDay?.error ? (
                  <p role="alert" className="text-xs text-danger">{selectedDay.error.message}</p>
                ) : slots.length === 0 ? (
                  <p className="border border-line/30 bg-card px-4 py-[11px] text-xs text-muted">
                    No quedan horarios este día. Elija otra fecha.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-1 sm:grid-cols-5">
                    {slots.map((slot) => {
                      const selected = slot === timeSlot
                      return (
                        <button
                          key={slot}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => selectTimeSlot(slot)}
                          className={`${option} px-2 py-[11px] tracking-[0.2em] ${
                            selected ? 'border-brand text-on-brand drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]' : optionIdle
                          }`}
                        >
                          {selected && (
                            <SelectedFill id="reserva-hora" className="bg-linear-to-r from-brand-strong to-brand" />
                          )}
                          <span className="relative">{slotTime(slot)}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 border border-line/40 bg-bg p-4">
              <div className="flex flex-col gap-1 text-xs leading-[18px] tracking-[0.02em] sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <p className="shrink-0 text-muted">Resumen de Cita:</p>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={summary}
                    initial={{ opacity: 0, filter: 'blur(2px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, filter: 'blur(2px)', transition: { duration: exitDuration(duration.press), ease: ease.out } }}
                    transition={{ duration: duration.press, ease: ease.out }}
                    className="font-medium text-brand sm:text-right"
                  >
                    {summary || '—'}
                  </motion.p>
                </AnimatePresence>
              </div>
              <button
                type="button"
                onClick={confirm}
                disabled={!ready}
                className="pressable w-full bg-gold py-4 text-[13px] leading-4 font-bold tracking-[0.22em] text-on-brand uppercase drop-shadow-[0px_6px_12.5px_rgba(212,175,55,0.3)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirmar cita de oro
              </button>
              <p className="text-center text-[9px] leading-3 font-bold tracking-[0.1em] text-muted/70 uppercase">
                {ready
                  ? 'Confirmación instantánea enviada a su asistente o teléfono confidencial vía SMS encriptado.'
                  : 'Elija una hora para continuar con su reserva.'}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
