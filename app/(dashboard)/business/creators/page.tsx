'use client'
import { useEffect, useState } from 'react'
import { Search, BadgeCheck, Bell, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

function ConditionalLink({ href, className, children }: { href: string | null; className?: string; children: React.ReactNode }) {
  if (!href) return <>{children}</>
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
}

interface Creator {
  id: string
  display_name: string
  instagram_handle: string | null
  avatar_url: string | null
  follower_count: number | null
  bio: string | null
  website_url: string | null
  verified_matches: number
  total_matches: number
  nudged: boolean
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

function CreatorCard({ creator }: { creator: Creator }) {
  const router = useRouter()
  const [nudging, setNudging] = useState(false)
  const [nudged, setNudged] = useState(creator.nudged)

  async function handleNudge() {
    setNudging(true)
    const res = await fetch(`/api/business/creators/${creator.id}/nudge`, { method: 'POST' })
    const body = await res.json().catch(() => ({}))
    if (res.ok) {
      setNudged(true)
      toast.success(`Nudge sent to ${creator.display_name}`)
    } else {
      toast.error(body.error ?? 'Failed to send nudge')
    }
    setNudging(false)
  }
  const initials = creator.display_name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const igUrl = creator.instagram_handle
    ? `https://instagram.com/${creator.instagram_handle}`
    : null

  return (
    <div
      className="bg-white rounded-2xl flex flex-col items-center overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        border: creator.instagram_handle ? '1.5px solid transparent' : '1px solid rgba(0,0,0,0.07)',
        background: creator.instagram_handle
          ? 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045) border-box'
          : 'white',
      }}
    >
      {/* Top gradient band — Instagram gradient if creator has a handle */}
      <div
        className="w-full h-14 shrink-0"
        style={{
          background: creator.instagram_handle
            ? 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)'
            : 'linear-gradient(135deg, #1C2B3A 0%, #2d4a63 100%)',
        }}
      />

      {/* Avatar — overlapping the band, links to Instagram if available */}
      <div className="-mt-8 mb-3 shrink-0">
        <ConditionalLink href={igUrl} className="block">
          <div
            className="p-[2.5px] rounded-full"
            style={{ background: creator.instagram_handle ? 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' : 'rgba(0,0,0,0.12)' }}
          >
            <div className="p-[2px] bg-white rounded-full">
              {creator.avatar_url ? (
                <img
                  src={creator.avatar_url}
                  alt={creator.display_name}
                  className="w-16 h-16 rounded-full object-cover block"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-base font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}
                >
                  {initials}
                </div>
              )}
            </div>
          </div>
        </ConditionalLink>
      </div>

      {/* Name + handle */}
      <div className="flex flex-col items-center px-4 gap-0.5 mb-4">
        <div className="flex items-center gap-1">
          <p className="font-bold text-[#1C2B3A] text-sm leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {creator.display_name}
          </p>
          {creator.verified_matches > 0 && (
            <BadgeCheck className="w-4 h-4 shrink-0" style={{ color: '#6BE6B0' }} />
          )}
        </div>
        {creator.instagram_handle && (
          <a
            href={igUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs hover:underline"
            style={{ color: '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}
          >
            @{creator.instagram_handle}
          </a>
        )}
      </div>

      {/* Stats row */}
      <div className="w-full flex items-stretch" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        {[
          { value: creator.follower_count != null ? formatFollowers(creator.follower_count) : '—', label: 'Followers' },
          { value: creator.total_matches,    label: 'Collabs' },
          { value: creator.verified_matches, label: 'Verified' },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="flex-1 flex flex-col items-center py-3"
            style={{ borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined }}
          >
            <span className="font-bold text-sm text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {stat.value}
            </span>
            <span className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Bio + website */}
      <div className="px-4 pt-3 pb-4 flex flex-col items-center gap-1.5 w-full flex-1">
        {creator.bio && (
          <p className="text-xs text-gray-500 leading-relaxed text-center line-clamp-4 w-full" style={{ fontFamily: "'Inter', sans-serif" }}>
            {creator.bio}
          </p>
        )}
        {creator.website_url && (
          <a
            href={creator.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium hover:underline"
            style={{ color: '#3b82f6', fontFamily: "'Inter', sans-serif" }}
          >
            <span className="truncate max-w-[160px]">
              {creator.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </span>
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 w-full flex flex-col gap-2">
        <button
          type="button"
          onClick={() => router.push(`/business/creators/${creator.id}`)}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold text-center transition-all"
          style={{ background: 'rgba(28,43,58,0.06)', color: '#1C2B3A' }}
        >
          <User className="w-3 h-3" />
          View profile
        </button>
        <button
          type="button"
          onClick={handleNudge}
          disabled={nudging || nudged}
          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold text-center transition-all disabled:opacity-50"
          style={{ background: nudged ? 'rgba(107,230,176,0.15)' : '#F5B800', color: nudged ? '#059669' : '#1C2B3A' }}
        >
          <Bell className="w-3 h-3" />
          {nudged ? 'Nudge sent' : nudging ? 'Sending…' : 'Nudge creator'}
        </button>
      </div>
    </div>
  )
}

export default function BusinessCreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/business/creators')
      .then(r => r.json())
      .then(d => { setCreators(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = creators.filter(c => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.display_name.toLowerCase().includes(q) ||
      c.instagram_handle?.toLowerCase().includes(q) ||
      c.bio?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Creators</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading…' : `${creators.length} approved creator${creators.length !== 1 ? 's' : ''} on the platform`}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="search"
            placeholder="Search creators…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm rounded-xl border border-black/10 outline-none focus:border-[#F5B800] w-52 transition-colors"
            style={{ fontFamily: "'Inter', sans-serif" }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-[#F5B800] border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ border: '1.5px dashed rgba(0,0,0,0.1)' }}>
          <p className="text-sm text-gray-400">
            {search ? 'No creators match your search.' : 'No creators on the platform yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map(creator => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      )}
    </div>
  )
}
