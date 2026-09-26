const config = require('../config/env');

// Todas las fechas/horas de agenda ("YYYY-MM-DD" + "HH:mm") son hora local de la barbería.
// Para compararlas se representan como "reloj de pared" en un Date UTC: así la zona
// horaria del servidor no influye.

const HOUR_MS = 60 * 60 * 1000;

const wallClock = (date, time = '00:00') => new Date(`${date}T${time}:00Z`);

// Hora actual de la barbería como reloj de pared.
const nowInBusinessZone = (now = new Date()) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: config.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map(({ type, value }) => [type, value])
  );
  return new Date(
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`
  );
};

const toDateString = (date) => date.toISOString().slice(0, 10);

// 1 = Lunes ... 7 = Domingo (convención de BarberAvailability.dayOfWeek).
const isoDayOfWeek = (date) => {
  const day = wallClock(date).getUTCDay();
  return day === 0 ? 7 : day;
};

// Bloques de 1 hora entre inicio (incluido) y fin (excluido): "10:00"-"13:00" → 10, 11, 12.
const hourlySlots = (startTime, endTime) => {
  const start = Number(startTime.slice(0, 2));
  const end = Number(endTime.slice(0, 2));
  return Array.from({ length: Math.max(end - start, 0) }, (_, i) => `${String(start + i).padStart(2, '0')}:00`);
};

const hoursUntil = (date, time, now = nowInBusinessZone()) => (wallClock(date, time) - now) / HOUR_MS;

module.exports = { wallClock, nowInBusinessZone, toDateString, isoDayOfWeek, hourlySlots, hoursUntil };
