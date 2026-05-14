'use client'
import { useState } from 'react'
import { Pencil, ExternalLink, BadgeCheck } from 'lucide-react'
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
        <CloseAccountSection />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Businesses see this when you claim their collabs.</p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:bg-gray-50"
          style={{ border: '1px solid rgba(0,0,0,0.1)', color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit profile
        </button>
      </div>

      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
      >
        {/* Band */}
        <div className="relative shrink-0" style={{ height: '72px' }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1C2B3A 0%, #2d4a63 100%)' }} />
          {/* Avatar */}
          <div className="absolute left-4" style={{ bottom: 0, transform: 'translateY(50%)' }}>
            <div
              className="p-[2.5px] rounded-full"
              style={{ background: profile.instagram_handle ? 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' : 'rgba(255,255,255,0.2)' }}
            >
              <div className="p-[2px] bg-white rounded-full">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name} className="w-14 h-14 rounded-full object-cover block" />
                ) : (
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-white" style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}>
                    {initials}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pt-10 pb-5 flex flex-col gap-3">
          {/* Name + handle + approval status */}
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-bold text-lg text-[#1C2B3A] leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {profile.display_name}
              </p>
              {isApproved && (
                <BadgeCheck className="w-5 h-5 shrink-0" style={{ color: '#6BE6B0' }} />
              )}
              {!isApproved && (
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
            <div className="flex items-center gap-6 py-3 border-t border-b border-black/5">
              {profile.follower_count != null && profile.follower_count > 0 && (
                <div>
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#833ab4' }}>IG</span>
                    <span className="font-bold text-sm text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                      {formatFollowers(profile.follower_count)}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>followers</p>
                </div>
              )}
              {profile.tiktok_follower_count != null && profile.tiktok_follower_count > 0 && (
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold" style={{ color: '#010101' }}>TT</span>
                    <span className="font-bold text-sm text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                      {formatFollowers(profile.tiktok_follower_count)}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>TikTok</p>
                </div>
              )}
            </div>
          )}

          {profile.bio && (
            <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
              {profile.bio}
            </p>
          )}

          {profile.website_url && (
            <a
              href={profile.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {profile.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
          )}
        </div>
      </div>

      <div className="mt-8">
        <CloseAccountSection />
      </div>
    </div>
  )
}
