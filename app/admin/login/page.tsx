'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export default function AdminLoginPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: (e.target as HTMLFormElement).email.value,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/admin`,
      },
    })
    if (error) { setError(error.message); setLoading(false); return }
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
            <p className="text-xs text-gray-500">A magic link has been sent. Click it to sign in.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1C2B3A] uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Admin email
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all border-black/10 focus:border-[#F5B800] focus:ring-2 focus:ring-[#F5B800]/20"
                style={{ fontFamily: "'Inter', sans-serif" }}
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button type="submit" loading={loading}>Send magic link</Button>
          </form>
        )}
      </div>
    </div>
  )
}
