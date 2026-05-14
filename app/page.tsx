'use client'
import { useState } from 'react'
import { Star, MapPin, Lock, Loader2, BadgeCheck, ArrowRight, Check } from 'lucide-react'

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockCards = [
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

const mockCircles = [
  { handle: 'cambridgemarket', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100' },
  { handle: 'cambridgenights', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100' },
  { handle: 'millroadfood',    avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100' },
  { handle: 'camcreates',      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100' },
]

const cardPositions = [
  { top: '7%',  left: '2%',  rotate: '-3.5deg' },
  { top: '5%',  left: '73%', rotate:  '2.5deg' },
  { top: '56%', left: '3%',  rotate:  '2deg'   },
  { top: '53%', left: '71%', rotate: '-3deg'   },
]

const circlePositions = [
  { top: '38%', left: '27%', rotate: '-2deg'   },
  { top: '10%', left: '46%', rotate:  '3deg'   },
  { top: '62%', left: '43%', rotate: '-1.5deg' },
  { top: '36%', left: '61%', rotate:  '2deg'   },
]

// Float animation durations/delays — staggered so nothing bobs in sync
const floatConfig = [
  { duration: '6.0s', delay: '0.0s' },
  { duration: '7.2s', delay: '1.4s' },
  { duration: '6.6s', delay: '0.7s' },
  { duration: '7.8s', delay: '2.1s' },
]

// ─── Components ───────────────────────────────────────────────────────────────

function MockProfileCard({ profile, style }: { profile: typeof mockCards[0]; style?: React.CSSProperties }) {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-2xl"
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

function MockProfileCircle({ profile, style }: { profile: typeof mockCircles[0]; style?: React.CSSProperties }) {
  return (
    <div className="flex flex-col items-center gap-1.5" style={style}>
      <div className="p-[3px] rounded-full shadow-xl" style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}>
        <div className="p-[2.5px] bg-white rounded-full">
          <img src={profile.avatar} alt={profile.handle} className="w-12 h-12 rounded-full object-cover block" />
        </div>
      </div>
      <span
        className="text-white text-[9px] font-medium px-1.5 py-0.5 rounded-md"
        style={{ background: 'rgba(0,0,0,0.45)', fontFamily: "'JetBrains Mono', monospace", backdropFilter: 'blur(4px)' }}
      >
        @{profile.handle}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComingSoon() {
  const [showForm, setShowForm] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handlePreview(e: React.FormEvent) {
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

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault()
    if (!email || emailStatus === 'loading') return
    setEmailStatus('loading')
    const res = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setEmailStatus(res.ok ? 'success' : 'error')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#1C2B3A' }}>

      {/* ── Rectangular frame ── */}
      <div
        className="absolute pointer-events-none overflow-hidden"
        style={{
          width: 'min(1140px, 94vw)',
          height: 'min(660px, 78vh)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '32px',
          border: '1.5px solid rgba(255,255,255,0.18)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.04), inset 0 0 80px rgba(255,255,255,0.02)',
        }}
      >
        {/* Map */}
        <img
          src="/cambridge-map.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: 0.55,
            filter: 'grayscale(20%) brightness(1.4) contrast(0.95)',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
          }}
        />

        {/* Profile cards — corners, floating */}
        {mockCards.map((p, i) => (
          <div
            key={p.handle}
            className="absolute splash-float"
            style={{
              top: cardPositions[i].top,
              left: cardPositions[i].left,
              animationDuration: floatConfig[i].duration,
              animationDelay: floatConfig[i].delay,
            }}
          >
            <MockProfileCard profile={p} style={{ transform: `rotate(${cardPositions[i].rotate})`, opacity: 0.82 }} />
          </div>
        ))}

        {/* Story circles — middle, floating */}
        {mockCircles.map((p, i) => (
          <div
            key={p.handle}
            className="absolute splash-float"
            style={{
              top: circlePositions[i].top,
              left: circlePositions[i].left,
              animationDuration: floatConfig[i].duration,
              animationDelay: `${parseFloat(floatConfig[i].delay) + 0.6}s`,
            }}
          >
            <MockProfileCircle profile={p} style={{ transform: `rotate(${circlePositions[i].rotate})`, opacity: 0.78 }} />
          </div>
        ))}

        {/* Centre vignette — softened so map breathes */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 44% 70% at 50% 50%, rgba(28,43,58,0.82) 0%, rgba(28,43,58,0.45) 52%, rgba(28,43,58,0.0) 100%)',
          }}
        />
      </div>

      {/* ── Top-left logo ── */}
      <div className="absolute top-5 left-6 z-20 flex items-center gap-2">
        <Star className="w-4 h-4" style={{ color: '#F5B800' }} />
        <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)', fontFamily: "'JetBrains Mono', monospace" }}>
          Punt &amp; Prominence
        </span>
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">

        {/* Location badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-6 text-xs font-medium"
          style={{ background: 'rgba(245,184,0,0.12)', color: '#F5B800', border: '1px solid rgba(245,184,0,0.35)', fontFamily: "'JetBrains Mono', monospace" }}
        >
          <MapPin className="w-3 h-3" />
          Cambridge, UK
        </div>

        {/* Heading */}
        <h1
          className="text-5xl sm:text-6xl font-extrabold text-white mb-4 leading-tight"
          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
        >
          Something<br />
          <span style={{ color: '#F5B800' }}>exciting</span><br />
          is coming.
        </h1>

        {/* Subtitle */}
        <p className="text-white/60 text-base leading-relaxed max-w-sm mb-8" style={{ fontFamily: "'Inter', sans-serif" }}>
          Connecting Cambridge businesses with a community of verified micro-creators.
        </p>

        {/* Email capture */}
        {emailStatus === 'success' ? (
          <div
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(107,230,176,0.12)', border: '1px solid rgba(107,230,176,0.3)', color: '#6BE6B0', fontFamily: "'Inter', sans-serif" }}
          >
            <Check className="w-4 h-4 shrink-0" />
            You&apos;re on the list — we&apos;ll be in touch.
          </div>
        ) : (
          <form onSubmit={handleWaitlist} className="flex items-center gap-2 w-full max-w-sm">
            <input
              type="email"
              required
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailStatus('idle') }}
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: `1px solid ${emailStatus === 'error' ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.15)'}`,
                color: 'white',
                fontFamily: "'Inter', sans-serif",
              }}
            />
            <button
              type="submit"
              disabled={emailStatus === 'loading' || !email}
              className="shrink-0 flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: '#F5B800', color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}
            >
              {emailStatus === 'loading'
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><span>Notify me</span><ArrowRight className="w-3.5 h-3.5" /></>
              }
            </button>
          </form>
        )}

        {emailStatus === 'error' && (
          <p className="text-xs mt-2" style={{ color: 'rgba(248,113,113,0.8)', fontFamily: "'Inter', sans-serif" }}>
            Something went wrong — try again.
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-8 mt-10">
          {[
            { num: '30',   label: 'Verified creators' },
            { num: '30K+', label: 'Local followers'   },
            { num: '20',   label: 'Founding spots'    },
          ].map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-8">
              {i > 0 && <div className="w-px h-8 self-center" style={{ background: 'rgba(255,255,255,0.1)' }} />}
              <div className="flex flex-col items-center">
                <span className="text-2xl font-extrabold text-white leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  {stat.num}
                </span>
                <span className="text-[10px] mt-1 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {stat.label}
                </span>
              </div>
            </div>
          ))}
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
            onSubmit={handlePreview}
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
