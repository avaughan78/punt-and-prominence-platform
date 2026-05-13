'use client'
import { useState } from 'react'
import { Star, MapPin, Lock, Loader2 } from 'lucide-react'

export default function ComingSoon() {
  const [showForm, setShowForm] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(false)
    const res = await fetch('/api/auth/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      window.location.href = '/home'
    } else {
      setError(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative" style={{ background: '#1C2B3A' }}>
      {/* Subtle background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <Star className="w-4 h-4" style={{ color: '#F5B800' }} />
          <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'JetBrains Mono', monospace" }}>
            Punt &amp; Prominence
          </span>
        </div>

        {/* Location pill */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-6 text-xs font-medium"
          style={{ background: 'rgba(245,184,0,0.08)', color: '#F5B800', border: '1px solid rgba(245,184,0,0.18)', fontFamily: "'JetBrains Mono', monospace" }}
        >
          <MapPin className="w-3 h-3" />
          Cambridge, UK
        </div>

        {/* Headline */}
        <h1
          className="text-5xl sm:text-6xl font-extrabold text-white mb-5 leading-tight"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
        >
          Something<br />
          <span style={{ color: '#F5B800' }}>exciting</span><br />
          is coming.
        </h1>

        <p className="text-white/40 text-base leading-relaxed max-w-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
          The local creator marketplace connecting Cambridge businesses with verified micro-creators.
        </p>

        {/* Decorative divider */}
        <div className="flex items-center gap-3 mt-10 w-full max-w-xs">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <span className="text-xs" style={{ color: 'rgba(107,230,176,0.5)', fontFamily: "'JetBrains Mono', monospace" }}>PILOT 2026</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>
      </div>

      {/* Discreet preview access */}
      <div className="fixed bottom-6 right-6 z-20">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            title="Preview access"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.15)' }}
          >
            <Lock className="w-3 h-3" />
          </button>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 shadow-xl"
            style={{ background: 'rgba(28,43,58,0.95)', border: `1px solid ${error ? 'rgba(245,184,0,0.4)' : 'rgba(255,255,255,0.1)'}`, backdropFilter: 'blur(12px)' }}
          >
            <input
              autoFocus
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false) }}
              placeholder={error ? 'Incorrect — try again' : 'Preview password'}
              className="bg-transparent text-sm outline-none w-40"
              style={{
                color: error ? '#F5B800' : 'rgba(255,255,255,0.8)',
                fontFamily: "'Inter', sans-serif",
              }}
            />
            <button
              type="submit"
              disabled={loading || !password}
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-40 transition-all hover:opacity-90"
              style={{ background: '#F5B800', color: '#1C2B3A' }}
            >
              {loading
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <span className="text-xs font-bold">→</span>
              }
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.12)', fontFamily: "'Inter', sans-serif" }}>
          © {new Date().getFullYear()} Hare House Consulting Ltd
        </p>
      </div>
    </div>
  )
}
