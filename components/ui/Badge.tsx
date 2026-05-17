import { cn, stateColor, stateLabel } from '@/lib/utils'
import { Utensils, ShoppingBag, Sparkles, Zap, Heart, Tag } from 'lucide-react'

interface BadgeProps {
  state: string
  className?: string
}

export function StatusBadge({ state, className }: BadgeProps) {
  const color = stateColor(state)
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
      {stateLabel(state)}
    </span>
  )
}

const CATEGORY_META: Record<string, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  dining:     { icon: Utensils,    bg: 'rgba(251,146,60,0.14)',  text: '#c2410c', label: 'Dining & drinks' },
  retail:     { icon: ShoppingBag, bg: 'rgba(167,139,250,0.15)', text: '#6d28d9', label: 'Retail' },
  experience: { icon: Sparkles,    bg: 'rgba(96,165,250,0.15)',  text: '#1d4ed8', label: 'Experience' },
  fitness:    { icon: Zap,         bg: 'rgba(74,222,128,0.15)',  text: '#15803d', label: 'Fitness' },
  beauty:     { icon: Heart,       bg: 'rgba(244,114,182,0.15)', text: '#be185d', label: 'Beauty' },
}

const DEFAULT_META = { icon: Tag, bg: 'rgba(0,0,0,0.06)', text: '#6b7280', label: 'Other' }

interface CategoryBadgeProps {
  category: string
  className?: string
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const meta = CATEGORY_META[category] ?? DEFAULT_META
  const Icon = meta.icon
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', className)}
      style={{ background: meta.bg, color: meta.text, fontFamily: "'Inter', sans-serif" }}
    >
      <Icon className="w-3 h-3 flex-shrink-0" />
      {meta.label}
    </span>
  )
}
