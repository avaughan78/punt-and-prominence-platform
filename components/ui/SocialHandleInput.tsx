'use client'
import { ArrowRight, Check, Loader2 } from 'lucide-react'

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.79a8.28 8.28 0 0 0 4.84 1.55V6.89a4.85 4.85 0 0 1-1.07-.2z" />
    </svg>
  )
}

const PLATFORM_STYLES = {
  instagram: {
    background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
  },
  tiktok: {
    background: '#010101',
  },
}

interface Props {
  platform: 'instagram' | 'tiktok'
  value: string
  onChange: (v: string) => void
  onVerify: () => void
  looking: boolean
  verified: boolean
  placeholder?: string
  disabled?: boolean
}

export function SocialHandleInput({ platform, value, onChange, onVerify, looking, verified, placeholder, disabled }: Props) {
  const style = PLATFORM_STYLES[platform]

  return (
    <div
      className="flex rounded-xl overflow-hidden transition-all focus-within:ring-2 focus-within:ring-black/10"
      style={{ border: '1px solid rgba(0,0,0,0.1)' }}
    >
      {/* Platform icon */}
      <div
        className="flex items-center justify-center w-11 shrink-0"
        style={{ background: style.background }}
      >
        {platform === 'instagram' ? <InstagramIcon /> : <TikTokIcon />}
      </div>

      {/* Input */}
      <input
        placeholder={placeholder ?? 'yourhandle'}
        value={value}
        onChange={e => onChange(e.target.value.replace(/^@/, ''))}
        onKeyDown={e => { if (e.key === 'Enter' && !disabled) onVerify() }}
        disabled={disabled}
        className="flex-1 px-3 py-3 text-sm bg-white text-[#1C2B3A] placeholder-[#9ca3af] outline-none disabled:opacity-50"
        style={{ fontFamily: "'Inter', sans-serif" }}
      />

      {/* Verify button */}
      <button
        type="button"
        onClick={onVerify}
        disabled={looking || !value.trim() || disabled}
        className="flex items-center justify-center w-11 shrink-0 transition-all disabled:opacity-30"
        style={{ background: verified ? '#059669' : style.background }}
      >
        {looking
          ? <Loader2 className="w-4 h-4 text-white animate-spin" />
          : verified
          ? <Check className="w-4 h-4 text-white" />
          : <ArrowRight className="w-4 h-4 text-white" />
        }
      </button>
    </div>
  )
}
