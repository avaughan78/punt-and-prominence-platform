'use client'
import Link from 'next/link'
import { Heart, MessageSquare, Star, Check, Building2, Sparkles, BadgeCheck, MapPin } from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────

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

const valueCards = [
  {
    title: 'Verified Cambridge audiences',
    body: 'No inflated follower counts. No out-of-area reach. Just real Cambridge people who follow someone they trust.',
  },
  {
    title: 'Real influence, not just numbers',
    body: "Our creators have 1,000–10,000 followers with genuine engagement — the kind of trust a paid ad can't buy.",
  },
  {
    title: 'Foot traffic you can measure',
    body: 'Every match comes with a unique Punt Code and QR tracking so you can see exactly what each post drove to your door.',
  },
  {
    title: 'Content from the inside out',
    body: 'Not a brief sent remotely. Not stock footage. A real person, in your space, living the experience — and that authenticity shows.',
  },
]

const stats = [
  { num: '30+',  label: 'Verified creators',      sub: 'joining at launch' },
  { num: '30K+', label: 'Combined local reach',    sub: 'Cambridge followers across the network' },
  { num: '20',   label: 'Founding business spots', sub: 'available this year' },
]

const featuredCreators = [
  {
    name: 'Priya Sharma',
    handle: '@priya.eats.cam',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
    niche: 'Food & Dining',
    followers: '1.2K',
    localAudience: '84%',
    collabs: 4,
  },
  {
    name: 'Aisha Rahman',
    handle: '@aisha.local',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
    niche: 'Lifestyle',
    followers: '2.4K',
    localAudience: '79%',
    collabs: 7,
  },
  {
    name: 'Tom Whitfield',
    handle: '@tomincambridge',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
    niche: 'Arts & Culture',
    followers: '892',
    localAudience: '91%',
    collabs: 2,
  },
  {
    name: 'Emma Clarke',
    handle: '@sundaybrunchcam',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
    niche: 'Food & Brunch',
    followers: '3.1K',
    localAudience: '76%',
    collabs: 9,
  },
]

const places = [
  'Mill Road', 'Newnham', 'Castle Hill', 'Romsey', 'Chesterton',
  'Coleridge', 'Cherry Hinton', 'Trumpington', 'Arbury', 'King Hedges',
  'Mill Road', 'Newnham', 'Castle Hill', 'Romsey', 'Chesterton',
  'Coleridge', 'Cherry Hinton', 'Trumpington', 'Arbury', 'King Hedges',
]

// ─── Sub-components ───────────────────────────────────────────────────────────

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
        <video src={p.video} poster={p.poster} muted loop playsInline preload="none" className="w-full h-full object-cover" />
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-end gap-1.5 px-2 py-2"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)' }}
        >
          <span className="text-white font-semibold truncate" style={{ fontSize: '13px', fontFamily: "'Inter', sans-serif", textShadow: '0 1px 3px rgba(0,0,0,0.6)', maxWidth: '120px' }}>
            {p.handle}
          </span>
          <img src={p.profilePic} alt={p.handle} className="w-11 h-11 rounded-full object-cover flex-shrink-0" style={{ border: '2px solid rgba(255,255,255,0.95)', boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }} />
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

function CreatorCard({ c }: { c: typeof featuredCreators[0] }) {
  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden flex-shrink-0 w-56"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Top band */}
      <div className="h-10 w-full" style={{ background: 'linear-gradient(135deg, #1a3347 0%, #253d54 100%)' }} />
      {/* Avatar */}
      <div className="flex flex-col items-center px-4 pb-5 -mt-6">
        <div className="p-[2.5px] rounded-full mb-2" style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}>
          <div className="p-[2px] rounded-full" style={{ background: '#1e3348' }}>
            <img src={c.avatar} alt={c.name} className="w-12 h-12 rounded-full object-cover block" />
          </div>
        </div>
        <div className="flex items-center gap-1 mb-0.5">
          <span className="text-sm font-bold text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{c.name}</span>
          <BadgeCheck className="w-3.5 h-3.5 shrink-0" style={{ color: '#6BE6B0' }} />
        </div>
        <span className="text-xs mb-3" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.4)' }}>{c.handle}</span>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full mb-4"
          style={{ background: 'rgba(245,184,0,0.12)', color: '#F5B800', border: '1px solid rgba(245,184,0,0.25)', fontFamily: "'JetBrains Mono', monospace" }}
        >
          {c.niche}
        </span>
        <div className="w-full grid grid-cols-3 gap-1" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '12px' }}>
          {[
            { val: c.followers, label: 'Followers' },
            { val: c.localAudience, label: 'Local' },
            { val: String(c.collabs), label: 'Collabs' },
          ].map((s, i) => (
            <div key={s.label} className="flex flex-col items-center" style={{ borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.07)' : undefined }}>
              <span className="text-sm font-bold text-white" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{s.val}</span>
              <span className="text-[9px] uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.3)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1C2B3A' }}>

      {/* ── Nav ── */}
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
          className="text-sm transition-colors hover:text-white"
          style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'Inter', sans-serif" }}
        >
          Sign in →
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="min-h-screen flex flex-col md:flex-row md:items-center max-w-7xl mx-auto w-full px-6 pt-24 md:pt-28 pb-12 md:pb-16 gap-10 md:gap-16">

        {/* Left */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-7">
            <span className="text-xs tracking-[0.15em] uppercase" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.35)' }}>
              VOL.&nbsp;01 — CAMBRIDGE
            </span>
          </div>
          <h1 className="mb-6 leading-[1.05] tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(2.2rem, 5.5vw, 5rem)', fontWeight: 800, color: '#ffffff' }}>
            Local, credible creators working for your business.
          </h1>
          <p className="mb-8 text-base leading-relaxed max-w-md" style={{ color: 'rgb(153,153,153)', fontFamily: "'Inter', sans-serif" }}>
            Hand verified Cambridge creators. Reviewed continuously. At your disposal.
          </p>
          <div className="flex flex-wrap gap-3 mb-6">
            <Link href="/signup?role=business" className="px-6 py-3 rounded-md font-semibold text-sm transition-all hover:opacity-90" style={{ background: '#F5B800', color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}>
              I&apos;m a business →
            </Link>
            <Link href="/signup?role=creator" className="px-6 py-3 rounded-md font-semibold text-sm transition-all hover:opacity-90" style={{ background: '#6BE6B0', color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}>
              I&apos;m a creator →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {['+ 20 founding spots', '+ £0 setup', '+ Cambridge-only network'].map(tag => (
              <span key={tag} className="px-3 py-1.5 rounded-md text-xs font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Right: post grid */}
        <div className="w-full md:flex-shrink-0 md:w-auto">
          {/* Mobile carousel */}
          <div className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-6 px-6 pb-2" style={{ scrollbarWidth: 'none' } as React.CSSProperties}>
            {posts.map(p => (
              <div key={p.handle} className="snap-center flex-shrink-0" style={{ width: '72vw', height: '72vw', maxWidth: '260px', maxHeight: '260px' }}>
                <PostCard p={p} />
              </div>
            ))}
            <div className="flex-shrink-0 w-2" aria-hidden />
          </div>
          {/* Desktop grid */}
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

      {/* ── For businesses ── */}
      <section className="py-24 px-6" style={{ background: 'linear-gradient(160deg, #ffffff 0%, #f0f4f8 100%)', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <span className="text-xs font-bold tracking-widest uppercase mb-4 block" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(0,0,0,0.35)' }}>
              For Cambridge businesses
            </span>
            <h2 className="mb-3 leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(2rem, 4.5vw, 4rem)', fontWeight: 800, color: '#1C2B3A' }}>
              A curated pool of influential local creators — bespoke marketing built around your business.
            </h2>
            <div className="w-12 h-1 rounded-full" style={{ background: '#F5B800' }} />
          </div>

          <div className="grid md:grid-cols-4 gap-5 mb-12">
            {valueCards.map(card => (
              <div
                key={card.title}
                className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,184,0,0.1)' }}>
                  <Star className="w-4 h-4" style={{ color: '#F5B800' }} />
                </div>
                <h3 className="font-semibold text-xs" style={{ color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}>{card.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: '#666666', fontFamily: "'Inter', sans-serif" }}>{card.body}</p>
              </div>
            ))}
          </div>

          {/* Guarantee bar */}
          <div
            className="rounded-2xl px-8 py-7 flex flex-col sm:flex-row items-start sm:items-center gap-5"
            style={{ background: 'linear-gradient(135deg, #1C2B3A 0%, #253d54 100%)', boxShadow: '0 8px 32px rgba(28,43,58,0.25)' }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(245,184,0,0.2)', border: '1px solid rgba(245,184,0,0.3)' }}>
              <Check className="w-5 h-5" style={{ color: '#F5B800' }} />
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)', fontFamily: "'Inter', sans-serif" }}>
              <span className="font-semibold" style={{ color: '#F5B800' }}>Zero-risk guarantee — </span>
              every match is fully backed. If a creator visits and doesn&apos;t post within 72 hours, we&apos;ll reimburse you the full value of what you offered. Great content, or your money back.
            </p>
          </div>
        </div>
      </section>

      {/* ── Meet the creators ── */}
      <section className="py-24 px-6" style={{ backgroundColor: '#1C2B3A', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-4">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.35)' }}>
              Meet the creators
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <h2 className="leading-tight max-w-xl" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, color: '#ffffff' }}>
              Real Cambridge creators.<br />Verified and ready to work.
            </h2>
            <Link
              href="/signup?role=creator"
              className="shrink-0 text-sm font-semibold px-5 py-2.5 rounded-lg transition-all hover:opacity-90 self-start md:self-auto"
              style={{ background: '#6BE6B0', color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}
            >
              Join as a creator →
            </Link>
          </div>

          {/* Cards — scrollable on mobile, 4-up on desktop */}
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-4" style={{ scrollbarWidth: 'none' } as React.CSSProperties}>
            {featuredCreators.map(c => <CreatorCard key={c.handle} c={c} />)}
          </div>

          <div className="mt-8 flex items-center gap-3">
            <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }} />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'Inter', sans-serif" }}>
              Every creator is Cambridge-based and personally reviewed. Audience demographics verified before onboarding.
            </p>
          </div>
        </div>
      </section>

      {/* ── Proudly Cambridge ── */}
      <section className="py-24 px-6" style={{ backgroundColor: '#1C2B3A' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-4">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.35)' }}>
              Cambridge-first
            </span>
          </div>
          <h2 className="mb-4 leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(2.2rem, 5vw, 3.75rem)', fontWeight: 800, color: '#ffffff' }}>
            Proudly Cambridge.
          </h2>
          <div className="w-16 h-1 mb-10 rounded-full" style={{ background: '#F5B800' }} />

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-lg leading-relaxed mb-10" style={{ color: 'rgb(153,153,153)', fontFamily: "'Inter', sans-serif" }}>
                We&apos;re building the most focused creator network in the UK — 30 verified Cambridge creators, a combined local reach of 30,000 local followers, and just 20 founding business spots. Small by design. Effective by necessity.
              </p>
              <div className="grid grid-cols-3 gap-4 sm:gap-6">
                {stats.map(s => (
                  <div key={s.label}>
                    <div className="mb-1 leading-none font-bold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', color: '#F5B800' }}>{s.num}</div>
                    <div className="text-sm font-semibold mb-0.5" style={{ color: '#ffffff', fontFamily: "'Inter', sans-serif" }}>{s.label}</div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'Inter', sans-serif" }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <img src="/cambridge-map.png" alt="Cambridge city map" className="w-full h-auto object-cover" style={{ opacity: 0.75, filter: 'grayscale(20%) brightness(1.3) contrast(0.9)' }} />
              {/* Profile circles overlaid on the map */}
              {[
                { avatar: featuredCreators[0].avatar, handle: featuredCreators[0].handle, top: '12%',  left: '18%' },
                { avatar: featuredCreators[1].avatar, handle: featuredCreators[1].handle, top: '22%',  left: '62%' },
                { avatar: featuredCreators[2].avatar, handle: featuredCreators[2].handle, top: '58%',  left: '38%' },
                { avatar: featuredCreators[3].avatar, handle: featuredCreators[3].handle, top: '68%',  left: '70%' },
              ].map(c => (
                <div
                  key={c.handle}
                  className="absolute flex flex-col items-center gap-1"
                  style={{ top: c.top, left: c.left, transform: 'translate(-50%, -50%)' }}
                >
                  <div className="p-[2.5px] rounded-full shadow-lg" style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}>
                    <div className="p-[2px] rounded-full" style={{ background: '#1C2B3A' }}>
                      <img src={c.avatar} alt={c.handle} className="w-10 h-10 rounded-full object-cover block" />
                    </div>
                  </div>
                  <span
                    className="text-white text-[9px] font-medium px-1.5 py-0.5 rounded-md whitespace-nowrap"
                    style={{ background: 'rgba(0,0,0,0.55)', fontFamily: "'JetBrains Mono', monospace", backdropFilter: 'blur(4px)' }}
                  >
                    {c.handle}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Join the platform ── */}
      <section className="bg-white" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        {/* Cambridge areas marquee */}
        <div className="overflow-hidden border-b py-3" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <div className="flex gap-8 whitespace-nowrap" style={{ animation: 'marquee 30s linear infinite' }}>
            {places.map((p, i) => (
              <span key={i} className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(0,0,0,0.25)' }}>
                <span style={{ color: '#1C2B3A' }}>·</span> {p}
              </span>
            ))}
          </div>
        </div>

        <div className="py-24 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase mb-4 block" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(0,0,0,0.35)' }}>
                Join the platform
              </span>
              <h2 className="mb-4 leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800, color: '#1C2B3A' }}>
                Ready to get<br />started?
              </h2>
              <p className="text-base leading-relaxed" style={{ color: '#555555', fontFamily: "'Inter', sans-serif" }}>
                We&apos;re opening the doors to a small group of Cambridge businesses and creators this year. Get early access, shape the product, and lock in founder pricing.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <Link
                href="/signup?role=business"
                className="flex items-center gap-4 p-5 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: '#1C2B3A', border: '2px solid rgba(245,184,0,0.3)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,184,0,0.15)' }}>
                  <Building2 className="w-5 h-5" style={{ color: '#F5B800' }} />
                </div>
                <div>
                  <p className="font-semibold text-white mb-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Join as a business</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'Inter', sans-serif" }}>Post invites and get matched with Cambridge creators</p>
                </div>
              </Link>
              <Link
                href="/signup?role=creator"
                className="flex items-center gap-4 p-5 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: '#1C2B3A', border: '2px solid rgba(107,230,176,0.3)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(107,230,176,0.15)' }}>
                  <Sparkles className="w-5 h-5" style={{ color: '#6BE6B0' }} />
                </div>
                <div>
                  <p className="font-semibold text-white mb-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Join as a creator</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'Inter', sans-serif" }}>Browse and claim exclusive Cambridge business offers</p>
                </div>
              </Link>
              <p className="text-xs text-center mt-1" style={{ color: 'rgba(0,0,0,0.3)', fontFamily: "'Inter', sans-serif" }}>
                Already have an account?{' '}
                <Link href="/login" className="font-semibold hover:underline" style={{ color: '#1C2B3A' }}>Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
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
            className="transition-colors hover:text-white/70"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}
          >
            Contact
          </a>
        </div>
      </footer>
    </div>
  )
}
