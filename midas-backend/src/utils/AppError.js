// Error operacional con código HTTP. Los servicios lanzan AppError y el
// manejador global lo traduce a la respuesta `{ "error": "..." }` de los contratos de la API.
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

module.exports = AppError;
