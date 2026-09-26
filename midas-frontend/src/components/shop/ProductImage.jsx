import { optimizedImageUrl } from '../../lib/images'

// Foto cuadrada del producto; sin foto, un monograma con la marca.
export default function ProductImage({ product, size = 480, className = '' }) {
  if (!product.imageUrl) {
    return (
      <div
        aria-hidden
        className={`grid place-items-center bg-[radial-gradient(circle_at_50%_40%,rgba(242,202,80,0.12),transparent_70%)] bg-surface-2 ${className}`}
      >
        <span className="font-display text-5xl leading-none font-semibold text-brand/25 italic">M</span>
      </div>
    )
  }
  return (
    <img
      src={optimizedImageUrl(product.imageUrl, { width: size, height: size })}
      alt={product.name}
      loading="lazy"
      width={size}
      height={size}
      className={`object-cover ${className}`}
    />
  )
}
