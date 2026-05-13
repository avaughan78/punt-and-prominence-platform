import Link from 'next/link'
import { BadgeCheck } from 'lucide-react'

interface Creator {
  id: string
  display_name: string
  instagram_handle: string | null
  tiktok_handle: string | null
  avatar_url: string | null
  follower_count: number | null
  tiktok_follower_count: number | null
  bio: string | null
  verified_matches: number
  total_matches: number
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

async function getCreators(): Promise<Creator[]> {
  const base = process.env.APP_URL ?? 'http://localhost:3000'
  try {
    const res = await fetch(`${base}/api/public/creators`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

function CreatorCard({ creator }: { creator: Creator }) {
  const initials = creator.display_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const igUrl = creator.instagram_handle ? `https://instagram.com/${creator.instagram_handle}` : null
  const totalFollowers = (creator.follower_count ?? 0) + (creator.tiktok_follower_count ?? 0)

  return (
    <div
      className="bg-white rounded-2xl flex flex-col items-center overflow-hidden"
      style={{ border: '1px solid rgba(0,0,0,0.07)' }}
    >
      <div className="w-full h-14 shrink-0" style={{ background: 'linear-gradient(135deg, #1C2B3A 0%, #2d4a63 100%)' }} />
      <div className="-mt-8 mb-3 shrink-0">
        <div
          className="p-[2.5px] rounded-full"
          style={{ background: creator.instagram_handle ? 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' : 'rgba(0,0,0,0.12)' }}
        >
          <div className="p-[2px] bg-white rounded-full">
            {creator.avatar_url ? (
              <img src={creator.avatar_url} alt={creator.display_name} className="w-16 h-16 rounded-full object-cover block" />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-base font-bold text-white" style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}>
                {initials}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center px-4 gap-0.5 mb-4">
        <div className="flex items-center gap-1">
          <p className="font-bold text-[#1C2B3A] text-sm leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            {creator.display_name}
          </p>
          {creator.verified_matches > 0 && <BadgeCheck className="w-4 h-4 shrink-0" style={{ color: '#6BE6B0' }} />}
        </div>
        {creator.instagram_handle && (
          <p className="text-xs" style={{ color: '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}>
            @{creator.instagram_handle}
          </p>
        )}
      </div>

      <div className="w-full flex items-stretch" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        {[
          { value: totalFollowers > 0 ? formatFollowers(totalFollowers) : '—', label: 'Followers' },
          { value: creator.total_matches, label: 'Collabs' },
          { value: creator.verified_matches, label: 'Verified' },
        ].map((stat, i) => (
          <div key={stat.label} className="flex-1 flex flex-col items-center py-3" style={{ borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined }}>
            <span className="font-bold text-sm text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{stat.value}</span>
            <span className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="px-4 pt-3 pb-4 flex flex-col items-center gap-2 w-full flex-1">
        {creator.bio && (
          <p className="text-xs text-gray-500 leading-relaxed text-center line-clamp-2 w-full" style={{ fontFamily: "'Inter', sans-serif" }}>
            {creator.bio}
          </p>
        )}
        {igUrl && (
          <a
            href={igUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2 rounded-lg text-xs font-semibold text-center text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)' }}
          >
            View on Instagram
          </a>
        )}
      </div>
    </div>
  )
}

export default async function PublicCreatorsPage() {
  const creators = await getCreators()

  return (
    <div className="min-h-screen" style={{ background: '#f9fafb' }}>
      {/* Header */}
      <div style={{ background: '#1C2B3A' }}>
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <p className="text-sm font-semibold tracking-widest" style={{ color: '#F5B800', fontFamily: "'JetBrains Mono', monospace" }}>★ PUNT & PROMINENCE</p>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: '#F5B800', color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}
          >
            List your business
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1C2B3A] mb-4" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            Meet our creators
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
            Cambridge-based content creators ready to showcase local businesses. All verified, all local.
          </p>
        </div>

        {/* Stats bar */}
        {creators.length > 0 && (
          <div className="flex items-center justify-center gap-8 mb-12 flex-wrap">
            {[
              { value: creators.length, label: 'Active creators' },
              { value: creators.reduce((s, c) => s + (c.follower_count ?? 0) + (c.tiktok_follower_count ?? 0), 0), label: 'Combined followers', format: formatFollowers },
              { value: creators.reduce((s, c) => s + c.verified_matches, 0), label: 'Verified collabs' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  {stat.format ? stat.format(stat.value) : stat.value}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        {creators.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">Creators coming soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-16">
            {creators.map(creator => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: '#1C2B3A' }}
        >
          <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: '#F5B800', fontFamily: "'JetBrains Mono', monospace" }}>FOR CAMBRIDGE BUSINESSES</p>
          <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            Work with these creators
          </h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
            Post an invite, set your budget, and let Cambridge's best creators come to you.
          </p>
          <Link
            href="/signup"
            className="inline-block px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
            style={{ background: '#F5B800', color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}
          >
            Get started — it's free
          </Link>
        </div>
      </div>
    </div>
  )
}
