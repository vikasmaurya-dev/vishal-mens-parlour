import type { CSSProperties } from 'react'

interface Props {
  width?: number | string
  height?: number | string
  radius?: number | string
  style?: CSSProperties
  className?: string
}

export function Skeleton({ width = '100%', height = 16, radius = 6, style, className }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`skeleton ${className ?? ''}`.trim()}
      style={{ width, height, borderRadius: radius, display: 'inline-block', ...style }}
    />
  )
}

interface CardProps {
  lines?: number
}

export function SkeletonCard({ lines = 3 }: CardProps) {
  return (
    <article className="plain-card" aria-busy="true">
      <Skeleton height={20} width="60%" />
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} height={12} width={index === lines - 1 ? '40%' : '100%'} style={{ marginTop: 10 }} />
      ))}
    </article>
  )
}
