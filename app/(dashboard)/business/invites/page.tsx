'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { InviteCard } from '@/components/invites/InviteCard'
import { Button } from '@/components/ui/Button'
import type { Invite } from '@/lib/types'

type Tab = 'open' | 'claimed'

function isOpen(invite: Invite): boolean {
  if (!invite.is_active) return false
  if (invite.invite_type === 'retainer') {
    // Open retainer = active and no one has claimed the slot yet
    return invite.slots_claimed === 0
  }
  // Open one-off = active and slots remaining
  return invite.slots_claimed < invite.slots_total
}

export default function BusinessOffersPage() {
  const [offers, setOffers] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('open')

  useEffect(() => {
    fetch('/api/invites')
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

  const openOffers = offers.filter(isOpen)
  const claimedOffers = offers.filter(o => !isOpen(o))
  const filtered = tab === 'open' ? openOffers : claimedOffers

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>My Invites</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {openOffers.length} open · {claimedOffers.length} claimed
          </p>
        </div>
        {tab === 'open' && (
          <Link href="/business/invites/new">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              New invite
            </Button>
          </Link>
        )}
      </div>

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
              fontFamily: "'Inter', sans-serif",
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
              <p className="text-sm text-gray-400 mb-4">No open invites. Post one to start getting matched with creators.</p>
              <Link href="/business/invites/new">
                <Button variant="secondary">Post your first invite</Button>
              </Link>
            </>
          ) : (
            <p className="text-sm text-gray-400">No claimed invites yet.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(invite => (
            <InviteCard key={invite.id} invite={invite} mode="manage" onToggle={handleToggle} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
