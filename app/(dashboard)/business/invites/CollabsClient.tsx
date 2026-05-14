'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, AlertCircle } from 'lucide-react'
import { CollabCard } from '@/components/invites/CollabCard'
import { Button } from '@/components/ui/Button'
import type { Invite } from '@/lib/types'

type Filter = 'all' | 'needs_action' | 'active' | 'full' | 'paused' | 'one_off' | 'retainer'

function needsAction(inv: Invite) {
  return (inv.matches ?? []).some(m =>
    (inv.invite_type !== 'retainer' && m.status === 'posted') ||
    (inv.invite_type === 'retainer' && m.status === 'pending')
  )
}

function matchesFilter(inv: Invite, filter: Filter): boolean {
  switch (filter) {
    case 'needs_action': return needsAction(inv)
    case 'active':       return inv.is_active && inv.slots_claimed < inv.slots_total
    case 'full':         return inv.slots_claimed >= inv.slots_total
    case 'paused':       return !inv.is_active
    case 'one_off':      return inv.invite_type !== 'retainer'
    case 'retainer':     return inv.invite_type === 'retainer'
    default:             return true
  }
}

interface Props {
  currentUserId: string
  isProfileComplete: boolean
}

export function CollabsClient({ currentUserId, isProfileComplete }: Props) {
  const [collabs, setCollabs] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

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

  // Sort: urgent first, paused last, then preserve API order
  const sorted = [...collabs].sort((a, b) => {
    const aAction = needsAction(a) ? 0 : a.is_active ? 1 : 2
    const bAction = needsAction(b) ? 0 : b.is_active ? 1 : 2
    return aAction - bAction
  })

  const filtered = sorted.filter(inv => matchesFilter(inv, filter))

  const counts: Record<Filter, number> = {
    all:          collabs.length,
    needs_action: collabs.filter(i => matchesFilter(i, 'needs_action')).length,
    active:       collabs.filter(i => matchesFilter(i, 'active')).length,
    full:         collabs.filter(i => matchesFilter(i, 'full')).length,
    paused:       collabs.filter(i => matchesFilter(i, 'paused')).length,
    one_off:      collabs.filter(i => matchesFilter(i, 'one_off')).length,
    retainer:     collabs.filter(i => matchesFilter(i, 'retainer')).length,
  }

  const FILTERS: { value: Filter; label: string; accent?: string }[] = [
    { value: 'all',          label: 'All' },
    { value: 'needs_action', label: 'Needs action', accent: '#F5B800' },
    { value: 'active',       label: 'Active' },
    { value: 'full',         label: 'Full' },
    { value: 'paused',       label: 'Paused' },
    { value: 'one_off',      label: 'One-off' },
    { value: 'retainer',     label: 'Retainer' },
  ]

  const EMPTY_MESSAGES: Record<Filter, string> = {
    all:          'No collabs yet. Post one to start getting matched with creators.',
    needs_action: 'Nothing needs your attention right now.',
    active:       'No active collabs with open slots.',
    full:         'No collabs have reached full capacity yet.',
    paused:       'No paused collabs.',
    one_off:      'No one-off collabs.',
    retainer:     'No retainer collabs.',
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            My Collabs
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {collabs.length} collab{collabs.length !== 1 ? 's' : ''}
            {counts.needs_action > 0 && (
              <span
                className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(245,184,0,0.15)', color: '#b45309' }}
              >
                {counts.needs_action} need{counts.needs_action === 1 ? 's' : ''} action
              </span>
            )}
          </p>
        </div>
        {isProfileComplete ? (
          <Link href="/business/invites/new">
            <Button size="sm"><Plus className="w-4 h-4" />New collab</Button>
          </Link>
        ) : (
          <Button size="sm" disabled><Plus className="w-4 h-4" />New collab</Button>
        )}
      </div>

      {/* Profile incomplete banner */}
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
      ) : (
        <>
          {/* Filter pills — only show once data is loaded */}
          {collabs.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-5">
              {FILTERS.filter(f => f.value === 'all' || counts[f.value] > 0).map(f => {
                const active = filter === f.value
                const isUrgent = f.value === 'needs_action'
                return (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: active
                        ? isUrgent ? '#F5B800' : '#1C2B3A'
                        : isUrgent && counts.needs_action > 0
                          ? 'rgba(245,184,0,0.12)'
                          : 'rgba(28,43,58,0.06)',
                      color: active
                        ? isUrgent ? '#1C2B3A' : 'white'
                        : isUrgent && counts.needs_action > 0
                          ? '#b45309'
                          : '#6b7280',
                    }}
                  >
                    {f.label}
                    {f.value !== 'all' && (
                      <span
                        className="text-[10px] font-bold px-1 py-0.5 rounded-md min-w-[18px] text-center"
                        style={{
                          background: active ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)',
                        }}
                      >
                        {counts[f.value]}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* List */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl p-12 text-center" style={{ border: '1.5px dashed rgba(0,0,0,0.1)' }}>
              <p className="text-sm text-gray-400 mb-4">{EMPTY_MESSAGES[filter]}</p>
              {filter === 'all' && isProfileComplete && (
                <Link href="/business/invites/new">
                  <Button variant="secondary">Post your first collab</Button>
                </Link>
              )}
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="text-xs text-gray-400 hover:text-[#1C2B3A] underline transition-colors"
                >
                  Show all collabs
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map(invite => (
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
        </>
      )}
    </div>
  )
}
