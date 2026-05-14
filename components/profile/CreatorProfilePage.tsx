'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Pencil, ExternalLink, BadgeCheck, Eye } from 'lucide-react'
import { ProfileForm, type ProfileFormData } from './ProfileForm'
import { CloseAccountSection } from '@/components/account/CloseAccountSection'

function formatFollowers(n: number): string {
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
  const totalFollowers = (profile.follower_count ?? 0) + (profile.tiktok_follower_count ?? 0)
  const websiteDomain = profile.website_url
    ? profile.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : null

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
          <p className="text-sm text-gray-500 mt-0.5">Businesses see this when you claim their collabs.</p>
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
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:bg-[#1C2B3A] hover:text-white group"
            style={{ border: '1.5px solid rgba(28,43,58,0.15)', color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>
      </div>

      {/* Profile card */}
      <div
        className="bg-white rounded-3xl overflow-hidden"
        style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 8px 40px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.06)' }}
      >
        {/* Hero band */}
        <div className="relative" style={{ height: '72px' }}>
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #1C2B3A 0%, #2d4a63 60%, #1a3a52 100%)' }}
          />
          {/* Mint accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #6BE6B0 30%, #6BE6B0 70%, transparent)' }} />

          {/* Avatar */}
          <div className="absolute left-6" style={{ bottom: 0, transform: 'translateY(50%)' }}>
            <div
              className="p-[3px] rounded-full"
              style={{ background: profile.instagram_handle ? 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' : 'rgba(255,255,255,0.25)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
            >
              <div className="p-[2.5px] bg-white rounded-full">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name} className="w-20 h-20 rounded-full object-cover block" />
                ) : (
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}>
                    {initials}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pt-12 pb-6 flex flex-col gap-6">

          {/* Name + approval */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold text-[#1C2B3A] leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {profile.display_name}
              </h2>
              {isApproved ? (
                <BadgeCheck className="w-6 h-6 shrink-0" style={{ color: '#6BE6B0' }} />
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" style={{ background: 'rgba(245,184,0,0.12)', color: '#b45309', fontFamily: "'JetBrains Mono', monospace" }}>
                  Under review
                </span>
              )}
            </div>
            {profile.instagram_handle && (
              <a
                href={`https://instagram.com/${profile.instagram_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs mt-0.5 hover:underline inline-block"
                style={{ color: '#9ca3af', fontFamily: "'JetBrains Mono', monospace" }}
              >
                @{profile.instagram_handle}
              </a>
            )}
          </div>

          {/* Follower stats */}
          {totalFollowers > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Reach</p>
              <div className="flex items-center gap-8">
                {profile.follower_count != null && profile.follower_count > 0 && (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: '#833ab4', fontFamily: "'JetBrains Mono', monospace" }}>IG</span>
                      <span className="text-2xl font-extrabold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                        {formatFollowers(profile.follower_count)}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>followers</p>
                  </div>
                )}
                {profile.tiktok_follower_count != null && profile.tiktok_follower_count > 0 && (
                  <>
                    {profile.follower_count != null && profile.follower_count > 0 && (
                      <div className="w-px h-8 self-center" style={{ background: 'rgba(0,0,0,0.06)' }} />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: '#010101', fontFamily: "'JetBrains Mono', monospace" }}>TT</span>
                        <span className="text-2xl font-extrabold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                          {formatFollowers(profile.tiktok_follower_count)}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>TikTok</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>About</p>
              <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{profile.bio}</p>
            </div>
          )}

          {/* Links */}
          {(profile.instagram_handle || profile.website_url || profile.tiktok_handle) && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Links</p>
              <div className="flex gap-3 flex-wrap">
                {profile.instagram_handle && (
                  <a
                    href={`https://instagram.com/${profile.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                    style={{ background: 'linear-gradient(135deg, rgba(131,58,180,0.08), rgba(253,29,29,0.08), rgba(252,176,69,0.08))', border: '1px solid rgba(131,58,180,0.2)', color: '#833ab4', fontFamily: "'Inter', sans-serif" }}
                  >
                    <span className="text-xs font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>IG</span>
                    @{profile.instagram_handle}
                  </a>
                )}
                {profile.tiktok_handle && (
                  <a
                    href={`https://tiktok.com/@${profile.tiktok_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                    style={{ background: 'rgba(1,1,1,0.05)', border: '1px solid rgba(1,1,1,0.12)', color: '#010101', fontFamily: "'Inter', sans-serif" }}
                  >
                    <span className="text-xs font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>TT</span>
                    @{profile.tiktok_handle}
                  </a>
                )}
                {profile.website_url && (
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-blue-600 transition-all hover:opacity-80"
                    style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)', fontFamily: "'Inter', sans-serif" }}
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    {websiteDomain}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        <CloseAccountSection />
      </div>
    </div>
  )
}
