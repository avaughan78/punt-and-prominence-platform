'use client'
import { useState, useEffect } from 'react'
import { InviteCard } from '@/components/invites/InviteCard'
import { InstagramHandle } from '@/components/ui/InstagramHandle'
import { Button } from '@/components/ui/Button'
import { PuntQRCode } from '@/components/ui/PuntQRCode'
import { Clock, AlertCircle } from 'lucide-react'
import type { Invite } from '@/lib/types'

interface ClaimedData { id: string; punt_code: string }

type Filter = 'all' | 'one_off' | 'retainer' | 'dining' | 'retail' | 'experience' | 'fitness' | 'beauty' | 'other'

const FILTERS: { value: Filter; label: string; bg: string; text: string; activeBg: string; activeText: string }[] = [
  { value: 'all',        label: 'All',        bg: 'rgba(28,43,58,0.06)',    text: '#6b7280', activeBg: '#1C2B3A',  activeText: '#ffffff' },
  { value: 'one_off',    label: 'One-off',    bg: 'rgba(245,184,0,0.1)',    text: '#b45309', activeBg: '#F5B800',  activeText: '#1C2B3A' },
  { value: 'retainer',   label: 'Retainer',   bg: 'rgba(96,165,250,0.12)',  text: '#1d4ed8', activeBg: '#60a5fa',  activeText: '#ffffff' },
  { value: 'dining',     label: 'Dining',     bg: 'rgba(251,146,60,0.14)',  text: '#c2410c', activeBg: '#f97316',  activeText: '#ffffff' },
  { value: 'retail',     label: 'Retail',     bg: 'rgba(167,139,250,0.15)', text: '#6d28d9', activeBg: '#7c3aed',  activeText: '#ffffff' },
  { value: 'experience', label: 'Experience', bg: 'rgba(96,165,250,0.15)',  text: '#1d4ed8', activeBg: '#2563eb',  activeText: '#ffffff' },
  { value: 'fitness',    label: 'Fitness',    bg: 'rgba(74,222,128,0.15)',  text: '#15803d', activeBg: '#16a34a',  activeText: '#ffffff' },
  { value: 'beauty',     label: 'Beauty',     bg: 'rgba(244,114,182,0.15)', text: '#be185d', activeBg: '#db2777',  activeText: '#ffffff' },
  { value: 'other',      label: 'Other',      bg: 'rgba(0,0,0,0.06)',       text: '#6b7280', activeBg: '#6b7280',  activeText: '#ffffff' },
]

function applyFilter(offer: Invite, filter: Filter): boolean {
  if (filter === 'one_off')  return offer.invite_type !== 'retainer'
  if (filter === 'retainer') return offer.invite_type === 'retainer'
  if (filter !== 'all')      return offer.category === filter
  return true
}

export default function BrowsePage() {
  const [offers, setOffers] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [claimed, setClaimed] = useState<ClaimedData | null>(null)
  const [claimedOfferIds, setClaimedOfferIds] = useState<Set<string>>(new Set())
  const [instagramHandle, setInstagramHandle] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>('')
  const [isApproved, setIsApproved] = useState<boolean>(true)
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/invites').then(r => r.json()),
      fetch('/api/profile').then(r => r.json()),
      fetch('/api/matches').then(r => r.json()),
    ]).then(([offersData, profile, matchesData]) => {
      setOffers(Array.isArray(offersData) ? offersData : [])
      if (profile && !profile.error) {
        setInstagramHandle(profile.instagram_handle ?? null)
        setAvatarUrl(profile.avatar_url ?? null)
        setDisplayName(profile.display_name ?? '')
        setIsApproved(profile.is_approved ?? true)
        setIsProfileComplete(!!(profile.instagram_handle && profile.follower_count != null))
      }
      if (Array.isArray(matchesData)) {
        setClaimedOfferIds(new Set(matchesData.map((m: { offer_id: string }) => m.offer_id).filter(Boolean)))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function handleClaimed(data: ClaimedData, inviteId: string) {
    setClaimed(data)
    setClaimedOfferIds(prev => new Set([...prev, inviteId]))
    setOffers(prev => prev.map(o => o.id === inviteId ? { ...o, slots_claimed: o.slots_claimed + 1 } : o))
  }

  const visibleOffers = offers.filter(o => !claimedOfferIds.has(o.id))
  const filteredOffers = visibleOffers.filter(o => applyFilter(o, filter))
  const counts = Object.fromEntries(
    FILTERS.map(f => [f.value, f.value === 'all' ? visibleOffers.length : visibleOffers.filter(o => applyFilter(o, f.value)).length])
  ) as Record<Filter, number>

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Browse Collabs</h1>
        <p className="text-sm text-gray-500 mt-0.5">Claim a collab, visit the business, create content.</p>
      </div>

      {/* Claim success modal */}
      {claimed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-5">
              <h2 className="text-lg font-bold text-[#1C2B3A] mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Collab claimed!</h2>
              <p className="text-sm text-gray-500">Show this to the business when you visit.</p>
            </div>

            {/* Creator identity */}
            <div className="flex justify-center mb-5">
              {instagramHandle ? (
                <InstagramHandle handle={instagramHandle!} displayName={displayName} avatarUrl={avatarUrl} size="md" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)', color: '#fff', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    {displayName ? displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) : '?'}
                  </div>
                  {displayName && (
                    <p className="text-sm font-semibold text-[#1C2B3A]" style={{ fontFamily: "'Inter', sans-serif" }}>{displayName}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 rounded-xl p-4 text-center" style={{ background: '#1C2B3A' }}>
                <p className="text-xs text-white/40 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>YOUR PUNT CODE</p>
                <p className="text-3xl font-bold tracking-widest text-[#F5B800]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {claimed.punt_code}
                </p>
              </div>
              <PuntQRCode puntCode={claimed.punt_code} size={96} />
            </div>
            <p className="text-xs text-gray-400 text-center mb-4">
              Show the QR or punt code to staff when you visit. You have 72 hours after visiting to post.
            </p>
            <Button className="w-full" onClick={() => setClaimed(null)}>Got it</Button>
          </div>
        </div>
      )}

      {!isProfileComplete && (
        <div className="flex items-start gap-3 rounded-2xl px-4 py-4 mb-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
          <div>
            <p className="text-sm font-semibold text-[#1C2B3A] mb-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Complete your profile to claim collabs
            </p>
            <p className="text-xs text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>
              Add your Instagram handle and follower count to your{' '}
              <a href="/creator/profile" className="underline text-[#1C2B3A] font-medium">profile</a>{' '}
              before claiming a collab.
            </p>
          </div>
        </div>
      )}

      {!isApproved && (
        <div className="flex items-start gap-3 rounded-2xl px-4 py-4 mb-6" style={{ background: 'rgba(245,184,0,0.08)', border: '1.5px solid rgba(245,184,0,0.25)' }}>
          <Clock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#F5B800' }} />
          <div>
            <p className="text-sm font-semibold text-[#1C2B3A] mb-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Your profile is under review
            </p>
            <p className="text-xs text-gray-500" style={{ fontFamily: "'Inter', sans-serif" }}>
              We&apos;re reviewing your profile and will be in touch shortly. You can browse collabs in the meantime — claiming will be unlocked once you&apos;re approved.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-[#F5B800] border-t-transparent animate-spin" />
        </div>
      ) : visibleOffers.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ border: '1.5px dashed rgba(0,0,0,0.1)' }}>
          <p className="text-sm text-gray-400">No collabs available right now. Check back soon.</p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex gap-1.5 flex-wrap mb-5">
            {FILTERS.filter(f => counts[f.value] > 0 || f.value === 'all').map(f => {
              const active = filter === f.value
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: active ? f.activeBg : f.bg,
                    color: active ? f.activeText : f.text,
                  }}
                >
                  {f.label}
                  {f.value !== 'all' && counts[f.value] > 0 && (
                    <span
                      className="text-[10px] font-bold px-1 py-0.5 rounded-md min-w-[18px] text-center"
                      style={{ background: active ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)' }}
                    >
                      {counts[f.value]}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {filteredOffers.length === 0 ? (
            <div className="rounded-2xl p-12 text-center" style={{ border: '1.5px dashed rgba(0,0,0,0.1)' }}>
              <p className="text-sm text-gray-400 mb-3">No collabs match this filter.</p>
              <button onClick={() => setFilter('all')} className="text-xs text-gray-400 hover:text-[#1C2B3A] underline transition-colors">
                Show all collabs
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOffers.map(invite => (
                <InviteCard
                  key={invite.id}
                  invite={invite}
                  mode="browse"
                  isApproved={isApproved}
                  isProfileComplete={isProfileComplete}
                  onClaimed={data => handleClaimed(data, invite.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
