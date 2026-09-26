const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const config = require('../config/env');
const { verifyToken } = require('../utils/token');

// Lee el JWT de la cookie HttpOnly y carga el rol ACTUAL desde la BD (consulta por PK):
// si el admin cambia el rol o elimina la cuenta, el token deja de dar esos permisos al instante.
// Si `required` es false, deja pasar a invitados.
const readUser = async (req, required) => {
  const token = req.cookies?.[config.cookie.name];
  if (!token) {
    if (required) throw new AppError('Debes iniciar sesión.', 401);
    return null;
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    if (required) throw new AppError('Sesión inválida o expirada.', 401);
    return null;
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true } });
  if (!user && required) throw new AppError('Sesión inválida o expirada.', 401);
  return user;
};

const authenticate = async (req, res, next) => {
  req.user = await readUser(req, true);
  next();
};

const optionalAuth = async (req, res, next) => {
  req.user = await readUser(req, false);
  next();
};

const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(new AppError('Debes iniciar sesión.', 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError('No tienes permisos para realizar esta acción.', 403));
    }
    next();
  };

module.exports = { authenticate, optionalAuth, authorize };
