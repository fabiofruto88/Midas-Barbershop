const jwt = require('jsonwebtoken');
const ms = require('./ms');
const config = require('../config/env');
const { wallClock } = require('./time');

const ALGORITHM = 'HS256';
const SESSION_TOKEN_TYPE = 'session';

const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role, type: SESSION_TOKEN_TYPE }, config.jwt.secret, {
    algorithm: ALGORITHM,
    expiresIn: config.jwt.expiresIn,
  });

// Rechaza tokens de otro tipo (ej. un token de invitado usado como cookie de sesión).
const verifyToken = (token) => {
  const payload = jwt.verify(token, config.jwt.secret, { algorithms: [ALGORITHM] });
  if (payload.type !== SESSION_TOKEN_TYPE) throw new Error('Tipo de token inválido');
  return payload;
};

// Token de invitado: permite a un cliente no registrado cancelar SU cita (sin columnas extra en BD).
const GUEST_TOKEN_TYPE = 'guest-appointment';
const GUEST_TOKEN_GRACE_SECONDS = 24 * 60 * 60;

// Caduca un día después de la cita (el margen cubre el desfase entre hora local y UTC):
// un TTL fijo dejaría sin forma de cancelar a quien reserva con más antelación.
const signGuestToken = ({ id, date, timeSlot }) =>
  jwt.sign(
    {
      sub: id,
      type: GUEST_TOKEN_TYPE,
      exp: Math.floor(wallClock(date, timeSlot).getTime() / 1000) + GUEST_TOKEN_GRACE_SECONDS,
    },
    config.jwt.secret,
    { algorithm: ALGORITHM }
  );

const verifyGuestToken = (token, appointmentId) => {
  try {
    const payload = jwt.verify(token, config.jwt.secret, { algorithms: [ALGORITHM] });
    return payload.type === GUEST_TOKEN_TYPE && payload.sub === appointmentId;
  } catch {
    return false;
  }
};

const cookieOptions = () => ({
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  path: '/',
});

const setAuthCookie = (res, token) => {
  res.cookie(config.cookie.name, token, { ...cookieOptions(), maxAge: ms(config.jwt.expiresIn) });
};

const clearAuthCookie = (res) => {
  res.clearCookie(config.cookie.name, cookieOptions());
};

module.exports = {
  signToken,
  verifyToken,
  signGuestToken,
  verifyGuestToken,
  setAuthCookie,
  clearAuthCookie,
};
