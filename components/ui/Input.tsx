import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
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
      <input
        id={inputId}
        className={cn(
          'w-full px-4 py-3 rounded-xl border text-sm bg-white text-[#1C2B3A] placeholder-[#9ca3af] transition-all outline-none',
          'border-black/10 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20',
          error && 'border-[#F87171] focus:border-[#F87171] focus:ring-[#F87171]/20',
          className
        )}
        style={{ fontFamily: "'Inter', sans-serif" }}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-[#F87171]">{error}</p>}
    </div>
  )
}
