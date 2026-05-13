'use client'
import { useEffect, useState } from 'react'
import { ExternalLink, Search } from 'lucide-react'

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
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

function CreatorCard({ creator }: { creator: Creator }) {
  const initials = creator.display_name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className="bg-white rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ border: '1px solid rgba(0,0,0,0.07)' }}
    >
      {/* Avatar + name row */}
      <div className="flex items-center gap-3">
        {creator.avatar_url ? (
          <img
            src={creator.avatar_url}
            alt=""
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}
          >
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-[#1C2B3A] truncate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {creator.display_name}
          </p>
          {creator.instagram_handle && (
            <a
              href={`https://instagram.com/${creator.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#1C2B3A] transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              @{creator.instagram_handle}
            </a>
          )}
        </div>
      </div>

      {/* Follower count */}
      {creator.follower_count != null && (
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(245,184,0,0.1)', color: '#d49700', fontFamily: "'JetBrains Mono', monospace" }}
          >
            {formatFollowers(creator.follower_count)} followers
          </span>
          {creator.verified_matches > 0 && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(107,230,176,0.12)', color: '#059669', fontFamily: "'JetBrains Mono', monospace" }}
            >
              {creator.verified_matches} verified collab{creator.verified_matches !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Bio */}
      {creator.bio && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2" style={{ fontFamily: "'Inter', sans-serif" }}>
          {creator.bio}
        </p>
      )}

      {/* Website */}
      {creator.website_url && (
        <a
          href={creator.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#1C2B3A] transition-colors w-fit"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <ExternalLink className="w-3 h-3 shrink-0" />
          <span className="truncate">{creator.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
        </a>
      )}
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
