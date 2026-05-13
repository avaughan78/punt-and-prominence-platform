'use client'
import { Suspense, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

function AdminLoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const callbackError = searchParams.get('error')
  const [step, setStep] = useState<'send' | 'verify'>('send')
  const [adminEmail, setAdminEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(callbackError ?? '')
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  async function handleSend() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/magic-link', { method: 'POST' })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) { setError(body.error ?? 'Something went wrong'); setLoading(false); return }

    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: body.email,
      options: { shouldCreateUser: false },
    })

    if (otpError) { setError(otpError.message); setLoading(false); return }
    setAdminEmail(body.email)
    setStep('verify')
    setLoading(false)
  }

  async function submitToken(token: string) {
    if (token.length !== 6) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: adminEmail,
      token,
      type: 'email',
    })

    if (verifyError) {
      setError('Invalid or expired code. Try again.')
      setCode(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
      setLoading(false)
      return
    }

    router.replace('/admin')
  }

  function handleDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...code]
    next[index] = digit
    setCode(next)
    if (digit && index < 5) inputs.current[index + 1]?.focus()
    if (digit && index === 5) {
      const token = next.join('')
      if (token.length === 6) submitToken(token)
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
    if (e.key === 'Enter') submitToken(code.join(''))
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setCode(pasted.split(''))
      inputs.current[5]?.focus()
      submitToken(pasted)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-widest text-[#F5B800] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>★ PUNT & PROMINENCE</p>
          <h1 className="text-xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Admin access</h1>
        </div>

        {step === 'send' ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-500">Click below to receive a 6-digit code at the configured admin address.</p>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button loading={loading} onClick={handleSend}>Send code</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <p className="text-sm text-gray-500">Enter the 6-digit code sent to <span className="font-medium text-[#1C2B3A]">{adminEmail}</span>.</p>
            <div className="flex gap-2 justify-between" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  autoFocus={i === 0}
                  className="w-11 h-12 text-center text-lg font-bold text-[#1C2B3A] rounded-xl outline-none transition-all focus:ring-2 focus:ring-[#F5B800]"
                  style={{ border: '1.5px solid rgba(0,0,0,0.15)', fontFamily: "'JetBrains Mono', monospace" }}
                />
              ))}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button loading={loading} onClick={() => submitToken(code.join(''))} disabled={code.join('').length !== 6}>Verify</Button>
            <button
              type="button"
              onClick={() => { setStep('send'); setCode(['', '', '', '', '', '']); setError('') }}
              className="text-xs text-gray-400 hover:text-gray-600 text-center"
            >
              Resend code
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  )
}
