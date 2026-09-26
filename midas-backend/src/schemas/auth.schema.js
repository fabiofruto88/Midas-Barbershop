const { z, email, password, name, phone } = require('../utils/validators');

const registerBody = z.strictObject({
  name,
  email,
  password,
  phone: phone.optional(),
});

const loginBody = z.strictObject({
  email,
  password: z.string({ error: 'La contraseña es obligatoria.' }).min(1).max(72),
});

module.exports = { registerBody, loginBody };
