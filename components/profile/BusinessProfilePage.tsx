'use client'
import { useState } from 'react'
import { MapPin, Pencil, ExternalLink } from 'lucide-react'
import { ProfileForm, type ProfileFormData } from './ProfileForm'
import { CloseAccountSection } from '@/components/account/CloseAccountSection'
import { CategoryBadge } from '@/components/ui/Badge'

interface Props {
  profile: ProfileFormData
  userId: string
  isComplete: boolean
}

export function BusinessProfilePage({ profile: initial, userId, isComplete }: Props) {
  const [editing, setEditing] = useState(!isComplete)
  const [profile, setProfile] = useState(initial)

  const bizName = profile.business_name || profile.display_name
  const initials = bizName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const mapsUrl = profile.latitude && profile.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${profile.latitude},${profile.longitude}`
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
              {isComplete ? 'Creators see this when they browse your collabs.' : 'Creators need to see who you are before they can match with you.'}
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
        <ProfileForm role="business" userId={userId} initial={profile} onSaved={handleSaved} />
        <CloseAccountSection />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Creators see this when they browse your collabs.</p>
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
                  <img src={profile.avatar_url} alt={bizName} className="w-14 h-14 rounded-full object-cover block" />
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
          <div>
            <p className="font-bold text-lg text-[#1C2B3A] leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {bizName}
            </p>
            {profile.display_name && profile.business_name && (
              <p className="text-xs text-gray-400 mt-0.5">{profile.display_name}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {profile.category && <CategoryBadge category={profile.category} />}
              {mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
                >
                  <MapPin className="w-3 h-3 shrink-0" />
                  {profile.address_line}
                </a>
              ) : profile.address_line ? (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {profile.address_line}
                </span>
              ) : null}
            </div>
          </div>

          {profile.bio && (
            <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
              {profile.bio}
            </p>
          )}

          {(profile.instagram_handle || profile.website_url) && (
            <div className="flex items-center gap-4 pt-1 flex-wrap">
              {profile.instagram_handle && (
                <a
                  href={`https://instagram.com/${profile.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium hover:opacity-70 transition-opacity"
                  style={{ color: '#833ab4' }}
                >
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>IG</span>
                  @{profile.instagram_handle}
                </a>
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
          )}
        </div>
      </div>

      <div className="mt-8">
        <CloseAccountSection />
      </div>
    </div>
  )
}
