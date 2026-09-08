export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand serif" aria-label="Vishal Mens Parlour">
      Vishal Mens
      {!compact && <br />}
      {compact ? ' ' : ''}
      Parlour
    </span>
  )
}
