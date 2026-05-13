'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

function AdminLoginForm() {
  const searchParams = useSearchParams()
  const callbackError = searchParams.get('error')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(callbackError ?? '')

  async function handleSend() {
    setLoading(true)
    setError('')

    // Fetch the admin email from the server (keeps it out of client bundle)
    const res = await fetch('/api/admin/magic-link', { method: 'POST' })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) { setError(body.error ?? 'Something went wrong'); setLoading(false); return }

    // Call signInWithOtp from the browser so the PKCE code verifier is stored
    // in this browser's cookies — the callback will find it when the link is clicked
    const supabase = createClient()
    const redirectTo = `${window.location.origin}/api/auth/callback`
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: body.email,
      options: { emailRedirectTo: redirectTo },
    })

    if (otpError) { setError(otpError.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-widest text-[#F5B800] mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>★ PUNT & PROMINENCE</p>
          <h1 className="text-xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Admin access</h1>
        </div>

        {sent ? (
          <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(107,230,176,0.1)', border: '1px solid rgba(107,230,176,0.3)' }}>
            <p className="text-sm font-semibold text-[#1C2B3A] mb-1">Check your email</p>
            <p className="text-xs text-gray-500">A magic link has been sent. Click it to sign in — make sure to open it in this same browser.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-500">Click below to receive a magic link at the configured admin address.</p>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button loading={loading} onClick={handleSend}>Send magic link</Button>
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
