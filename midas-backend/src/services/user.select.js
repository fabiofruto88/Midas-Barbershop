// Campos seguros de User para devolver al cliente (nunca passwordHash ni pushSubscription).
const publicUserSelect = {
  id: true,
  role: true,
  name: true,
  email: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
};

module.exports = { publicUserSelect };
