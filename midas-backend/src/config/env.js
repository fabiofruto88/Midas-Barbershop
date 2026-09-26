// Configuración centralizada. Falla al arrancar si falta una variable crítica.
const isProduction = process.env.NODE_ENV === 'production';

const required = ['DATABASE_URL', 'JWT_SECRET', ...(isProduction ? ['CORS_ORIGIN'] : [])];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Faltan variables de entorno obligatorias: ${missing.join(', ')}`);
}

if (isProduction && process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET debe tener al menos 32 caracteres en producción.');
}

if (process.env.BUSINESS_TIMEZONE) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: process.env.BUSINESS_TIMEZONE });
  } catch {
    throw new Error(`BUSINESS_TIMEZONE inválida: ${process.env.BUSINESS_TIMEZONE}`);
  }
}

// Falla al arrancar (y no en el primer login) si la duración del JWT no se entiende.
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
try {
  require('../utils/ms')(jwtExpiresIn);
} catch {
  throw new Error(`JWT_EXPIRES_IN inválido: "${jwtExpiresIn}". Usa un número seguido de s, m, h o d (ej. 7d).`);
}

const bookingMinLeadMinutes = Number.parseInt(process.env.BOOKING_MIN_LEAD_MINUTES ?? '30', 10);
if (!Number.isInteger(bookingMinLeadMinutes) || bookingMinLeadMinutes < 0) {
  throw new Error('BOOKING_MIN_LEAD_MINUTES debe ser un entero mayor o igual a 0.');
}

const bookingWindowDays = Number.parseInt(process.env.BOOKING_WINDOW_DAYS ?? '60', 10);
if (!Number.isInteger(bookingWindowDays) || bookingWindowDays < 1) {
  throw new Error('BOOKING_WINDOW_DAYS debe ser un entero mayor que 0.');
}

const sameSite = process.env.COOKIE_SAMESITE || 'strict';
if (!['strict', 'lax', 'none'].includes(sameSite)) {
  throw new Error('COOKIE_SAMESITE debe ser strict, lax o none.');
}

// Nº de proxies de confianza delante del API (Render/Heroku/Nginx = 1). Sin proxy debe ser 0:
// si no, cualquiera puede falsificar X-Forwarded-For y saltarse el rate limiting.
const trustProxy = Number.parseInt(process.env.TRUST_PROXY ?? '0', 10) || 0;

module.exports = {
  isProduction,
  port: Number(process.env.PORT) || 4000,
  corsOrigin: process.env.CORS_ORIGIN,
  trustProxy,
  // Zona horaria de la barbería: define "hoy", horarios pasados y la regla de cancelación.
  timezone: process.env.BUSINESS_TIMEZONE || 'America/Bogota',
  // Días hacia adelante en los que se puede reservar.
  bookingWindowDays,
  // Antelación mínima: no se ofrece un bloque que empieza en menos de estos minutos.
  bookingMinLeadMinutes,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: jwtExpiresIn,
  },
  cookie: {
    name: 'token',
    // strict por defecto; usar "none" solo si front y back viven en dominios distintos (requiere HTTPS).
    sameSite,
    secure: isProduction || sameSite === 'none',
  },
};
