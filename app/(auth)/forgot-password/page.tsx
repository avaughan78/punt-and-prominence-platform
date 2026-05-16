'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(107,230,176,0.15)' }}>
          <span className="text-2xl">✉️</span>
        </div>
        <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#1C2B3A' }}>
          Check your email
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          We&apos;ve sent a password reset link to <strong>{email}</strong>. It expires in 1 hour.
        </p>
        <Link href="/login" className="text-sm font-semibold" style={{ color: '#1C2B3A' }}>
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: '#1C2B3A' }}>
          Reset your password
        </h1>
        <p className="text-sm text-gray-500">Enter your email and we&apos;ll send you a reset link.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
          Send reset link
        </Button>
      </form>

      <p className="text-sm text-center text-gray-500 mt-6">
        <Link href="/login" className="font-semibold" style={{ color: '#1C2B3A' }}>
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
