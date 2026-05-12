'use client'
import { useState, useEffect } from 'react'
import { InviteCard } from '@/components/invites/InviteCard'
import { InstagramHandle } from '@/components/ui/InstagramHandle'
import { Button } from '@/components/ui/Button'
import { Clock } from 'lucide-react'
import type { Invite } from '@/lib/types'

interface ClaimedData { id: string; punt_code: string }

export default function BrowsePage() {
  const [offers, setOffers] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [claimed, setClaimed] = useState<ClaimedData | null>(null)
  const [instagramHandle, setInstagramHandle] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>('')
  const [isApproved, setIsApproved] = useState<boolean>(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/invites').then(r => r.json()),
      fetch('/api/profile').then(r => r.json()),
    ]).then(([offersData, profile]) => {
      setOffers(Array.isArray(offersData) ? offersData : [])
      if (profile && !profile.error) {
        setInstagramHandle(profile.instagram_handle ?? null)
        setAvatarUrl(profile.avatar_url ?? null)
        setDisplayName(profile.display_name ?? '')
        setIsApproved(profile.is_approved ?? true)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function handleClaimed(data: ClaimedData, inviteId: string) {
    setClaimed(data)
    setOffers(prev => prev
      .map(o => o.id === inviteId ? { ...o, slots_claimed: o.slots_claimed + 1 } : o)
      .filter(o => o.slots_claimed < o.slots_total)
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Browse Invites</h1>
        <p className="text-sm text-gray-500 mt-0.5">Claim an invite, visit the business, create content.</p>
      </div>

      {/* Claim success modal */}
      {claimed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-5">
              <h2 className="text-lg font-bold text-[#1C2B3A] mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Invite claimed!</h2>
              <p className="text-sm text-gray-500">Show this to the business when you visit.</p>
            </div>

            {/* Creator identity — always show */}
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

            <div className="rounded-xl p-4 text-center mb-4" style={{ background: '#1C2B3A' }}>
              <p className="text-xs text-white/40 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>YOUR PUNT CODE</p>
              <p className="text-3xl font-bold tracking-widest text-[#F5B800]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {claimed.punt_code}
              </p>
            </div>
            <p className="text-xs text-gray-400 text-center mb-4">
              You&apos;ll also find this in your matches. You have 72 hours after visiting to post.
            </p>
            <Button className="w-full" onClick={() => setClaimed(null)}>Got it</Button>
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
              We&apos;re reviewing your profile and will be in touch shortly. You can browse invites in the meantime — claiming will be unlocked once you&apos;re approved.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-[#F5B800] border-t-transparent animate-spin" />
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ border: '1.5px dashed rgba(0,0,0,0.1)' }}>
          <p className="text-sm text-gray-400">No invites available right now. Check back soon.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {offers.map(invite => (
            <InviteCard
              key={invite.id}
              invite={invite}
              mode="browse"
              isApproved={isApproved}
              onClaimed={data => handleClaimed(data, invite.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
