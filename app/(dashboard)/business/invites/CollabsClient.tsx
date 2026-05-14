'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, AlertCircle } from 'lucide-react'
import { CollabCard } from '@/components/invites/CollabCard'
import { Button } from '@/components/ui/Button'
import type { Invite } from '@/lib/types'

interface Props {
  currentUserId: string
  isProfileComplete: boolean
}

export function CollabsClient({ currentUserId, isProfileComplete }: Props) {
  const [collabs, setCollabs] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/invites')
      .then(r => r.json())
      .then(data => { setCollabs(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function handleToggle(id: string, active: boolean) {
    setCollabs(prev => prev.map(o => o.id === id ? { ...o, is_active: active } : o))
  }

  function handleDelete(id: string) {
    setCollabs(prev => prev.filter(o => o.id !== id))
  }

  function handleUpdated(updated: Invite) {
    setCollabs(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))
  }

  // Sort: collabs with urgent creator actions first, paused last
  const sorted = [...collabs].sort((a, b) => {
    const hasAction = (inv: Invite) => (inv.matches ?? []).some(m =>
      (!inv.invite_type.includes('retainer') && m.status === 'posted') ||
      (inv.invite_type === 'retainer' && m.status === 'pending')
    )
    if (hasAction(a) && !hasAction(b)) return -1
    if (!hasAction(a) && hasAction(b)) return 1
    if (!a.is_active && b.is_active) return 1
    if (a.is_active && !b.is_active) return -1
    return 0
  })

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-bold text-[#1C2B3A]"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            My Collabs
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {collabs.length} collab{collabs.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isProfileComplete ? (
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
        )}
      </div>

      {!isProfileComplete && (
        <div
          className="flex items-start gap-3 rounded-2xl px-4 py-4 mb-6"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)' }}
        >
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

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-[#F5B800] border-t-transparent animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ border: '1.5px dashed rgba(0,0,0,0.1)' }}>
          <p className="text-sm text-gray-400 mb-4">No collabs yet. Post one to start getting matched with creators.</p>
          {isProfileComplete && (
            <Link href="/business/invites/new">
              <Button variant="secondary">Post your first collab</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sorted.map(invite => (
            <CollabCard
              key={invite.id}
              invite={invite}
              currentUserId={currentUserId}
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
