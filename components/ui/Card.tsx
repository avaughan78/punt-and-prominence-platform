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
        'rounded-2xl',
        padding && 'p-5 sm:p-6',
        className
      )}
      style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}
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
      <p className="min-h-[1.5rem] sm:min-h-[2.5rem] flex items-start text-[10px] sm:text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(28,43,58,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </p>
      <p className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: accent }}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </>
  )
  if (isClickable) {
    return (
      <Link href={href} className="block rounded-2xl p-3 sm:p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
        style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', background: 'white' }}>
        {inner}
      </Link>
    )
  }
  return (
    <div className="rounded-2xl p-3 sm:p-5" style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
      {inner}
    </div>
  )
}
