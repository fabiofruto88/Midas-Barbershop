// Validación de imágenes antes de subirlas. Es solo de UX: el backend verifica el tipo real por magic numbers.
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const ACCEPTED_IMAGES = ['image/jpeg', 'image/png', 'image/webp']

// Devuelve el mensaje de error o null si el archivo es válido.
export const imageFileError = (file) => {
  if (!ACCEPTED_IMAGES.includes(file.type)) return 'Solo se permiten imágenes JPEG, PNG o WebP.'
  if (file.size > MAX_IMAGE_BYTES) return 'La imagen no puede superar los 5MB.'
  return null
}
