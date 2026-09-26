const { z } = require('zod');

// Mensajes genéricos de Zod en español (los específicos se definen en cada esquema).
z.config(z.locales.es());

// Piezas de validación reutilizables entre módulos.
const uuid = (label = 'id') => z.string().uuid(`El ${label} no es un UUID válido.`);

const email = z
  .string({ error: 'El email es obligatorio.' })
  .trim()
  .toLowerCase()
  .email('El email no es válido.')
  .max(254);

// bcrypt solo usa los primeros 72 BYTES: más allá se truncaría en silencio (ej. 19 emojis = 76 bytes).
const password = z
  .string({ error: 'La contraseña es obligatoria.' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'La contraseña es demasiado larga (máximo 72 bytes).');

const name = z
  .string({ error: 'El nombre es obligatorio.' })
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres.')
  .max(100, 'El nombre no puede superar los 100 caracteres.');

// Acepta "+57 300 123-4567" o "(300) 1234567" y lo guarda normalizado: "+573001234567".
const phone = z
  .string({ error: 'El teléfono debe ser un texto.' })
  .transform((value) => value.replace(/[\s\-().]/g, ''))
  .pipe(z.string().regex(/^\+?[0-9]{7,15}$/, 'El teléfono debe tener entre 7 y 15 dígitos (ej. +573001234567).'));

// "HH:mm" en punto: los bloques de reserva son de 1 hora exacta.
const hourTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):00$/, 'La hora debe tener el formato "HH:00" (ej. "10:00").');

// "YYYY-MM-DD" con fecha real del calendario.
const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato "YYYY-MM-DD".')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, 'La fecha no existe en el calendario.');

// Precio en COP: positivo, con máximo 2 decimales y dentro de Decimal(10, 2).
const price = z.coerce
  .number({ error: 'El precio debe ser un número.' })
  .positive('El precio debe ser mayor que 0.')
  .max(99999999.99, 'El precio es demasiado alto.')
  // toFixed absorbe el error de coma flotante (19.99 * 100 = 1998.9999999999998).
  .refine((value) => Number.isInteger(Number((value * 100).toFixed(6))), 'El precio admite como máximo 2 decimales.');

const idParam = z.object({ id: uuid() });

module.exports = { z, uuid, email, password, name, phone, price, hourTime, dateOnly, idParam };
