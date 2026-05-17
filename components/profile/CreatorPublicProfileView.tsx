'use client'
import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { BadgeCheck, ArrowLeft, ExternalLink, Eye, ChevronDown, Globe } from 'lucide-react'
import { CategoryBadge } from '@/components/ui/Badge'
import { formatGBP, formatDate } from '@/lib/utils'
import { deriveMatchState } from '@/lib/types'

function InstagramIcon({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function TikTokIcon({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.53V6.77a4.85 4.85 0 0 1-1.01-.08z"/>
    </svg>
  )
}

type IconComponent = React.ComponentType<{ className?: string; style?: CSSProperties }>

function detectPlatform(url: string): { Icon: IconComponent; bg: string } {
  if (/instagram\.com/i.test(url)) return { Icon: InstagramIcon, bg: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 55%, #fcb045 100%)' }
  if (/tiktok\.com/i.test(url))    return { Icon: TikTokIcon,   bg: 'linear-gradient(135deg, #010101 0%, #161616 100%)' }
  return { Icon: Globe, bg: 'linear-gradient(135deg, #1C2B3A 0%, #2d4a63 100%)' }
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

const STATE_META: Record<string, { label: string; bg: string; text: string }> = {
  in_progress:  { label: 'In progress', bg: 'rgba(245,184,0,0.12)',   text: '#b45309' },
  needs_review: { label: 'Posts pending', bg: 'rgba(192,132,252,0.12)', text: '#9333ea' },
  up_to_date:   { label: 'All verified', bg: 'rgba(34,197,94,0.1)',    text: '#16a34a' },
  closed:       { label: 'Completed',    bg: 'rgba(148,163,184,0.12)', text: '#64748b' },
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
  month_number: number | null
  post_url: string
  verified_at: string | null
}

export interface PublicMatch {
  id: string
  offer_id: string | null
  closed_at: string | null
  created_at: string
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
  offerLinkBase?: string
}

export function CreatorPublicProfileView({ creator, matches, backHref, backLabel, isSelf = false, offerLinkBase }: Props) {
  const [postsVisible, setPostsVisible] = useState(POSTS_PAGE)

  const allPosts: { url: string; title: string; date: string; verified: boolean; matchId: string }[] = []
  for (const m of matches) {
    for (const d of m.deliverables ?? []) {
      if (d.post_url) {
        const title = d.month_number != null
          ? `${m.offer?.title ?? 'Collab'} · Month ${d.month_number}`
          : (m.offer?.title ?? 'Collab')
        allPosts.push({ url: d.post_url, title, date: m.created_at, verified: !!d.verified_at, matchId: m.id })
      }
    }
  }
  allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const visiblePosts = allPosts.slice(0, postsVisible)

  const totalMatches = matches.length
  const verifiedMatches = matches.filter(m => !!m.closed_at).length
  const activeMatches = matches.filter(m => !m.closed_at).length

  const initials = creator.display_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const igUrl = creator.instagram_handle ? `https://instagram.com/${creator.instagram_handle}` : null
  const ttUrl = creator.tiktok_handle ? `https://tiktok.com/@${creator.tiktok_handle}` : null
  const hasIg = !!creator.instagram_handle && (creator.follower_count ?? 0) > 0
  const hasTt = !!creator.tiktok_handle && (creator.tiktok_follower_count ?? 0) > 0
  const websiteDomain = creator.website_url ? creator.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '') : null

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
        className="rounded-3xl overflow-hidden mb-5"
        style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 8px 40px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.06)' }}
      >
        {/* Hero band */}
        <div className="relative" style={{ height: '80px' }}>
          <div
            className="absolute inset-0"
            style={{
              background: igUrl
                ? 'linear-gradient(135deg, #833ab4 0%, #c2185b 50%, #f57c00 100%)'
                : 'linear-gradient(135deg, #1C2B3A 0%, #2d4a63 100%)',
            }}
          />
          {/* Subtle grid texture */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(255,255,255,0.5) 20px, rgba(255,255,255,0.5) 21px), repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.5) 20px, rgba(255,255,255,0.5) 21px)',
            }}
          />
          {/* Mint accent line */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent 5%, #6BE6B0 30%, #6BE6B0 70%, transparent 95%)', opacity: 0.7 }}
          />

          {/* Avatar — positioned to overlap */}
          <div className="absolute left-6" style={{ bottom: 0, transform: 'translateY(50%)' }}>
            <div
              className="p-[3px] rounded-full"
              style={{
                background: igUrl ? 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' : 'rgba(255,255,255,0.25)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              }}
            >
              <div className="p-[2.5px] bg-white rounded-full">
                {creator.avatar_url ? (
                  <img src={creator.avatar_url} alt={creator.display_name} className="w-20 h-20 rounded-full object-cover block" />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}
                  >
                    {initials}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Verified badge — top right of band */}
          {verifiedMatches > 0 && (
            <div
              className="absolute right-4 top-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <BadgeCheck className="w-3 h-3 text-[#6BE6B0]" />
              <span className="text-[10px] font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Verified creator
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-6 pt-12 pb-6 flex flex-col gap-5">

          {/* Name + category */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1
                className="text-2xl font-bold text-[#1C2B3A] leading-tight"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                {creator.display_name}
              </h1>
              {creator.instagram_handle && (
                <p className="text-sm mt-0.5" style={{ color: '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}>
                  @{creator.instagram_handle}
                  {creator.tiktok_handle && (
                    <span className="ml-2 opacity-60">· @{creator.tiktok_handle}</span>
                  )}
                </p>
              )}
            </div>
            {/* Category badge pulled from first match if available */}
            {matches[0]?.offer?.category && (
              <div className="shrink-0 mt-0.5">
                <CategoryBadge category={matches[0].offer.category} />
              </div>
            )}
          </div>

          {/* Platform reach pills */}
          {(hasIg || hasTt || websiteDomain) && (
            <div className="flex flex-col gap-2">
              {hasIg && (
                <a
                  href={igUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, rgba(131,58,180,0.08), rgba(253,29,29,0.06), rgba(252,176,69,0.06))', border: '1.5px solid rgba(131,58,180,0.18)' }}
                >
                  <InstagramIcon className="w-5 h-5 shrink-0" style={{ color: '#833ab4' }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-extrabold text-[#1C2B3A] leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                      {fmt(creator.follower_count!)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {creator.instagram_handle ? `@${creator.instagram_handle}` : 'followers'}
                    </p>
                  </div>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-30" />
                </a>
              )}
              {hasTt && (
                <a
                  href={ttUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all hover:opacity-90"
                  style={{ background: 'rgba(1,1,1,0.04)', border: '1.5px solid rgba(0,0,0,0.1)' }}
                >
                  <TikTokIcon className="w-5 h-5 shrink-0 text-[#1C2B3A]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-extrabold text-[#1C2B3A] leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                      {fmt(creator.tiktok_follower_count!)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {creator.tiktok_handle ? `@${creator.tiktok_handle}` : 'followers'}
                    </p>
                  </div>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-30" />
                </a>
              )}
              {websiteDomain && (
                <a
                  href={creator.website_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all hover:opacity-80"
                  style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)' }}
                >
                  <Globe className="w-4 h-4 shrink-0 text-blue-500" />
                  <span className="text-sm font-medium text-blue-600 truncate" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {websiteDomain}
                  </span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-30 text-blue-500 ml-auto" />
                </a>
              )}
            </div>
          )}

          {/* Bio */}
          {creator.bio && (
            <div
              className="rounded-2xl px-4 py-3.5"
              style={{ background: 'rgba(28,43,58,0.03)', borderLeft: '3px solid rgba(107,230,176,0.5)' }}
            >
              <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                {creator.bio}
              </p>
            </div>
          )}

          {/* Collab activity strip */}
          {totalMatches > 0 && (
            <div
              className="grid grid-cols-3 rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fafafa' }}
            >
              {[
                { label: 'Collabs', value: totalMatches,   color: '#1C2B3A' },
                { label: 'Verified', value: verifiedMatches, color: '#22c55e' },
                { label: 'Active',   value: activeMatches,   color: '#6BE6B0' },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center py-3.5"
                  style={{ borderLeft: i > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined }}
                >
                  <span
                    className="font-extrabold text-2xl leading-none"
                    style={{ color: s.color, fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    {s.value}
                  </span>
                  <span
                    className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Posts grid */}
      {allPosts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Posts
            </h2>
            <span className="text-xs text-gray-400">{allPosts.length} post{allPosts.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
            {visiblePosts.map((post, i) => {
              const platform = detectPlatform(post.url)
              const Icon = platform.Icon
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ background: '#ffffff', borderBottom: i < visiblePosts.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: platform.bg }}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1C2B3A] truncate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                      {post.title}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {formatDate(post.date)}
                    </p>
                  </div>
                  {post.verified && <BadgeCheck className="w-4 h-4 shrink-0" style={{ color: '#22c55e' }} />}
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-1.5 rounded-lg transition-colors hover:bg-gray-50"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  </a>
                </div>
              )
            })}
          </div>

          {postsVisible < allPosts.length && (
            <button
              onClick={() => setPostsVisible(v => v + POSTS_PAGE)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:text-[#1C2B3A] transition-colors"
              style={{ border: '1px solid rgba(0,0,0,0.08)' }}
            >
              <ChevronDown className="w-3.5 h-3.5" />
              Load more ({allPosts.length - postsVisible} remaining)
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
                const state = deriveMatchState({ closed_at: m.closed_at, deliverables: m.deliverables })
                const meta = STATE_META[state] ?? STATE_META.in_progress
                const isRetainer = m.offer?.invite_type === 'retainer'
                const value = isRetainer ? (m.offer?.fee_gbp ?? 0) : (m.offer?.value_gbp ?? 0)
                return (
                  <div
                    key={m.id}
                    id={`match-${m.id}`}
                    className="flex items-center gap-3 px-4 py-3 bg-white scroll-mt-4"
                    style={{ borderBottom: i < matches.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}
                  >
                    {/* Status dot */}
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: meta.text }}
                    />
                    <div className="flex-1 min-w-0">
                      {offerLinkBase && m.offer_id ? (
                        <Link
                          href={`${offerLinkBase}?open=${m.offer_id}`}
                          className="text-sm font-medium text-[#1C2B3A] truncate block hover:underline underline-offset-2 decoration-gray-300"
                          style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                        >
                          {m.offer?.title ?? 'Unknown collab'}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-[#1C2B3A] truncate" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                          {m.offer?.title ?? 'Unknown collab'}
                        </p>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(m.created_at)}</span>
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
