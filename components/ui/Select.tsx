import { cn } from '@/lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
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
      <select
        id={inputId}
        className={cn(
          'w-full px-4 py-3 rounded-xl border text-sm bg-white text-[#1C2B3A] transition-all outline-none cursor-pointer appearance-none',
          'border-black/10 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20',
          error && 'border-[#F87171]',
          className
        )}
        style={{ fontFamily: "'Inter', sans-serif" }}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-[#F87171]">{error}</p>}
    </div>
  )
}
