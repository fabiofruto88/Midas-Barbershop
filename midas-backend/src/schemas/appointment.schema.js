const { z, uuid, name, phone, email, hourTime, dateOnly, idParam } = require('../utils/validators');

const availabilityQuery = z.object({
  barberId: uuid('barberId'),
  date: dateOnly,
});

// Los datos de invitado solo son obligatorios si no hay sesión de cliente (se valida en el servicio).
const createAppointmentBody = z.strictObject({
  barberId: uuid('barberId'),
  serviceId: uuid('serviceId'),
  date: dateOnly,
  timeSlot: hourTime,
  guestName: name.optional(),
  guestPhone: phone.optional(),
  guestEmail: email.optional(),
});

const agendaQuery = z.object({
  date: dateOnly,
  barberId: uuid('barberId').optional(),
});

// Campos de texto del multipart de resultados (la imagen la valida el middleware de subida).
const resultBody = z.strictObject({
  notes: z
    .string()
    .trim()
    .max(500, 'Las notas no pueden superar los 500 caracteres.')
    .optional()
    .transform((value) => value || undefined),
});

module.exports = { availabilityQuery, createAppointmentBody, agendaQuery, resultBody, appointmentIdParam: idParam };
