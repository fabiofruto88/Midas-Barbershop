const { rateLimit } = require('express-rate-limit');

const limiter = ({ windowMs, limit, error, skip = () => false }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error },
    // Las pruebas automatizadas hacen todas las peticiones desde la misma IP.
    skip: (req) => process.env.NODE_ENV === 'test' || skip(req),
  });

// Límite general para toda la API.
const apiLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  error: 'Demasiadas peticiones. Intenta de nuevo más tarde.',
});

// Límite estricto para login: 5 intentos por minuto por IP.
const loginLimiter = limiter({
  windowMs: 60 * 1000,
  limit: 5,
  error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en un minuto.',
});

// Límite para creación de cuentas: 10 registros cada 15 minutos por IP.
const registerLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  error: 'Demasiados registros desde esta IP. Intenta de nuevo más tarde.',
});

// Límite de reservas: evita que alguien bloquee la agenda con reservas falsas de invitado.
// Debe ir después de optionalAuth: el personal (que reserva por teléfono para clientes) no se limita.
const bookingLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  error: 'Has hecho demasiadas reservas en poco tiempo. Intenta de nuevo más tarde.',
  skip: (req) => req.user?.role === 'ADMIN' || req.user?.role === 'BARBER',
});

module.exports = { apiLimiter, loginLimiter, registerLimiter, bookingLimiter };
