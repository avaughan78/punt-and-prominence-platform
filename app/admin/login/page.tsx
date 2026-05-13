'use client'
import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

function AdminLoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const callbackError = searchParams.get('error')
  const [step, setStep] = useState<'send' | 'verify'>('send')
  const [adminEmail, setAdminEmail] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(callbackError ?? '')

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

  async function handleVerify() {
    const t = token.trim()
    if (!t) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: adminEmail,
      token: t,
      type: 'email',
    })

    if (verifyError) {
      setError('Invalid or expired code. Try again.')
      setToken('')
      setLoading(false)
      return
    }

    router.replace('/admin')
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
            <p className="text-sm text-gray-500">Click below to receive a sign-in code at the configured admin address.</p>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button loading={loading} onClick={handleSend}>Send code</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-500">Enter the code sent to <span className="font-medium text-[#1C2B3A]">{adminEmail}</span>.</p>
            <input
              type="text"
              autoFocus
              autoComplete="one-time-code"
              value={token}
              onChange={e => setToken(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleVerify() }}
              placeholder="Paste your code here"
              className="w-full px-4 py-3 text-center text-xl font-bold tracking-widest text-[#1C2B3A] rounded-xl outline-none transition-all focus:ring-2 focus:ring-[#F5B800]"
              style={{ border: '1.5px solid rgba(0,0,0,0.15)', fontFamily: "'JetBrains Mono', monospace" }}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button loading={loading} onClick={handleVerify} disabled={!token.trim()}>Verify</Button>
            <button
              type="button"
              onClick={() => { setStep('send'); setToken(''); setError('') }}
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
