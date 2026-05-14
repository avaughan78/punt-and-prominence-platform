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
        <div className="mt-12"><CloseAccountSection /></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">Creators see this when they browse your collabs.</p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:bg-[#1C2B3A] hover:text-white group"
          style={{ border: '1.5px solid rgba(28,43,58,0.15)', color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit profile
        </button>
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
            style={{ background: 'linear-gradient(120deg, #1C2B3A 0%, #243d56 100%)' }}
          />
          {/* Subtle gold accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-[1.5px]" style={{ background: 'linear-gradient(90deg, transparent 10%, #F5B800 40%, #F5B800 60%, transparent 90%)', opacity: 0.5 }} />

          {/* Avatar */}
          <div className="absolute left-6" style={{ bottom: 0, transform: 'translateY(50%)' }}>
            <div
              className="p-[2.5px] rounded-full"
              style={{ background: profile.instagram_handle ? 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' : 'rgba(255,255,255,0.2)', boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}
            >
              <div className="p-[2px] bg-white rounded-full">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={bizName} className="w-20 h-20 rounded-full object-cover block" />
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

          {/* Name + category row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#1C2B3A] leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {bizName}
              </h2>
              {profile.display_name && profile.business_name && (
                <p className="text-sm text-gray-400 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{profile.display_name}</p>
              )}
            </div>
            {profile.category && <CategoryBadge category={profile.category} />}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>About</p>
              <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>{profile.bio}</p>
            </div>
          )}

          {/* Location + map */}
          {profile.address_line && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Location</p>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(245,184,0,0.1)' }}>
                  <MapPin className="w-4 h-4" style={{ color: '#F5B800' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1C2B3A]" style={{ fontFamily: "'Inter', sans-serif" }}>{profile.address_line}</p>
                  {mapsUrl && (
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-0.5 inline-block">
                      Open in Google Maps →
                    </a>
                  )}
                </div>
              </div>
              {profile.latitude && profile.longitude && (
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <iframe
                    title="Business location"
                    width="100%"
                    height="200"
                    style={{ display: 'block', border: 'none' }}
                    src={`https://maps.google.com/maps?q=${profile.latitude},${profile.longitude}&z=16&output=embed`}
                  />
                </div>
              )}
            </div>
          )}

          {/* Social links */}
          {(profile.instagram_handle || profile.website_url) && (
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
