'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, AlertCircle } from 'lucide-react'
import { BusinessInviteCard } from '@/components/invites/BusinessInviteCard'
import { Button } from '@/components/ui/Button'
import type { Invite } from '@/lib/types'

type Tab = 'open' | 'claimed'

function isOpen(invite: Invite): boolean {
  if (!invite.is_active) return false
  if (invite.invite_type === 'retainer') return invite.slots_claimed === 0
  return invite.slots_claimed < invite.slots_total
}

export default function BusinessOffersPage() {
  const [offers, setOffers] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('open')
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/invites').then(r => r.json()),
      fetch('/api/profile').then(r => r.json()),
    ]).then(([offersData, profile]) => {
      setOffers(Array.isArray(offersData) ? offersData : [])
      if (profile && !profile.error) {
        setIsProfileComplete(!!(profile.business_name && profile.category && profile.address_line))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function handleToggle(id: string, active: boolean) {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, is_active: active } : o))
  }

  function handleDelete(id: string) {
    setOffers(prev => prev.filter(o => o.id !== id))
  }

  function handleUpdated(updated: Invite) {
    setOffers(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))
  }

  const openOffers = offers.filter(isOpen)
  const claimedOffers = offers.filter(o => !isOpen(o))
  const filtered = tab === 'open' ? openOffers : claimedOffers

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>My Collabs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {openOffers.length} open · {claimedOffers.length} claimed
          </p>
        </div>
        {tab === 'open' && (
          isProfileComplete ? (
            <Link href="/business/invites/new">
              <Button size="sm">
                <Plus className="w-4 h-4" />
                New collab
              </Button>
            </Link>
          ) : (
            <Button size="sm" disabled>
              <Plus className="w-4 h-4" />
              New collab
            </Button>
          )
        )}
      </div>

      {!isProfileComplete && (
        <div className="flex items-start gap-3 rounded-2xl px-4 py-4 mb-6" style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
          <div>
            <p className="text-sm font-semibold text-[#1C2B3A] mb-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Complete your profile to post collabs
            </p>
            <p className="text-xs text-gray-500">
              Add your business name, category, and address to your{' '}
              <a href="/business/profile" className="underline text-[#1C2B3A] font-medium">profile</a>{' '}
              before posting a collab.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {([
          { value: 'open', label: 'Open', count: openOffers.length },
          { value: 'claimed', label: 'Claimed', count: claimedOffers.length },
        ] as const).map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.value ? '#1C2B3A' : 'transparent',
              color: tab === t.value ? 'white' : '#6b7280',
            }}
          >
            {t.label}
            <span className="ml-1.5 text-xs opacity-60">{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-[#F5B800] border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ border: '1.5px dashed rgba(0,0,0,0.1)' }}>
          {tab === 'open' ? (
            <>
              <p className="text-sm text-gray-400 mb-4">No open collabs. Post one to start getting matched with creators.</p>
              {isProfileComplete && (
                <Link href="/business/invites/new">
                  <Button variant="secondary">Post your first collab</Button>
                </Link>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">No claimed collabs yet.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(invite => (
            <BusinessInviteCard
              key={invite.id}
              invite={invite}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onUpdated={handleUpdated}
            />
          ))}
        </div>
      )}
    </div>
  )
}
