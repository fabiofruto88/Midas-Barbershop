const { z } = require('../utils/validators');

const booleanQuery = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => (value === undefined ? undefined : value === 'true'));

const publicResultsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(24).default(12),
});

const listResultsQuery = z.object({ isPublished: booleanQuery });

const publishResultBody = z.strictObject({
  isPublished: z.boolean({ error: 'isPublished debe ser verdadero o falso.' }),
});

module.exports = { publicResultsQuery, listResultsQuery, publishResultBody };
