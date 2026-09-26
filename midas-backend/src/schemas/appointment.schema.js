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

// Importe ≥ 0 con máximo 2 decimales y dentro de Decimal(10, 2).
const money = (label) =>
  z.coerce
    .number({ error: `${label} debe ser un número.` })
    .min(0, `${label} no puede ser negativo.`)
    .max(99999999.99, `${label} es demasiado alto.`)
    .refine((value) => Number.isInteger(Number((value * 100).toFixed(6))), `${label} admite como máximo 2 decimales.`);

// Cierre de la cita: todo opcional; sin importe se cobra el precio de lista. null borra el campo.
const completeBody = z.strictObject({
  chargedAmount: money('El importe cobrado').optional(),
  tipAmount: money('La propina').optional(),
  paymentMethod: z
    .enum(['CASH', 'CARD', 'TRANSFER'], { error: 'El método de pago no es válido.' })
    .nullable()
    .optional(),
  priceNote: z
    .string()
    .trim()
    .max(200, 'El motivo no puede superar los 200 caracteres.')
    .nullable()
    .optional()
    .transform((value) => (value === undefined ? undefined : value || null)),
});

// Corrección del cobro de una cita ya completada.
const chargeBody = completeBody.refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  'Debes enviar al menos un campo para actualizar.'
);

module.exports = {
  availabilityQuery,
  createAppointmentBody,
  agendaQuery,
  resultBody,
  completeBody,
  chargeBody,
  appointmentIdParam: idParam,
};
