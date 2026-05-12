import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
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
      <textarea
        id={inputId}
        className={cn(
          'w-full px-4 py-3 rounded-xl border text-sm bg-white text-[#1C2B3A] placeholder-[#9ca3af] transition-all outline-none resize-none',
          'border-black/10 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20',
          error && 'border-[#F87171]',
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
