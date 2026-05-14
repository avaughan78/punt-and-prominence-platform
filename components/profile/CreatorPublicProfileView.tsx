'use client'
import { useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, ArrowLeft, ExternalLink, Eye, ChevronDown } from 'lucide-react'
import { CategoryBadge } from '@/components/ui/Badge'
import { formatGBP, formatDate } from '@/lib/utils'

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  pending:   { label: 'In progress', bg: 'rgba(245,184,0,0.12)',   text: '#b45309' },
  visited:   { label: 'Visited',     bg: 'rgba(99,102,241,0.1)',   text: '#4f46e5' },
  posted:    { label: 'Post ready',  bg: 'rgba(192,132,252,0.12)', text: '#9333ea' },
  verified:  { label: 'Verified',    bg: 'rgba(34,197,94,0.1)',    text: '#16a34a' },
  active:    { label: 'Active',      bg: 'rgba(107,230,176,0.12)', text: '#059669' },
  completed: { label: 'Completed',   bg: 'rgba(148,163,184,0.12)', text: '#64748b' },
}

export interface CreatorPublicData {
  id: string
  display_name: string
  instagram_handle: string | null
  tiktok_handle: string | null
  avatar_url: string | null
  follower_count: number | null
  tiktok_follower_count: number | null
  bio: string | null
  website_url: string | null
}

export interface PublicDeliverable {
  id: string
  month_number: number
  post_url: string
  status: string
}

export interface PublicMatch {
  id: string
  status: string
  created_at: string
  post_url: string | null
  offer: {
    title: string
    value_gbp: number
    fee_gbp: number | null
    invite_type: string
    category: string
  } | null
  deliverables?: PublicDeliverable[]
}

const POSTS_PAGE = 12

interface Props {
  creator: CreatorPublicData
  matches: PublicMatch[]
  backHref: string
  backLabel: string
  isSelf?: boolean
}

export function CreatorPublicProfileView({ creator, matches, backHref, backLabel, isSelf = false }: Props) {
  const [postsVisible, setPostsVisible] = useState(POSTS_PAGE)

  // Collect all submitted/verified posts across one-offs and retainer deliverables
  const allPosts: { url: string; title: string; date: string; verified: boolean }[] = []
  for (const m of matches) {
    if (m.post_url && (m.status === 'posted' || m.status === 'verified')) {
      allPosts.push({
        url: m.post_url,
        title: m.offer?.title ?? 'Collab',
        date: m.created_at,
        verified: m.status === 'verified',
      })
    }
    for (const d of m.deliverables ?? []) {
      allPosts.push({
        url: d.post_url,
        title: `${m.offer?.title ?? 'Retainer'} · Month ${d.month_number}`,
        date: m.created_at,
        verified: d.status === 'verified',
      })
    }
  }
  allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const visiblePosts = allPosts.slice(0, postsVisible)

  const totalMatches = matches.length
  const verifiedMatches = matches.filter(m => m.status === 'verified' || m.status === 'completed').length
  const activeMatches = matches.filter(m => !['verified', 'completed'].includes(m.status)).length
  const totalFollowers = (creator.follower_count ?? 0) + (creator.tiktok_follower_count ?? 0)

  const initials = creator.display_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const igUrl = creator.instagram_handle ? `https://instagram.com/${creator.instagram_handle}` : null

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-[#1C2B3A] mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {backLabel}
      </Link>

      {/* Self-view banner */}
      {isSelf && (
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-5"
          style={{ background: 'rgba(107,230,176,0.1)', border: '1.5px solid rgba(107,230,176,0.3)' }}
        >
          <Eye className="w-4 h-4 shrink-0" style={{ color: '#059669' }} />
          <p className="text-sm text-[#1C2B3A]" style={{ fontFamily: "'Inter', sans-serif" }}>
            <span className="font-semibold">This is how businesses see you.</span>{' '}
            Keep your bio, photo, and follower count up to date to make a great first impression.
          </p>
        </div>
      )}

      {/* Profile card */}
      <div
        className="bg-white rounded-2xl overflow-hidden mb-5"
        style={{ border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
      >
        {/* Header band */}
        <div
          className="h-24"
          style={{
            background: creator.instagram_handle
              ? 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)'
              : 'linear-gradient(135deg, #1C2B3A 0%, #2d4a63 100%)',
          }}
        />

        <div className="px-6 pb-6">
          {/* Avatar + IG link */}
          <div className="-mt-10 mb-4 flex items-end justify-between">
            <div
              className="p-[3px] rounded-full"
              style={{ background: creator.instagram_handle ? 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' : 'rgba(0,0,0,0.12)' }}
            >
              <div className="p-[2.5px] bg-white rounded-full">
                {creator.avatar_url ? (
                  <img src={creator.avatar_url} alt={creator.display_name} className="w-20 h-20 rounded-full object-cover block" />
                ) : (
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}>
                    {initials}
                  </div>
                )}
              </div>
            </div>

            {igUrl && (
              <a
                href={igUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)' }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Instagram
              </a>
            )}
          </div>

          {/* Name + handles */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {creator.display_name}
              </h1>
              {verifiedMatches > 0 && <BadgeCheck className="w-5 h-5 shrink-0" style={{ color: '#6BE6B0' }} />}
            </div>
            {creator.instagram_handle && (
              <p className="text-sm" style={{ color: '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}>
                @{creator.instagram_handle}
              </p>
            )}
            {creator.tiktok_handle && (
              <p className="text-xs mt-0.5" style={{ color: '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}>
                TikTok: @{creator.tiktok_handle}
              </p>
            )}
          </div>

          {/* Bio */}
          {creator.bio && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
              {creator.bio}
            </p>
          )}

          {/* Website */}
          {creator.website_url && (
            <a
              href={creator.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline mb-4"
              style={{ color: '#3b82f6' }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {creator.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
          )}

          {/* Stats row */}
          <div
            className="grid grid-cols-4 rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(0,0,0,0.08)' }}
          >
            {[
              { label: 'Followers', value: totalFollowers > 0 ? fmt(totalFollowers) : '—' },
              { label: 'Collabs',   value: totalMatches },
              { label: 'Verified',  value: verifiedMatches },
              { label: 'Active',    value: activeMatches },
            ].map((s, i) => (
              <div
                key={s.label}
                className="flex flex-col items-center py-3"
                style={{ borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined }}
              >
                <span className="font-bold text-base text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  {s.value}
                </span>
                <span className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Posts grid */}
      {allPosts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Posts
            </h2>
            <span className="text-xs text-gray-400">{allPosts.length} total</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {visiblePosts.map((post, i) => (
              <a
                key={i}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ border: '1px solid rgba(0,0,0,0.08)' }}
              >
                <div
                  className="h-2 w-full"
                  style={{
                    background: post.verified
                      ? '#22c55e'
                      : 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
                  }}
                />
                <div className="bg-white px-3 py-2.5 flex items-center gap-2">
                  <ExternalLink className="w-3 h-3 shrink-0 text-gray-300 group-hover:text-blue-400 transition-colors" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#1C2B3A] truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
                      {post.title}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {post.url.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 40)}
                    </p>
                  </div>
                  {post.verified && (
                    <BadgeCheck className="w-3.5 h-3.5 shrink-0 ml-auto" style={{ color: '#22c55e' }} />
                  )}
                </div>
              </a>
            ))}
          </div>

          {postsVisible < allPosts.length && (
            <button
              onClick={() => setPostsVisible(v => v + POSTS_PAGE)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:text-[#1C2B3A] transition-colors"
              style={{ border: '1px solid rgba(0,0,0,0.08)' }}
            >
              <ChevronDown className="w-3.5 h-3.5" />
              Show more posts ({allPosts.length - postsVisible} remaining)
            </button>
          )}
        </div>
      )}

      {/* Collab history */}
      <div>
        <h2 className="font-semibold text-[#1C2B3A] mb-3" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          Collab history
        </h2>

        {matches.length === 0 ? (
          <div className="rounded-2xl p-8 text-center text-sm text-gray-400" style={{ border: '1.5px dashed rgba(0,0,0,0.1)' }}>
            {isSelf ? 'Your completed collabs will appear here.' : 'No collabs yet.'}
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
            {[...matches]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((m, i) => {
                const meta = STATUS_META[m.status] ?? STATUS_META.pending
                const isRetainer = m.offer?.invite_type === 'retainer'
                const value = isRetainer ? (m.offer?.fee_gbp ?? 0) : (m.offer?.value_gbp ?? 0)
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 px-4 py-3 bg-white"
                    style={{ borderBottom: i < matches.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1C2B3A] truncate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                        {m.offer?.title ?? 'Unknown collab'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {m.offer?.category && <CategoryBadge category={m.offer.category} className="py-0 px-1.5 text-[10px]" />}
                        <span className="text-xs text-gray-400">{formatDate(m.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-xs font-semibold" style={{ color: isRetainer ? '#059669' : '#b45309' }}>
                        {formatGBP(value)}{isRetainer ? '/mo' : ''}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: meta.bg, color: meta.text, fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}
