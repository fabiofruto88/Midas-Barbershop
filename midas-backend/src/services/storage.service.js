const crypto = require('node:crypto');
const { v2: cloudinary } = require('cloudinary');
const AppError = require('../utils/AppError');

const FOLDER = 'midas/results';

const isConfigured = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

let configured = false;
const ensureConfigured = () => {
  if (!isConfigured()) {
    throw new AppError('El almacenamiento de imágenes no está configurado (Cloudinary).', 503);
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
};

// Sube un buffer ya validado. El public_id es aleatorio para que la URL no sea adivinable.
const uploadImage = (buffer) => {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: FOLDER, public_id: crypto.randomUUID(), resource_type: 'image', overwrite: false },
      (error, result) => {
        if (error) return reject(new AppError('No se pudo subir la imagen. Intenta de nuevo.', 502));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

// Deriva el public_id desde una URL de Cloudinary (…/upload/v123/midas/results/<id>.jpg).
const publicIdFromUrl = (url) => {
  const match = /\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i.exec(url ?? '');
  return match ? match[1] : null;
};

// Borrado "best effort": si falla, no debe romper la operación principal.
const deleteImageByUrl = async (url) => {
  const publicId = publicIdFromUrl(url);
  if (!publicId || !isConfigured()) return;
  try {
    ensureConfigured();
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (error) {
    console.error('No se pudo borrar la imagen anterior de Cloudinary:', error.message);
  }
};

module.exports = { isConfigured, uploadImage, deleteImageByUrl, publicIdFromUrl };
