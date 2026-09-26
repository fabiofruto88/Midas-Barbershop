const { Prisma } = require('@prisma/client');

const BUSY = { statusCode: 503, message: 'El servidor está ocupado. Intenta de nuevo en unos segundos.', retryAfter: 5 };

// Traduce errores conocidos de Prisma a códigos HTTP.
const mapPrismaError = (err) => {
  switch (err.code) {
    case 'P2002': // Violación de restricción única
      return { statusCode: 409, message: 'El recurso ya existe.' };
    case 'P2025': // Registro no encontrado
      return { statusCode: 404, message: 'Recurso no encontrado.' };
    case 'P2003': // Violación de llave foránea
      return { statusCode: 400, message: 'Referencia inválida a un recurso relacionado.' };
    case 'P2024': // Sin conexión libre en el pool a tiempo
    case 'P2028': // No se pudo iniciar/terminar la transacción a tiempo (pico de carga)
      return BUSY;
    default:
      return null;
  }
};

// Manejador global de errores: siempre responde `{ "error": "..." }`.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Error interno del servidor.';
  let retryAfter;

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(err);
    if (mapped) ({ statusCode, message, retryAfter } = mapped);
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    ({ statusCode, retryAfter } = BUSY);
    message = 'Servicio temporalmente no disponible. Intenta de nuevo en unos segundos.';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'El cuerpo de la petición no es un JSON válido.';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'El cuerpo de la petición excede el tamaño permitido.';
  } else if (statusCode === 400 && /^Failed to decode param/.test(message)) {
    message = 'La URL contiene caracteres inválidos.';
  }

  // Saturación: aviso breve en el log (no la traza completa por cada petición).
  if (retryAfter) {
    console.warn(`[${statusCode}] ${req.method} ${req.originalUrl}: ${err.code ?? err.name} ${err.message?.split('\n').pop()}`);
    res.set('Retry-After', String(retryAfter));
  }

  // Nunca exponer detalles de errores 5xx inesperados. Los AppError (ej. 503 de un servicio
  // externo no configurado) y los mapeados arriba sí llevan un mensaje pensado para el cliente.
  const unexpected = statusCode >= 500 && !err.isOperational && !retryAfter;
  if (unexpected) {
    console.error(err);
    message = 'Error interno del servidor.';
  }

  const body = { error: message };
  if (process.env.NODE_ENV === 'development' && unexpected) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};

module.exports = errorHandler;
