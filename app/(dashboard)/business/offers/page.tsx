'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { OfferCard } from '@/components/offers/OfferCard'
import { Button } from '@/components/ui/Button'
import type { Offer } from '@/lib/types'

export default function BusinessOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/offers')
      .then(r => r.json())
      .then(data => { setOffers(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function handleToggle(id: string, active: boolean) {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, is_active: active } : o))
  }

  function handleDelete(id: string) {
    setOffers(prev => prev.filter(o => o.id !== id))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>My Offers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{offers.length} offer{offers.length !== 1 ? 's' : ''} posted</p>
        </div>
        <Link href="/business/offers/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            New offer
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-[#F5B800] border-t-transparent animate-spin" />
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ border: '1.5px dashed rgba(0,0,0,0.1)' }}>
          <p className="text-sm text-gray-400 mb-4">No offers yet. Post your first one to start getting matched.</p>
          <Link href="/business/offers/new">
            <Button variant="secondary">Post your first offer</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {offers.map(offer => (
            <OfferCard key={offer.id} offer={offer} mode="manage" onToggle={handleToggle} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
