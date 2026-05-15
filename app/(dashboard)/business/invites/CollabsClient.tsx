'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, AlertCircle } from 'lucide-react'
import { CollabCard } from '@/components/invites/CollabCard'
import { CollabDetailModal } from '@/components/invites/CollabDetailModal'
import { Button } from '@/components/ui/Button'
import type { Invite } from '@/lib/types'

type Filter = 'all' | 'open' | 'closed'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all',    label: 'All' },
  { value: 'open',   label: 'Open' },
  { value: 'closed', label: 'Closed' },
]

const EMPTY_MESSAGES: Record<Filter, string> = {
  all:    'No collabs yet. Post one to start getting matched with creators.',
  open:   'No open collabs right now.',
  closed: 'No closed collabs yet.',
}

function matchesFilter(inv: Invite, filter: Filter): boolean {
  if (filter === 'open')   return inv.is_active
  if (filter === 'closed') return !inv.is_active
  return true
}

interface Props {
  currentUserId: string
  isProfileComplete: boolean
  openCollabId?: string
  openMatchId?: string
}

export function CollabsClient({ currentUserId, isProfileComplete, openCollabId, openMatchId }: Props) {
  const [collabs, setCollabs] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [detailCollab, setDetailCollab] = useState<Invite | null>(null)

  useEffect(() => {
    fetch('/api/invites')
      .then(r => r.json())
      .then(data => {
        setCollabs(Array.isArray(data) ? data : [])
        setLoading(false)
      })
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

  const sorted = [...collabs].sort((a, b) => {
    if (a.is_active && !b.is_active) return -1
    if (!a.is_active && b.is_active) return 1
    return 0
  })

  const filtered = sorted.filter(inv => matchesFilter(inv, filter))

  const counts = {
    all:    collabs.length,
    open:   collabs.filter(i => i.is_active).length,
    closed: collabs.filter(i => !i.is_active).length,
  }

  return (
    <div className="max-w-4xl mx-auto">
      {detailCollab && (
        <CollabDetailModal invite={detailCollab} onClose={() => setDetailCollab(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            My Collabs
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {collabs.length} collab{collabs.length !== 1 ? 's' : ''}
            {counts.open > 0 && (
              <span className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(107,230,176,0.15)', color: '#059669' }}>
                {counts.open} open
              </span>
            )}
          </p>
        </div>
        {isProfileComplete ? (
          <Link href="/business/invites/new"><Button size="sm"><Plus className="w-4 h-4" />New collab</Button></Link>
        ) : (
          <Button size="sm" disabled><Plus className="w-4 h-4" />New collab</Button>
        )}
      </div>

      {!isProfileComplete && (
        <div className="flex items-start gap-3 rounded-2xl px-4 py-4 mb-6" style={{ background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
          <div>
            <p className="text-sm font-semibold text-[#1C2B3A] mb-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Complete your profile to post collabs</p>
            <p className="text-xs text-gray-500">
              Add your business name, category, and address to your{' '}
              <a href="/business/profile" className="underline text-[#1C2B3A] font-medium">profile</a> before posting a collab.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 border-[#F5B800] border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {collabs.length > 0 && (
            <div className="flex gap-1.5 mb-5">
              {FILTERS.filter(f => f.value === 'all' || counts[f.value] > 0).map(f => {
                const active = filter === f.value
                return (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: active ? '#1C2B3A' : 'rgba(28,43,58,0.06)',
                      color: active ? 'white' : '#6b7280',
                    }}
                  >
                    {f.label}
                    <span
                      className="text-[10px] font-bold px-1 py-0.5 rounded-md min-w-[18px] text-center"
                      style={{ background: active ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)' }}
                    >
                      {counts[f.value]}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="rounded-2xl p-12 text-center" style={{ border: '1.5px dashed rgba(0,0,0,0.1)' }}>
              <p className="text-sm text-gray-400 mb-4">{EMPTY_MESSAGES[filter]}</p>
              {filter === 'all' && isProfileComplete ? (
                <Link href="/business/invites/new"><Button variant="secondary">Post your first collab</Button></Link>
              ) : filter !== 'all' ? (
                <button onClick={() => setFilter('all')} className="text-xs text-gray-400 hover:text-[#1C2B3A] underline transition-colors">
                  Show all collabs
                </button>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[filtered.filter((_, i) => i % 2 === 0), filtered.filter((_, i) => i % 2 === 1)].map((col, ci) => (
                <div key={ci} className="flex flex-col gap-4">
                  {col.map(invite => (
                    <CollabCard
                      key={invite.id}
                      invite={invite}
                      currentUserId={currentUserId}
                      initialOpen={invite.id === openCollabId}
                      initialOpenMatchId={invite.id === openCollabId ? openMatchId : undefined}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onUpdated={handleUpdated}
                      onViewDetail={setDetailCollab}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
