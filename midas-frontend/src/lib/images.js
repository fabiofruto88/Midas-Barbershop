// Entrega optimizada de imágenes de Cloudinary: formato y calidad automáticos
// (f_auto,q_auto) y recorte inteligente al tamaño mostrado (c_fill,g_auto).
// Las URLs que no son de Cloudinary se devuelven sin cambios.
const UPLOAD_SEGMENT = '/image/upload/'

export const optimizedImageUrl = (url, { width, height } = {}) => {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes(UPLOAD_SEGMENT)) return url

  const transforms = ['f_auto', 'q_auto']
  if (width || height) {
    transforms.push('c_fill', 'g_auto')
    if (width) transforms.push(`w_${width}`)
    if (height) transforms.push(`h_${height}`)
  }

  return url.replace(UPLOAD_SEGMENT, `${UPLOAD_SEGMENT}${transforms.join(',')}/`)
}
