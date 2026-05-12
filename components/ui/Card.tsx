import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl',
        padding && 'p-5 sm:p-6',
        className
      )}
      style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: string
}

export function StatCard({ label, value, sub, accent = '#F5B800' }: StatCardProps) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(28,43,58,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </p>
      <p className="text-3xl font-bold mb-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: accent }}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </Card>
  )
}
