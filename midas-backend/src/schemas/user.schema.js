const { z, email, password, name, phone } = require('../utils/validators');

const role = z.enum(['ADMIN', 'BARBER', 'CLIENT'], { error: 'El rol debe ser ADMIN, BARBER o CLIENT.' });

const createUserBody = z.strictObject({
  name,
  email,
  password,
  phone: phone.optional(),
  role: role.default('BARBER'),
});

const updateUserBody = z
  .strictObject({
    name: name.optional(),
    email: email.optional(),
    password: password.optional(),
    phone: phone.nullable().optional(),
    role: role.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'Debes enviar al menos un campo para actualizar.');

const listUsersQuery = z.object({
  role: role.optional(),
});

module.exports = { createUserBody, updateUserBody, listUsersQuery };
