import { BadgeCheck } from 'lucide-react'

export interface CreatorCardData {
  id: string
  display_name: string
  instagram_handle: string | null
  tiktok_handle?: string | null
  avatar_url: string | null
  follower_count: number | null
  tiktok_follower_count?: number | null
  bio: string | null
  verified_matches: number
  total_matches: number
}

export function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

export function CreatorCard({ creator, compact = false }: { creator: CreatorCardData; compact?: boolean }) {
  const initials = creator.display_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const igUrl = creator.instagram_handle ? `https://instagram.com/${creator.instagram_handle}` : null
  const totalFollowers = (creator.follower_count ?? 0) + (creator.tiktok_follower_count ?? 0)

  if (compact) {
    return (
      <div
        className="bg-white rounded-2xl flex flex-col items-center overflow-hidden"
        style={{ border: '1px solid rgba(0,0,0,0.07)' }}
      >
        <div className="w-full h-9 shrink-0" style={{ background: 'linear-gradient(135deg, #1C2B3A 0%, #2d4a63 100%)' }} />

        <div className="-mt-6 mb-2 shrink-0">
          <div
            className="p-[2px] rounded-full"
            style={{ background: creator.instagram_handle ? 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' : 'rgba(0,0,0,0.12)' }}
          >
            <div className="p-[1.5px] bg-white rounded-full">
              {creator.avatar_url ? (
                <img src={creator.avatar_url} alt={creator.display_name} className="w-11 h-11 rounded-full object-cover block" />
              ) : (
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}>
                  {initials}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center px-3 gap-0.5 mb-2">
          <div className="flex items-center gap-1">
            <p className="font-bold text-[#1C2B3A] text-xs leading-tight text-center" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {creator.display_name}
            </p>
            {creator.verified_matches > 0 && <BadgeCheck className="w-3 h-3 shrink-0" style={{ color: '#6BE6B0' }} />}
          </div>
          {creator.instagram_handle && (
            <p className="text-[10px]" style={{ color: '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}>
              @{creator.instagram_handle}
            </p>
          )}
        </div>

        <div className="w-full flex items-stretch" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          {[
            { value: totalFollowers > 0 ? formatFollowers(totalFollowers) : '—', label: 'Followers' },
            { value: creator.total_matches, label: 'Collabs' },
            { value: creator.verified_matches, label: 'Verified' },
          ].map((stat, i) => (
            <div key={stat.label} className="flex-1 flex flex-col items-center py-2" style={{ borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined }}>
              <span className="font-bold text-xs text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{stat.value}</span>
              <span className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

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
