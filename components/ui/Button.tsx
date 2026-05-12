'use client'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants = {
  primary: 'bg-[#F5B800] text-[#1C2B3A] hover:bg-[#e0a800] font-semibold',
  secondary: 'bg-[#1C2B3A] text-white hover:bg-[#253d54] font-semibold',
  ghost: 'bg-transparent text-[#1C2B3A] hover:bg-black/5 font-medium',
  danger: 'bg-[#F87171] text-white hover:bg-[#ef4444] font-semibold',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-base rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      style={{ fontFamily: "'Inter', sans-serif" }}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
