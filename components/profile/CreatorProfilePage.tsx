'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Pencil, ExternalLink, BadgeCheck, Eye, AlertCircle, CheckCircle2 } from 'lucide-react'
import { ProfileForm, type ProfileFormData } from './ProfileForm'
import { CloseAccountSection } from '@/components/account/CloseAccountSection'

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

interface Props {
  profile: ProfileFormData
  userId: string
  isComplete: boolean
  isApproved: boolean
}

export function CreatorProfilePage({ profile: initial, userId, isComplete, isApproved }: Props) {
  const [editing, setEditing] = useState(!isComplete)
  const [profile, setProfile] = useState(initial)

  const initials = profile.display_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const hasIg = !!profile.instagram_handle && (profile.follower_count ?? 0) > 0
  const hasTt = !!profile.tiktok_handle && (profile.tiktok_follower_count ?? 0) > 0
  const websiteDomain = profile.website_url
    ? profile.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : null

  // Profile completeness hints
  const missing: string[] = []
  if (!profile.bio) missing.push('bio')
  if (!profile.avatar_url) missing.push('photo')
  if (!profile.instagram_handle) missing.push('Instagram handle')
  if (!profile.follower_count) missing.push('follower count')

  function handleSaved(data: ProfileFormData) {
    setProfile(data)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {isComplete ? 'Edit profile' : 'Complete your profile'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isComplete ? 'Businesses see this when you claim their collabs.' : 'Businesses want to see your Instagram before matching with you.'}
            </p>
          </div>
          {isComplete && (
            <button
              onClick={() => setEditing(false)}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Cancel
            </button>
          )}
        </div>
        <ProfileForm role="creator" userId={userId} initial={profile} onSaved={handleSaved} />
        <div className="mt-10"><CloseAccountSection /></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">How businesses see you when you claim a collab.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/creator/profile/preview"
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:bg-gray-50"
            style={{ border: '1.5px solid rgba(28,43,58,0.1)', color: '#6b7280', fontFamily: "'Inter', sans-serif" }}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </Link>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:bg-[#1C2B3A] hover:text-white"
            style={{ border: '1.5px solid rgba(28,43,58,0.15)', color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>
      </div>

      {/* Profile completeness nudge */}
      {missing.length > 0 && (
        <button
          onClick={() => setEditing(true)}
          className="w-full flex items-start gap-3 rounded-2xl px-4 py-3 mb-5 text-left transition-all hover:opacity-90"
          style={{ background: 'rgba(245,184,0,0.08)', border: '1.5px solid rgba(245,184,0,0.3)' }}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#b45309' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Your profile is incomplete
            </p>
            <p className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
              Add your {missing.join(', ')} to improve your chances of being matched.
            </p>
          </div>
          <span className="text-xs font-semibold shrink-0 mt-0.5" style={{ color: '#b45309' }}>Fix →</span>
        </button>
      )}

      {/* Profile card */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 8px 40px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.06)' }}
      >
        {/* Hero band */}
        <div className="relative" style={{ height: '80px' }}>
          <div
            className="absolute inset-0"
            style={{
              background: profile.instagram_handle
                ? 'linear-gradient(135deg, #833ab4 0%, #c2185b 50%, #f57c00 100%)'
                : 'linear-gradient(135deg, #1C2B3A 0%, #2d4a63 60%, #1a3a52 100%)',
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

          {/* Avatar */}
          <div className="absolute left-6" style={{ bottom: 0, transform: 'translateY(50%)' }}>
            <div
              className="p-[3px] rounded-full"
              style={{
                background: profile.instagram_handle
                  ? 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)'
                  : 'rgba(255,255,255,0.25)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
              }}
            >
              <div className="p-[2.5px] bg-white rounded-full">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name} className="w-20 h-20 rounded-full object-cover block" />
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

          {/* Approval badge — top right of band */}
          <div
            className="absolute right-4 top-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            {isApproved ? (
              <>
                <BadgeCheck className="w-3 h-3 text-[#6BE6B0]" />
                <span className="text-[10px] font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Approved
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-[#F5B800] animate-pulse" />
                <span className="text-[10px] font-bold text-white/80" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Under review
                </span>
              </>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pt-12 pb-6 flex flex-col gap-5">

          {/* Name + handle */}
          <div>
            <h2
              className="text-2xl font-bold text-[#1C2B3A] leading-tight"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              {profile.display_name}
            </h2>
            {profile.instagram_handle && (
              <a
                href={`https://instagram.com/${profile.instagram_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm mt-0.5 hover:underline inline-block"
                style={{ color: '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}
              >
                @{profile.instagram_handle}
                {profile.tiktok_handle && (
                  <span className="ml-2 opacity-60">· @{profile.tiktok_handle}</span>
                )}
              </a>
            )}
          </div>

          {/* Platform reach pills — combine reach + links */}
          {(hasIg || hasTt || profile.instagram_handle || profile.tiktok_handle || profile.website_url) && (
            <div className="flex items-center gap-3 flex-wrap">
              {hasIg && (
                <a
                  href={`https://instagram.com/${profile.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, rgba(131,58,180,0.08), rgba(253,29,29,0.06), rgba(252,176,69,0.06))', border: '1.5px solid rgba(131,58,180,0.18)' }}
                >
                  <span className="text-[11px] font-black" style={{ color: '#833ab4', fontFamily: "'JetBrains Mono', monospace" }}>IG</span>
                  <div>
                    <p className="text-xl font-extrabold text-[#1C2B3A] leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                      {fmt(profile.follower_count!)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>followers</p>
                  </div>
                  <ExternalLink className="w-3 h-3 ml-1 opacity-30" />
                </a>
              )}
              {!hasIg && profile.instagram_handle && (
                <a
                  href={`https://instagram.com/${profile.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                  style={{ background: 'linear-gradient(135deg, rgba(131,58,180,0.08), rgba(253,29,29,0.06))', border: '1px solid rgba(131,58,180,0.2)', color: '#833ab4', fontFamily: "'Inter', sans-serif" }}
                >
                  <span className="text-xs font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>IG</span>
                  @{profile.instagram_handle}
                  <ExternalLink className="w-3 h-3 opacity-40" />
                </a>
              )}
              {hasTt && (
                <a
                  href={`https://tiktok.com/@${profile.tiktok_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all hover:opacity-90"
                  style={{ background: 'rgba(1,1,1,0.04)', border: '1.5px solid rgba(0,0,0,0.1)' }}
                >
                  <span className="text-[11px] font-black text-[#1C2B3A]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>TT</span>
                  <div>
                    <p className="text-xl font-extrabold text-[#1C2B3A] leading-none" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                      {fmt(profile.tiktok_follower_count!)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide" style={{ fontFamily: "'JetBrains Mono', monospace" }}>TikTok</p>
                  </div>
                  <ExternalLink className="w-3 h-3 ml-1 opacity-30" />
                </a>
              )}
              {!hasTt && profile.tiktok_handle && (
                <a
                  href={`https://tiktok.com/@${profile.tiktok_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                  style={{ background: 'rgba(1,1,1,0.05)', border: '1px solid rgba(1,1,1,0.12)', color: '#010101', fontFamily: "'Inter', sans-serif" }}
                >
                  <span className="text-xs font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>TT</span>
                  @{profile.tiktok_handle}
                </a>
              )}
              {websiteDomain && (
                <a
                  href={profile.website_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-blue-600 transition-all hover:opacity-80"
                  style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)', fontFamily: "'Inter', sans-serif" }}
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  {websiteDomain}
                </a>
              )}
            </div>
          )}

          {/* Bio */}
          {profile.bio ? (
            <div
              className="rounded-2xl px-4 py-3.5"
              style={{ background: 'rgba(28,43,58,0.03)', borderLeft: '3px solid rgba(107,230,176,0.5)' }}
            >
              <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                {profile.bio}
              </p>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-2xl px-4 py-3.5 text-left transition-all hover:opacity-80 w-full"
              style={{ background: 'rgba(0,0,0,0.02)', border: '1.5px dashed rgba(0,0,0,0.1)', borderLeft: '3px solid rgba(0,0,0,0.08)' }}
            >
              <span className="text-sm text-gray-400 italic" style={{ fontFamily: "'Inter', sans-serif" }}>
                Add a bio — businesses read this before deciding to match with you.
              </span>
            </button>
          )}

          {/* Profile checklist */}
          <div
            className="rounded-2xl px-4 py-4"
            style={{ background: '#fafafa', border: '1px solid rgba(0,0,0,0.06)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Profile strength
            </p>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Profile photo',      done: !!profile.avatar_url },
                { label: 'Bio',                done: !!profile.bio },
                { label: 'Instagram handle',   done: !!profile.instagram_handle },
                { label: 'Follower count',     done: (profile.follower_count ?? 0) > 0 },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2.5">
                  {item.done ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#22c55e' }} />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ border: '1.5px solid rgba(0,0,0,0.15)' }} />
                  )}
                  <span
                    className="text-xs"
                    style={{ color: item.done ? '#374151' : '#9ca3af', fontFamily: "'Inter', sans-serif" }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            {missing.length === 0 ? (
              <p className="text-[10px] mt-3 font-semibold" style={{ color: '#22c55e', fontFamily: "'JetBrains Mono', monospace" }}>
                ✓ Profile complete
              </p>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="mt-3 text-[10px] font-semibold hover:opacity-70 transition-opacity"
                style={{ color: '#b45309', fontFamily: "'JetBrains Mono', monospace" }}
              >
                Complete your profile →
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <CloseAccountSection />
      </div>
    </div>
  )
}
