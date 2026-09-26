const { z } = require('../utils/validators');

const reviewBody = z.strictObject({
  rating: z
    .number({ error: 'La calificación debe ser un número.' })
    .int('La calificación debe ser un número entero.')
    .min(1, 'La calificación mínima es 1 estrella.')
    .max(5, 'La calificación máxima es 5 estrellas.'),
  comment: z
    .string({ error: 'El comentario es obligatorio.' })
    .trim()
    .min(10, 'Cuéntanos un poco más (mínimo 10 caracteres).')
    .max(500, 'El comentario no puede superar los 500 caracteres.'),
});

const publicReviewsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(12).default(6),
});

const listReviewsQuery = z.object({
  isVisible: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
});

const visibilityBody = z.strictObject({
  isVisible: z.boolean({ error: 'isVisible debe ser verdadero o falso.' }),
});

module.exports = { reviewBody, publicReviewsQuery, listReviewsQuery, visibilityBody };
