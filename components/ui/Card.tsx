import Link from 'next/link'
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
  href?: string
}

export function StatCard({ label, value, sub, accent = '#F5B800', href }: StatCardProps) {
  const isClickable = href && Number(value) > 0
  const inner = (
    <>
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(28,43,58,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </p>
      <p className="text-3xl font-bold mb-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: accent }}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </>
  )
  if (isClickable) {
    return (
      <Link href={href} className="block rounded-2xl p-5 sm:p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
        style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', background: 'white' }}>
        {inner}
      </Link>
    )
  }
  return <Card>{inner}</Card>
}
