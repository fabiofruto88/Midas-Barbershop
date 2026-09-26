// Icono SVG exportado de Figma. Decorativo por defecto: el texto adyacente ya lo describe.
export default function Icon({ src, className = '', alt = '' }) {
  return <img src={src} alt={alt} aria-hidden={alt ? undefined : true} className={`block shrink-0 ${className}`} />
}
