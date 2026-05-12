'use client'
import { useState, useEffect } from 'react'
import { OfferCard } from '@/components/offers/OfferCard'
import { Button } from '@/components/ui/Button'
import type { Offer } from '@/lib/types'

interface ClaimedData { id: string; punt_code: string }

export default function BrowsePage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [claimed, setClaimed] = useState<ClaimedData | null>(null)

  useEffect(() => {
    fetch('/api/offers')
      .then(r => r.json())
      .then(data => { setOffers(data); setLoading(false) })
  }, [])

  function handleClaimed(data: ClaimedData, offerId: string) {
    setClaimed(data)
    // Decrement slot count locally
    setOffers(prev => prev.map(o => o.id === offerId ? { ...o, slots_claimed: o.slots_claimed + 1 } : o))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Browse Offers</h1>
        <p className="text-sm text-gray-500 mt-0.5">Claim an offer, visit the business, create content.</p>
      </div>

      {/* Claim success modal */}
      {claimed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(107,230,176,0.15)' }}>
                <span className="text-2xl">🎉</span>
              </div>
              <h2 className="text-lg font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Offer claimed!</h2>
              <p className="text-sm text-gray-500 mt-1">Show this code to the business when you visit.</p>
            </div>
            <div className="rounded-xl p-4 text-center mb-5" style={{ background: '#1C2B3A' }}>
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

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-[#F5B800] border-t-transparent animate-spin" />
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ border: '1.5px dashed rgba(0,0,0,0.1)' }}>
          <p className="text-sm text-gray-400">No offers available right now. Check back soon.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {offers.map(offer => (
            <OfferCard
              key={offer.id}
              offer={offer}
              mode="browse"
              onClaimed={data => handleClaimed(data, offer.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
