const { z } = require('../utils/validators');

// Objeto PushSubscription estándar del navegador (subscription.toJSON()).
const subscribeBody = z.object({
  endpoint: z.string().url('endpoint inválido.').startsWith('https://', 'El endpoint debe usar HTTPS.').max(2048),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(256),
  }),
});

module.exports = { subscribeBody };
