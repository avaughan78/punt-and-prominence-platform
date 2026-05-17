'use client'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  showPasswordToggle?: boolean
}

export function Input({ label, error, hint, className, id, type, showPasswordToggle, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  const [showPassword, setShowPassword] = useState(false)
  const resolvedType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-[#1C2B3A] uppercase tracking-wide"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={resolvedType}
          className={cn(
            'w-full px-4 py-3 rounded-xl border text-sm bg-white text-[#1C2B3A] placeholder-[#9ca3af] transition-all outline-none',
            'border-black/10 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20',
            error && 'border-[#F87171] focus:border-[#F87171] focus:ring-[#F87171]/20',
            showPasswordToggle && 'pr-10',
            className
          )}
          style={{ fontFamily: "'Inter', sans-serif" }}
          {...props}
        />
        {showPasswordToggle && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1C2B3A] transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-[#F87171]">{error}</p>}
    </div>
  )
}
