'use client'
import Link from 'next/link'
import { Heart, MessageSquare, Star } from 'lucide-react'

const posts = [
  {
    video: '/videos/v1.mp4',
    poster: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=400&h=400',
    profilePic: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
    handle: '@priya.eats.cam',
    likes: '1,204',
    comments: '38',
  },
  {
    video: '/videos/v2.mp4',
    poster: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=400&h=400',
    profilePic: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
    handle: '@tomincambridge',
    likes: '892',
    comments: '21',
  },
  {
    video: '/videos/v3.mp4',
    poster: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=400&h=400',
    profilePic: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
    handle: '@aisha.local',
    likes: '2,451',
    comments: '64',
  },
  {
    video: '/videos/v4.mp4',
    poster: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=400&h=400',
    profilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
    handle: '@cambridgemarket',
    likes: '743',
    comments: '17',
  },
  {
    video: '/videos/v5.mp4',
    poster: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=400&h=400',
    profilePic: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
    handle: '@sundaybrunchcam',
    likes: '3,109',
    comments: '92',
  },
  {
    video: '/videos/v6.mp4',
    poster: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=400&h=400',
    profilePic: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
    handle: '@cambridgenights',
    likes: '1,876',
    comments: '45',
  },
]

type Post = typeof posts[0]

function PostCard({ p }: { p: Post }) {
  return (
    <div
      className="relative group w-full h-full"
      style={{ padding: '2px', background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)', borderRadius: '14px' }}
      onMouseEnter={e => (e.currentTarget.querySelector('video') as HTMLVideoElement)?.play()}
      onMouseLeave={e => {
        const v = e.currentTarget.querySelector('video') as HTMLVideoElement
        if (v) { v.pause(); v.load() }
      }}
    >
      <div className="relative w-full h-full overflow-hidden" style={{ borderRadius: '12px' }}>
        <video
          src={p.video}
          poster={p.poster}
          muted
          loop
          playsInline
          preload="none"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-end gap-1.5 px-2 py-2"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)' }}
        >
          <span
            className="text-white font-semibold truncate"
            style={{ fontSize: '13px', fontFamily: "'Inter', sans-serif", textShadow: '0 1px 3px rgba(0,0,0,0.6)', maxWidth: '120px' }}
          >
            {p.handle}
          </span>
          <img
            src={p.profilePic}
            alt={p.handle}
            className="w-11 h-11 rounded-full object-cover flex-shrink-0"
            style={{ border: '2px solid rgba(255,255,255,0.95)', boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }}
          />
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center gap-3 px-2.5 py-2 group-hover:opacity-0 transition-opacity duration-200"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)' }}
        >
          <span className="flex items-center gap-1 text-white font-semibold" style={{ fontSize: '13px', fontFamily: "'Inter', sans-serif", textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            <Heart className="w-3.5 h-3.5 fill-white" /> {p.likes}
          </span>
          <span className="flex items-center gap-1 text-white font-semibold" style={{ fontSize: '13px', fontFamily: "'Inter', sans-serif", textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            <MessageSquare className="w-3.5 h-3.5 text-white" /> {p.comments}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1C2B3A' }}>

      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: 'rgba(28,43,58,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'JetBrains Mono', monospace" }}>
          <Star className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" style={{ color: '#F5B800' }} />
          Punt &amp; Prominence
        </span>
        <Link
          href="/login"
          className="text-sm transition-colors"
          style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'Inter', sans-serif" }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
        >
          Sign in →
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col md:flex-row md:items-center max-w-7xl mx-auto w-full px-6 pt-24 md:pt-28 pb-12 md:pb-16 gap-10 md:gap-16">

        {/* Left: text */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-7">
            <span className="text-xs tracking-[0.15em] uppercase" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.35)' }}>
              VOL.&nbsp;01 — CAMBRIDGE
            </span>
          </div>

          <h1
            className="mb-6 leading-[1.05] tracking-tight"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(2.2rem, 5.5vw, 5rem)', fontWeight: 800, color: '#ffffff' }}
          >
            Local, credible creators working for your business.
          </h1>

          <p className="mb-8 text-base leading-relaxed max-w-md" style={{ color: 'rgb(153,153,153)', fontFamily: "'Inter', sans-serif" }}>
            Hand verified Cambridge creators. Reviewed continuously. At your disposal.
          </p>

          <div className="flex flex-wrap gap-3 mb-6">
            <Link
              href="/signup?role=business"
              className="px-6 py-3 rounded-md font-semibold text-sm transition-all hover:opacity-90"
              style={{ background: '#F5B800', color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}
            >
              I&apos;m a business →
            </Link>
            <Link
              href="/signup?role=creator"
              className="px-6 py-3 rounded-md font-semibold text-sm transition-all hover:opacity-90"
              style={{ background: '#6BE6B0', color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}
            >
              I&apos;m a creator →
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {['+ 20 founding spots', '+ £0 setup', '+ Cambridge-only network'].map(tag => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-md text-xs font-medium"
                style={{ fontFamily: "'JetBrains Mono', monospace", background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Right: post grid */}
        <div className="w-full md:flex-shrink-0 md:w-auto">

          {/* Mobile: swipeable carousel */}
          <div
            className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-6 px-6 pb-2"
            style={{ scrollbarWidth: 'none' } as React.CSSProperties}
          >
            {posts.map(p => (
              <div
                key={p.handle}
                className="snap-center flex-shrink-0"
                style={{ width: '72vw', height: '72vw', maxWidth: '260px', maxHeight: '260px' }}
              >
                <PostCard p={p} />
              </div>
            ))}
            <div className="flex-shrink-0 w-2" aria-hidden />
          </div>

          {/* Desktop: 3×2 grid */}
          <div className="hidden md:grid grid-cols-3 gap-3" style={{ width: '609px' }}>
            {posts.map(p => (
              <div key={p.handle} style={{ width: '195px', height: '195px' }}>
                <PostCard p={p} />
              </div>
            ))}
          </div>

          <div className="mt-3 px-0.5">
            <span className="text-xs md:text-sm" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif" }}>
              Examples of the content your business could inspire
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#111c26', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>
              ★ Punt &amp; Prominence
            </span>
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem' }} className="hidden sm:inline">|</span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
              © {new Date().getFullYear()} Hare House Consulting Ltd. All rights reserved.
            </span>
          </div>
          <a
            href="mailto:hello@puntandprominence.co.uk"
            className="transition-colors"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >
            Contact
          </a>
        </div>
      </footer>
    </div>
  )
}
