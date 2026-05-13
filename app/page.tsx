'use client'
import { useState } from 'react'
import { Star, MapPin, Lock, Loader2, BadgeCheck } from 'lucide-react'

// ─── Mock profiles for background cards ──────────────────────────────────────

const mockProfiles = [
  {
    handle: 'priya.eats.cam',
    name: 'Priya Sharma',
    followers: '1.2K',
    collabs: 4,
    verified: 3,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
  },
  {
    handle: 'aisha.local',
    name: 'Aisha Rahman',
    followers: '2.4K',
    collabs: 7,
    verified: 6,
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
  },
  {
    handle: 'tomincambridge',
    name: 'Tom Whitfield',
    followers: '892',
    collabs: 2,
    verified: 2,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
  },
  {
    handle: 'sundaybrunchcam',
    name: 'Emma Clarke',
    followers: '3.1K',
    collabs: 9,
    verified: 8,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
  },
]

const cardPositions = [
  { top: '10%', left: '4%',  rotate: '-4deg' },
  { top: '14%', left: '50%', rotate:  '3deg' },
  { top: '56%', left: '4%',  rotate:  '2.5deg' },
  { top: '53%', left: '50%', rotate: '-3deg'  },
]

function MockProfileCard({ profile, style }: { profile: typeof mockProfiles[0]; style?: React.CSSProperties }) {
  return (
    <div
      className="absolute bg-white rounded-2xl overflow-hidden shadow-2xl"
      style={{ width: '168px', ...style }}
    >
      <div className="w-full h-10 shrink-0" style={{ background: 'linear-gradient(135deg, #1C2B3A 0%, #2d4a63 100%)' }} />
      <div className="flex flex-col items-center px-3 pb-3 -mt-5">
        <div className="p-[2.5px] rounded-full" style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}>
          <div className="p-[2px] bg-white rounded-full">
            <img src={profile.avatar} alt={profile.name} className="w-10 h-10 rounded-full object-cover block" />
          </div>
        </div>
        <div className="flex items-center gap-1 mt-1.5">
          <span className="text-[11px] font-bold text-[#1C2B3A] leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {profile.name}
          </span>
          <BadgeCheck className="w-3 h-3 shrink-0" style={{ color: '#6BE6B0' }} />
        </div>
        <span className="text-[9px] text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          @{profile.handle}
        </span>
        <div className="flex w-full mt-2.5" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '5px 0' }}>
          {[
            { val: profile.followers, label: 'Followers' },
            { val: profile.collabs,   label: 'Collabs'   },
            { val: profile.verified,  label: 'Verified'  },
          ].map((s, i) => (
            <div key={s.label} className="flex-1 flex flex-col items-center" style={{ borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined }}>
              <span className="text-[10px] font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{s.val}</span>
              <span className="text-[7px] text-gray-400 uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.label}</span>
            </div>
          ))}
        </div>
        <div
          className="w-full mt-2.5 py-1.5 rounded-lg text-[9px] font-semibold text-center text-white"
          style={{ background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)' }}
        >
          View on Instagram
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#1C2B3A' }}>

      {/* ── Square frame behind content ── */}
      <div
        className="absolute pointer-events-none overflow-hidden"
        style={{
          width: 'min(700px, 88vmin)',
          height: 'min(700px, 88vmin)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '32px',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Left half: Cambridge map */}
        <div className="absolute top-0 left-0 w-1/2 h-full">
          <img
            src="/cambridge-map.png"
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.45, filter: 'grayscale(30%) brightness(1.5) contrast(0.9)' }}
          />
        </div>

        {/* Centre divider */}
        <div
          className="absolute top-0 left-1/2 -translate-x-px w-px h-full"
          style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.1) 80%, transparent 100%)' }}
        />

        {/* Right half: profile cards */}
        <div className="absolute top-0 right-0 w-1/2 h-full" style={{ opacity: 0.55 }}>
          {mockProfiles.map((p, i) => (
            <MockProfileCard
              key={p.handle}
              profile={p}
              style={{
                top: cardPositions[i].top,
                left: cardPositions[i].left,
                transform: `rotate(${cardPositions[i].rotate})`,
              }}
            />
          ))}
        </div>

        {/* Inner vignette — keeps text readable */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 62% 60% at 50% 50%, rgba(28,43,58,0.88) 0%, rgba(28,43,58,0.55) 52%, rgba(28,43,58,0.05) 100%)',
          }}
        />
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">

        <div className="flex items-center gap-2 mb-10">
          <Star className="w-4 h-4" style={{ color: '#F5B800' }} />
          <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'JetBrains Mono', monospace" }}>
            Punt &amp; Prominence
          </span>
        </div>

        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-6 text-xs font-medium"
          style={{ background: 'rgba(245,184,0,0.08)', color: '#F5B800', border: '1px solid rgba(245,184,0,0.18)', fontFamily: "'JetBrains Mono', monospace" }}
        >
          <MapPin className="w-3 h-3" />
          Cambridge, UK
        </div>

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

        <div className="flex items-center gap-3 mt-10 w-full max-w-xs">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <span className="text-xs" style={{ color: 'rgba(107,230,176,0.5)', fontFamily: "'JetBrains Mono', monospace" }}>PILOT 2026</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>
      </div>

      {/* ── Discreet preview access ── */}
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
              style={{ color: error ? '#F5B800' : 'rgba(255,255,255,0.8)', fontFamily: "'Inter', sans-serif" }}
            />
            <button
              type="submit"
              disabled={loading || !password}
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-40 transition-all hover:opacity-90"
              style={{ background: '#F5B800', color: '#1C2B3A' }}
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-xs font-bold">→</span>}
            </button>
          </form>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-10">
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.12)', fontFamily: "'Inter', sans-serif" }}>
          © {new Date().getFullYear()} Hare House Consulting Ltd
        </p>
      </div>
    </div>
  )
}
