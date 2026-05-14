'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Heart, MessageSquare, Star, Check, Building2, Sparkles } from 'lucide-react'
import { CreatorCard, formatFollowers, type CreatorCardData } from '@/components/creators/CreatorCard'

// ─── Static data ──────────────────────────────────────────────────────────────

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

const hoverCards = [
  {
    title: 'Verified Cambridge audiences',
    body: 'No inflated follower counts. No out-of-area reach. Just real Cambridge people who follow someone they trust.',
  },
  {
    title: 'Real influence, not just numbers',
    body: "Our creators have 1,000–10,000 followers with genuine engagement — the kind of trust a paid ad can't buy.",
  },
  {
    title: 'Zero-risk guarantee',
    body: "If a creator visits and doesn't post within 72 hours, we'll reimburse the full value of what you offered. Great content, or your money back.",
  },
]

const places = [
  'Mill Road', 'Newnham', 'Castle Hill', 'Romsey', 'Chesterton',
  'Coleridge', 'Cherry Hinton', 'Trumpington', 'Arbury', 'King Hedges',
  'Mill Road', 'Newnham', 'Castle Hill', 'Romsey', 'Chesterton',
  'Coleridge', 'Cherry Hinton', 'Trumpington', 'Arbury', 'King Hedges',
]

// Mock creators — real profiles slot in from the front as they join
const MOCK_CREATORS: CreatorCardData[] = [
  {
    id: 'mock-1',
    display_name: 'Priya Sharma',
    instagram_handle: 'priya.eats.cam',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
    follower_count: 4200,
    tiktok_follower_count: null,
    bio: 'Cambridge food lover & local dining guide. Sharing the best bites Mill Road has to offer.',
    verified_matches: 3,
    total_matches: 4,
  },
  {
    id: 'mock-2',
    display_name: 'Tom Bradley',
    instagram_handle: 'tomincambridge',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
    follower_count: 2800,
    tiktok_follower_count: 1400,
    bio: 'Lifestyle & culture in Cambridge. Always hunting for hidden gems worth talking about.',
    verified_matches: 1,
    total_matches: 2,
  },
  {
    id: 'mock-3',
    display_name: 'Aisha Osei',
    instagram_handle: 'aisha.local',
    avatar_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
    follower_count: 6100,
    tiktok_follower_count: 3800,
    bio: 'Beauty, wellness & Cambridge life. Trusted by thousands of locals since 2021.',
    verified_matches: 5,
    total_matches: 7,
  },
  {
    id: 'mock-4',
    display_name: 'Jack Morrison',
    instagram_handle: 'cambridgemarket',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
    follower_count: 3400,
    tiktok_follower_count: null,
    bio: 'Covering events, markets and local spots. Cambridge born and bred.',
    verified_matches: 2,
    total_matches: 3,
  },
  {
    id: 'mock-5',
    display_name: 'Sophie Chen',
    instagram_handle: 'millroadfood',
    avatar_url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
    follower_count: 5200,
    tiktok_follower_count: 2100,
    bio: 'Food photography & restaurant reviews. Mill Road is my happy place.',
    verified_matches: 4,
    total_matches: 5,
  },
  {
    id: 'mock-6',
    display_name: 'Emma Davies',
    instagram_handle: 'camcreates',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
    follower_count: 3900,
    tiktok_follower_count: null,
    bio: 'Arts, crafts & creative Cambridge. Supporting independent businesses I love.',
    verified_matches: 0,
    total_matches: 1,
  },
  {
    id: 'mock-7',
    display_name: 'Marcus Williams',
    instagram_handle: 'cambridgenights',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
    follower_count: 2100,
    tiktok_follower_count: 4600,
    bio: 'Nightlife, bars & live music. Your guide to what\'s on in Cambridge after dark.',
    verified_matches: 2,
    total_matches: 3,
  },
  {
    id: 'mock-8',
    display_name: 'Lena Müller',
    instagram_handle: 'cam.eats',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
    follower_count: 7300,
    tiktok_follower_count: null,
    bio: 'Plant-based dining & café culture in Cambridge. Finding the best flat whites since 2020.',
    verified_matches: 6,
    total_matches: 8,
  },
  {
    id: 'mock-9',
    display_name: 'Olivia Nash',
    instagram_handle: 'sundaycam',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
    follower_count: 1800,
    tiktok_follower_count: 2900,
    bio: 'Slow Sundays, brunch spots & weekend finds. Cambridge is full of surprises.',
    verified_matches: 0,
    total_matches: 1,
  },
  {
    id: 'mock-10',
    display_name: 'Isabelle Laurent',
    instagram_handle: 'cambridgelens',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=100&h=100',
    follower_count: 5500,
    tiktok_follower_count: 1200,
    bio: 'Photography & visual storytelling. Cambridge through my lens, one shot at a time.',
    verified_matches: 3,
    total_matches: 4,
  },
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

function ValuePostCard({ p, card }: { p: Post; card: { title: string; body: string } }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="relative group w-full h-full cursor-pointer select-none"
      style={{ padding: '2px', background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)', borderRadius: '14px' }}
      onClick={() => setOpen(o => !o)}
    >
      <div className="relative w-full h-full overflow-hidden" style={{ borderRadius: '12px' }}>
        <img src={p.poster} alt="" className="w-full h-full object-cover" />

        <div
          className={`absolute inset-0 flex flex-col justify-center px-4 py-4 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          style={{ background: 'rgba(28,43,58,0.92)' }}
        >
          <p className="font-bold text-white text-sm leading-snug mb-2.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {card.title}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)', fontFamily: "'Inter', sans-serif" }}>
            {card.body}
          </p>
        </div>

        <div
          className={`absolute top-0 left-0 right-0 flex items-center justify-end gap-1.5 px-2 py-2 transition-opacity duration-200 ${open ? 'opacity-0' : 'group-hover:opacity-0'}`}
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)' }}
        >
          <span className="text-white font-semibold truncate" style={{ fontSize: '13px', fontFamily: "'Inter', sans-serif", textShadow: '0 1px 3px rgba(0,0,0,0.6)', maxWidth: '120px' }}>
            {p.handle}
          </span>
          <img src={p.profilePic} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" style={{ border: '2px solid rgba(255,255,255,0.95)', boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }} />
        </div>

        <div
          className={`absolute bottom-0 left-0 right-0 flex items-center gap-3 px-2.5 py-2 transition-opacity duration-200 ${open ? 'opacity-0' : 'group-hover:opacity-0'}`}
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)' }}
        >
          <span className="flex items-center gap-1 text-white font-semibold" style={{ fontSize: '13px', fontFamily: "'Inter', sans-serif", textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            <Heart className="w-3.5 h-3.5 fill-white" /> {p.likes}
          </span>
          <span className="flex items-center gap-1 text-white font-semibold" style={{ fontSize: '13px', fontFamily: "'Inter', sans-serif", textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            <MessageSquare className="w-3.5 h-3.5 text-white" /> {p.comments}
          </span>
        </div>

        <div className={`md:hidden absolute bottom-2 right-2 transition-opacity duration-200 ${open ? 'opacity-0' : 'opacity-100'}`}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,184,0,0.9)' }}>
            <Star className="w-3 h-3" style={{ color: '#1C2B3A' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Roundabout carousel ──────────────────────────────────────────────────────

const RB_CARD_W   = 220   // natural card width — no extra CSS scale applied
const RB_RADIUS_X = 420   // wider ellipse to give full-size cards room
const RB_RADIUS_Z = 100
const RB_H        = 340
const RB_SPEED    = 0.18  // auto-spin rad/s (~35s per rotation)

function CreatorRoundabout({ creators }: { creators: CreatorCardData[] }) {
  const angleRef  = useRef(Math.PI / 2)
  const velRef    = useRef(0)
  const dragging  = useRef(false)
  const lastX     = useRef(0)
  const cardRefs  = useRef<(HTMLDivElement | null)[]>([])
  const wrapRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const n = creators.length
    if (!n) return
    let last = performance.now()
    let raf: number
    const TAU = Math.PI * 2

    function paint() {
      const base = angleRef.current
      cardRefs.current.forEach((el, i) => {
        if (!el) return
        const theta = base + (TAU * i / n)
        const sinT  = Math.sin(theta)
        const cosT  = Math.cos(theta)
        const x  = cosT * RB_RADIUS_X
        const z  = sinT * RB_RADIUS_Z
        const t  = (sinT + 1) / 2
        const sc = 0.55 + t * 0.45
        const op = 0.28 + t * 0.72
        const zi = Math.round(t * 100)

        el.style.opacity  = String(op)
        el.style.zIndex   = String(zi)
        el.style.transform =
          `translateX(calc(-50% + ${x}px)) translateY(-50%) translateZ(${z}px) scale(${sc})`
      })
    }

    function tick(now: number) {
      const dt = now - last
      last = now
      if (!dragging.current) {
        if (Math.abs(velRef.current) > 0.0005) {
          angleRef.current += velRef.current * dt / 1000
          velRef.current   *= Math.pow(0.88, dt / 16.67)
        } else {
          velRef.current    = 0
          angleRef.current += RB_SPEED * dt / 1000
        }
      }
      paint()
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [creators.length])

  const SENSITIVITY = 0.004

  function onDown(x: number) {
    dragging.current = true
    lastX.current    = x
    velRef.current   = 0
    if (wrapRef.current) wrapRef.current.style.cursor = 'grabbing'
  }

  function onMove(x: number) {
    if (!dragging.current) return
    const dx         = x - lastX.current
    lastX.current    = x
    angleRef.current -= dx * SENSITIVITY
    velRef.current   = -dx * SENSITIVITY * 60
  }

  function onUp() {
    dragging.current = false
    if (wrapRef.current) wrapRef.current.style.cursor = 'grab'
  }

  return (
    <div
      ref={wrapRef}
      style={{ background: '#1C2B3A', padding: '28px 0', cursor: 'grab', userSelect: 'none' }}
      onMouseDown={e => onDown(e.clientX)}
      onMouseMove={e => onMove(e.clientX)}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onTouchStart={e => onDown(e.touches[0].clientX)}
      onTouchMove={e => { e.preventDefault(); onMove(e.touches[0].clientX) }}
      onTouchEnd={onUp}
    >
      <div
        className="relative mx-auto overflow-hidden"
        style={{ height: `${RB_H}px`, perspective: '1200px', perspectiveOrigin: '50% 50%' }}
      >
        {creators.map((creator, i) => (
          <div
            key={creator.id}
            ref={el => { cardRefs.current[i] = el }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: `${RB_CARD_W}px`,
              willChange: 'transform, opacity',
              pointerEvents: 'none',
            }}
          >
            <CreatorCard creator={creator} />
          </div>
        ))}
      </div>

      <p className="text-center mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: "'JetBrains Mono', monospace" }}>
        drag to spin
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [realCreators, setRealCreators] = useState<CreatorCardData[]>([])

  useEffect(() => {
    fetch('/api/public/creators')
      .then(r => r.json())
      .then(d => setRealCreators(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  // Real creators fill from the front; mocks pad the rest up to 10 slots
  const displayCreators = realCreators.length >= MOCK_CREATORS.length
    ? realCreators
    : [...realCreators, ...MOCK_CREATORS.slice(realCreators.length)]

  const totalFollowers      = displayCreators.reduce((s, c) => s + (c.follower_count ?? 0) + (c.tiktok_follower_count ?? 0), 0)
  const totalVerifiedCollabs = displayCreators.reduce((s, c) => s + c.verified_matches, 0)

  // Stats for the "Proudly Cambridge" section use real data where available
  const liveStats = [
    { num: realCreators.length > 0 ? `${realCreators.length}+` : '30+', label: 'Verified creators', sub: 'joining at launch' },
    { num: realCreators.length > 0 ? `${formatFollowers(realCreators.reduce((s, c) => s + (c.follower_count ?? 0) + (c.tiktok_follower_count ?? 0), 0))}+` : '30K+', label: 'Combined local reach', sub: 'Cambridge followers across the network' },
    { num: '20', label: 'Founding business spots', sub: 'available this year' },
  ]

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

        {/* Post grid */}
        <div className="w-full md:flex-shrink-0 md:w-auto">
          <div className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-6 px-6 pb-2" style={{ scrollbarWidth: 'none' } as React.CSSProperties}>
            {posts.slice(0, 3).map((p, i) => (
              <div key={p.handle} className="snap-center flex-shrink-0" style={{ width: '72vw', height: '72vw', maxWidth: '260px', maxHeight: '260px' }}>
                <ValuePostCard p={p} card={hoverCards[i]} />
              </div>
            ))}
            {posts.slice(3).map(p => (
              <div key={p.handle} className="snap-center flex-shrink-0" style={{ width: '72vw', height: '72vw', maxWidth: '260px', maxHeight: '260px' }}>
                <PostCard p={p} />
              </div>
            ))}
            <div className="flex-shrink-0 w-2" aria-hidden />
          </div>
          <div className="hidden md:grid grid-cols-3 gap-3" style={{ width: '609px' }}>
            {posts.slice(0, 3).map((p, i) => (
              <div key={p.handle} style={{ width: '195px', height: '195px' }}>
                <ValuePostCard p={p} card={hoverCards[i]} />
              </div>
            ))}
            {posts.slice(3).map(p => (
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

      {/* ── Proudly Cambridge ── */}
      <section className="py-24 px-6" style={{ backgroundColor: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-4">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(0,0,0,0.35)' }}>
              Cambridge-first
            </span>
          </div>
          <h2 className="mb-4 leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(2.2rem, 5vw, 3.75rem)', fontWeight: 800, color: '#1C2B3A' }}>
            Proudly Cambridge.
          </h2>
          <div className="w-16 h-1 mb-10 rounded-full" style={{ background: '#F5B800' }} />

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-lg leading-relaxed mb-10" style={{ color: 'rgb(107,114,128)', fontFamily: "'Inter', sans-serif" }}>
                We&apos;re building the most focused creator network in the UK — 30 verified Cambridge creators, a combined local reach of 30,000 local followers, and just 20 founding business spots. Small by design. Effective by necessity.
              </p>
              <div className="grid grid-cols-3 gap-4 sm:gap-6">
                {liveStats.map(s => (
                  <div key={s.label}>
                    <div className="mb-1 leading-none font-bold" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', color: '#F5B800' }}>{s.num}</div>
                    <div className="text-sm font-semibold mb-0.5" style={{ color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}>{s.label}</div>
                    <div className="text-xs" style={{ color: 'rgba(0,0,0,0.4)', fontFamily: "'Inter', sans-serif" }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
              <img src="/cambridge-map.png" alt="Cambridge city map" className="w-full h-auto object-cover" style={{ opacity: 0.85, filter: 'grayscale(10%) brightness(1.05) contrast(0.95)' }} />
              {realCreators.slice(0, 4).map((c, i) => ({
                avatar: c.avatar_url,
                handle: c.instagram_handle ? `@${c.instagram_handle}` : c.display_name,
                top: ['12%', '22%', '58%', '68%'][i],
                left: ['18%', '62%', '38%', '70%'][i],
              })).map(c => (
                <div
                  key={c.handle}
                  className="absolute flex flex-col items-center gap-1"
                  style={{ top: c.top, left: c.left, transform: 'translate(-50%, -50%)' }}
                >
                  <div className="p-[2.5px] rounded-full shadow-lg" style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}>
                    <div className="p-[2px] rounded-full" style={{ background: '#ffffff' }}>
                      {c.avatar ? (
                        <img src={c.avatar} alt={c.handle} className="w-10 h-10 rounded-full object-cover block" />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}>
                          {c.handle.slice(0, 2).toUpperCase()}
                        </div>
                      )}
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

      {/* ── Meet the creators ── */}
      <section style={{ background: '#1C2B3A', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Header — heading left, stats right */}
        <div className="max-w-5xl mx-auto px-6 pt-10 pb-5">
          <div className="flex items-start justify-between gap-8">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase mb-3 block" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.35)' }}>
                Meet the creators
              </span>
              <h2 className="mb-3 leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(1.9rem, 4vw, 3rem)', fontWeight: 800, color: '#ffffff' }}>
                Meet our creators.
              </h2>
              <div className="w-12 h-1 rounded-full mb-3" style={{ background: '#F5B800' }} />
              <p className="text-sm max-w-sm" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'Inter', sans-serif" }}>
                Cambridge-based content creators ready to showcase local businesses. All verified, all local.
              </p>
            </div>

            {/* Stats — top right */}
            <div className="hidden sm:flex flex-col gap-4 flex-shrink-0 pt-1 text-right">
              {[
                { value: formatFollowers(totalFollowers) + '+', label: 'Combined followers' },
                { value: String(displayCreators.length) + '+', label: 'Active creators' },
                { value: String(totalVerifiedCollabs), label: 'Verified collabs' },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold leading-none" style={{ color: '#F5B800', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                    {stat.value}
                  </p>
                  <p className="text-[10px] mt-0.5 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Full-width carousel */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <CreatorRoundabout creators={displayCreators} />
        </div>

        {/* Footer link */}
        <div className="max-w-5xl mx-auto px-6 py-5">
          <Link
            href="/creators"
            className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:opacity-80"
            style={{ color: '#ffffff', fontFamily: "'Inter', sans-serif", border: '1px solid rgba(255,255,255,0.2)' }}
          >
            View all creators →
          </Link>
        </div>
      </section>

      {/* ── Join the platform ── */}
      <section style={{ backgroundColor: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="overflow-hidden py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex gap-8 whitespace-nowrap" style={{ animation: 'marquee 30s linear infinite' }}>
            {places.map((p, i) => (
              <span key={i} className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(0,0,0,0.18)' }}>
                <span style={{ color: '#F5B800' }}>·</span> {p}
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
              <div className="w-12 h-1 rounded-full mb-4" style={{ background: '#F5B800' }} />
              <p className="text-base leading-relaxed" style={{ color: 'rgb(107,114,128)', fontFamily: "'Inter', sans-serif" }}>
                We&apos;re opening the doors to a small group of Cambridge businesses and creators this year. Get early access, shape the product, and lock in founder pricing.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <Link
                href="/signup?role=business"
                className="flex items-center gap-4 p-5 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: '#1C2B3A' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,184,0,0.15)' }}>
                  <Building2 className="w-5 h-5" style={{ color: '#F5B800' }} />
                </div>
                <div>
                  <p className="font-semibold mb-0.5" style={{ color: '#ffffff', fontFamily: "'Bricolage Grotesque', sans-serif" }}>Join as a business</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'Inter', sans-serif" }}>Post collabs and get matched with Cambridge creators</p>
                </div>
              </Link>
              <Link
                href="/signup?role=creator"
                className="flex items-center gap-4 p-5 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: '#1C2B3A' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(107,230,176,0.15)' }}>
                  <Sparkles className="w-5 h-5" style={{ color: '#6BE6B0' }} />
                </div>
                <div>
                  <p className="font-semibold mb-0.5" style={{ color: '#ffffff', fontFamily: "'Bricolage Grotesque', sans-serif" }}>Join as a creator</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'Inter', sans-serif" }}>Browse and claim exclusive Cambridge business offers</p>
                </div>
              </Link>
              <div className="flex items-start gap-2.5 rounded-xl px-4 py-3" style={{ background: 'rgba(245,184,0,0.08)', border: '1px solid rgba(245,184,0,0.25)' }}>
                <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#F5B800' }} />
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(28,43,58,0.6)', fontFamily: "'Inter', sans-serif" }}>
                  <span className="font-semibold" style={{ color: '#1C2B3A' }}>Zero-risk guarantee — </span>
                  if a creator visits and doesn&apos;t post, we reimburse the full value.
                </p>
              </div>
              <p className="text-xs text-center" style={{ color: 'rgba(0,0,0,0.3)', fontFamily: "'Inter', sans-serif" }}>
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
