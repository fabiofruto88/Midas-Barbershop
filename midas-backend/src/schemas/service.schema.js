const { z } = require('../utils/validators');

// Precio positivo con máximo 2 decimales y dentro de Decimal(10, 2).
const price = z.coerce
  .number({ error: 'El precio debe ser un número.' })
  .positive('El precio debe ser mayor que 0.')
  .max(99999999.99, 'El precio es demasiado alto.')
  // toFixed absorbe el error de coma flotante (19.99 * 100 = 1998.9999999999998).
  .refine((value) => Number.isInteger(Number((value * 100).toFixed(6))), 'El precio admite como máximo 2 decimales.');

const serviceName = z
  .string({ error: 'El nombre es obligatorio.' })
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres.')
  .max(100, 'El nombre no puede superar los 100 caracteres.');

const description = z.string().trim().max(500, 'La descripción no puede superar los 500 caracteres.');

// durationMinutes no se acepta: está fijo a 60 minutos por regla de negocio.
const createServiceBody = z.strictObject({
  name: serviceName,
  description: description.optional(),
  price,
  isActive: z.boolean().optional(),
});

const updateServiceBody = z
  .strictObject({
    name: serviceName.optional(),
    description: description.nullable().optional(),
    price: price.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'Debes enviar al menos un campo para actualizar.');

const listServicesQuery = z.object({
  includeInactive: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

module.exports = { createServiceBody, updateServiceBody, listServicesQuery };
