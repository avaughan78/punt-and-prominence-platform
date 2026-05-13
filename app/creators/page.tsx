import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CreatorCard, formatFollowers } from '@/components/creators/CreatorCard'
import type { CreatorCardData } from '@/components/creators/CreatorCard'

async function getCreators(): Promise<CreatorCardData[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select(`
      id, display_name, instagram_handle, tiktok_handle,
      avatar_url, follower_count, tiktok_follower_count, bio,
      matches:matches!matches_creator_id_fkey(status)
    `)
    .eq('role', 'creator')
    .eq('is_approved', true)
    .not('instagram_handle', 'is', null)
    .order('follower_count', { ascending: false, nullsFirst: false })
    .limit(12)

  return (data ?? []).map(c => ({
    id: c.id,
    display_name: c.display_name,
    instagram_handle: c.instagram_handle,
    tiktok_handle: c.tiktok_handle,
    avatar_url: c.avatar_url,
    follower_count: c.follower_count,
    tiktok_follower_count: c.tiktok_follower_count,
    bio: c.bio,
    verified_matches: (c.matches as { status: string }[]).filter(m => m.status === 'verified').length,
    total_matches: (c.matches as { status: string }[]).length,
  }))
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
        <div className="rounded-2xl p-10 text-center" style={{ background: '#1C2B3A' }}>
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
