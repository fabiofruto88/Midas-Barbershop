const multer = require('multer');
const AppError = require('../utils/AppError');

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

// Multer en memoria con límites estrictos: 1 archivo, 5MB, sin campos de texto enormes.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1, fields: 5, fieldSize: 2 * 1024 },
});

// Carga perezosa: file-type es un módulo ESM.
let fileTypeFromBuffer;
const detectType = async (buffer) => {
  fileTypeFromBuffer ??= (await import('file-type')).fileTypeFromBuffer;
  return fileTypeFromBuffer(buffer);
};

// Recibe el campo `image` y valida el tipo REAL por magic numbers (no por extensión ni Content-Type).
const uploadImage = (field = 'image') => [
  (req, res, next) => {
    upload.single(field)(req, res, (error) => {
      if (!error) return next();
      if (error.code === 'LIMIT_FILE_SIZE') return next(new AppError('La imagen no puede superar los 5MB.', 413));
      if (error instanceof multer.MulterError) return next(new AppError('Archivo inválido. Envía una sola imagen en el campo "image".', 400));
      next(error);
    });
  },
  async (req, res, next) => {
    if (!req.file) return next(new AppError('Debes adjuntar una imagen en el campo "image".', 400));

    const type = await detectType(req.file.buffer);
    if (!type || !ALLOWED_MIME.includes(type.mime)) {
      return next(new AppError('Solo se permiten imágenes JPEG, PNG o WebP.', 415));
    }
    req.file.detectedMime = type.mime;
    next();
  },
];

module.exports = { uploadImage, MAX_BYTES, ALLOWED_MIME };
