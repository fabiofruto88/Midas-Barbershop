const { z, uuid, price } = require('../utils/validators');

const atLeastOne = (schema) =>
  schema.refine((data) => Object.keys(data).length > 0, 'Debes enviar al menos un campo para actualizar.');

// ---------- Categorías ----------
const categoryName = z
  .string({ error: 'El nombre es obligatorio.' })
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres.')
  .max(50, 'El nombre no puede superar los 50 caracteres.');

const sortOrder = z.coerce
  .number({ error: 'El orden debe ser un número.' })
  .int('El orden debe ser un número entero.')
  .min(0, 'El orden no puede ser negativo.')
  .max(999, 'El orden no puede superar 999.');

const createCategoryBody = z.strictObject({ name: categoryName, sortOrder: sortOrder.optional() });

const updateCategoryBody = atLeastOne(
  z.strictObject({ name: categoryName.optional(), sortOrder: sortOrder.optional() })
);

// ---------- Productos ----------
const productName = z
  .string({ error: 'El nombre es obligatorio.' })
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres.')
  .max(100, 'El nombre no puede superar los 100 caracteres.');

const description = z.string().trim().max(500, 'La descripción no puede superar los 500 caracteres.');
const categoryId = uuid('id de la categoría');

const createProductBody = z.strictObject({
  categoryId,
  name: productName,
  description: description.optional(),
  price,
  isAvailable: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

const updateProductBody = atLeastOne(
  z.strictObject({
    categoryId: categoryId.optional(),
    name: productName.optional(),
    description: description.nullable().optional(),
    price: price.optional(),
    isAvailable: z.boolean().optional(),
    isVisible: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  })
);

const listProductsQuery = z.object({
  categoryId: categoryId.optional(),
  includeHidden: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

module.exports = {
  createCategoryBody,
  updateCategoryBody,
  createProductBody,
  updateProductBody,
  listProductsQuery,
};
