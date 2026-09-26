const { z, uuid, hourTime } = require('../utils/validators');

const daySchedule = z
  .strictObject({
    dayOfWeek: z
      .number({ error: 'dayOfWeek debe ser un número.' })
      .int()
      .min(1, 'dayOfWeek va de 1 (Lunes) a 7 (Domingo).')
      .max(7, 'dayOfWeek va de 1 (Lunes) a 7 (Domingo).'),
    startTime: hourTime,
    endTime: hourTime,
  })
  .refine((day) => day.startTime < day.endTime, {
    message: 'La hora de inicio debe ser anterior a la hora de fin.',
    path: ['endTime'],
  });

// Reemplaza el horario semanal completo. Un día ausente = el barbero no trabaja ese día.
const setAvailabilityBody = z.strictObject({
  schedule: z
    .array(daySchedule)
    .max(7)
    .refine(
      (days) => new Set(days.map((day) => day.dayOfWeek)).size === days.length,
      'Cada día de la semana solo puede aparecer una vez.'
    ),
});

const barberIdParam = z.object({ barberId: uuid('barberId') });

module.exports = { setAvailabilityBody, barberIdParam };
