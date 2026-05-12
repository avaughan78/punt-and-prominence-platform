import { cn } from '@/lib/utils'
import { statusColor, statusLabel } from '@/lib/utils'

interface BadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: BadgeProps) {
  const color = statusColor(status)
  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', className)}
      style={{
        background: color + '20',
        color,
        fontFamily: "'JetBrains Mono', monospace",
        border: `1px solid ${color}40`,
      }}
    >
      {statusLabel(status)}
    </span>
  )
}

interface CategoryBadgeProps {
  category: string
  className?: string
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', className)}
      style={{
        background: 'rgba(28,43,58,0.07)',
        color: '#1C2B3A',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {category}
    </span>
  )
}
