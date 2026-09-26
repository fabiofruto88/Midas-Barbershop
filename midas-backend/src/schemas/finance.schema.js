const { z, uuid, dateOnly } = require('../utils/validators');

const summaryQuery = z.object({
  period: z.enum(['day', 'week', 'month'], { error: 'El periodo debe ser day, week o month.' }).default('day'),
  date: dateOnly,
  // Solo lo usa el admin; a un barbero siempre se le muestran sus propios datos.
  barberId: uuid('barberId').optional(),
});

module.exports = { summaryQuery };
