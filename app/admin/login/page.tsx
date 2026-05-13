'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function AdminLoginPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/magic-link', { method: 'POST' })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) { setError(body.error ?? 'Something went wrong'); setLoading(false); return }
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
