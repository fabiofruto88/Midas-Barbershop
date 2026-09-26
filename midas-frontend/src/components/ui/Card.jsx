export default function Card({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <Tag className={`rounded-card border border-border bg-surface p-5 ${className}`} {...props}>
      {children}
    </Tag>
  )
}
