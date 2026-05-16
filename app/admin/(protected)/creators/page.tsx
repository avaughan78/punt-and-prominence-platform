'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'

interface Creator {
  id: string
  display_name: string
  email: string | null
  instagram_handle: string | null
  tiktok_handle: string | null
  follower_count: number | null
  tiktok_follower_count: number | null
  is_approved: boolean
  created_at: string
  bio: string | null
  website_url: string | null
  avatar_url: string | null
  match_count: number
}

type SortKey = 'created_at' | 'follower_count' | 'match_count'
type SortDir = 'asc' | 'desc'

export default function AdminCreators() {
  const [creators, setCreators]         = useState<Creator[]>([])
  const [loading, setLoading]           = useState(true)
  const [filter, setFilter]             = useState<'all' | 'pending' | 'approved'>('all')
  const [sortKey, setSortKey]           = useState<SortKey>('created_at')
  const [sortDir, setSortDir]           = useState<SortDir>('desc')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectId, setRejectId]         = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [approveId, setApproveId]       = useState<string | null>(null)
  const [deleteId, setDeleteId]         = useState<string | null>(null)
  const [expanded, setExpanded]         = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/creators')
    if (res.ok) setCreators(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    setActionLoading(id)
    const res = await fetch(`/api/admin/creators/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Creator deleted')
      setDeleteId(null)
      await load()
    } else {
      toast.error('Delete failed')
    }
    setActionLoading(null)
  }

  async function handleAction(id: string, action: 'approve' | 'reject' | 'revoke', reason?: string) {
    setActionLoading(id)
    await fetch(`/api/admin/creators/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason }),
    })
    toast.success(action === 'approve' ? 'Creator approved' : action === 'revoke' ? 'Access revoked' : 'Creator rejected')
    setRejectId(null)
    setApproveId(null)
    setRejectReason('')
    await load()
    setActionLoading(null)
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = creators
    .filter(c => {
      if (filter === 'pending')  return !c.is_approved
      if (filter === 'approved') return c.is_approved
      return true
    })
    .sort((a, b) => {
      let av: number, bv: number
      if (sortKey === 'created_at') {
        av = new Date(a.created_at).getTime()
        bv = new Date(b.created_at).getTime()
      } else if (sortKey === 'follower_count') {
        av = (a.follower_count ?? 0) + (a.tiktok_follower_count ?? 0)
        bv = (b.follower_count ?? 0) + (b.tiktok_follower_count ?? 0)
      } else {
        av = a.match_count; bv = b.match_count
      }
      return sortDir === 'asc' ? av - bv : bv - av
    })

  function formatFollowers(n: number) {
    if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
    return n.toString()
  }

  function SortBtn({ k, label }: { k: SortKey; label: string }) {
    const active = sortKey === k
    return (
      <button
        onClick={() => toggleSort(k)}
        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors"
        style={{ background: active ? '#1C2B3A' : 'white', color: active ? 'white' : '#6b7280', border: '1px solid rgba(0,0,0,0.1)' }}
      >
        <ArrowUpDown className="w-3 h-3" />
        {label} {active ? (sortDir === 'desc' ? '↓' : '↑') : ''}
      </button>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Creators</h1>
          <p className="text-sm text-gray-500 mt-0.5">{creators.filter(c => !c.is_approved).length} pending approval</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'approved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors capitalize"
              style={{ background: filter === f ? '#1C2B3A' : 'white', color: filter === f ? 'white' : '#6b7280', border: '1px solid rgba(0,0,0,0.1)' }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <span className="text-xs text-gray-400 mr-1">Sort:</span>
        <SortBtn k="created_at" label="Joined" />
        <SortBtn k="follower_count" label="Followers" />
        <SortBtn k="match_count" label="Matches" />
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !filtered.length ? (
        <p className="text-sm text-gray-400">No creators found.</p>
      ) : (
        <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          {filtered.map((creator, i) => {
            const isExpanded    = expanded === creator.id
            const isLast        = i === filtered.length - 1
            const totalFollowers = (creator.follower_count ?? 0) + (creator.tiktok_follower_count ?? 0)

            return (
              <div key={creator.id} style={{ borderBottom: (!isLast || isExpanded) ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {creator.avatar_url ? (
                      <img src={creator.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0 flex items-center justify-center text-sm font-bold text-gray-400">
                        {creator.display_name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#1C2B3A]">{creator.display_name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${creator.is_approved ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                          {creator.is_approved ? 'approved' : 'pending'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {creator.instagram_handle ? `@${creator.instagram_handle}` : 'no instagram'}
                        {totalFollowers > 0 ? ` · ${formatFollowers(totalFollowers)} followers` : ''}
                        {' · '}{creator.match_count} match{creator.match_count !== 1 ? 'es' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap items-center sm:shrink-0">
                    {creator.instagram_handle && (
                      <a href={`https://instagram.com/${creator.instagram_handle}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                        style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
                        Instagram
                      </a>
                    )}
                    {!creator.is_approved ? (
                      <>
                        <Button size="sm" loading={actionLoading === creator.id} onClick={() => setApproveId(creator.id)}>
                          Approve
                        </Button>
                        <button
                          onClick={() => { setRejectId(creator.id); setRejectReason('') }}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold text-red-500 hover:bg-red-50 transition-colors"
                          style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setRejectId(creator.id); setRejectReason('') }}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold text-red-400 hover:bg-red-50 transition-colors"
                        style={{ border: '1px solid rgba(0,0,0,0.08)' }}
                      >
                        Revoke
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteId(creator.id)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold text-red-400 hover:bg-red-50 transition-colors"
                      style={{ border: '1px solid rgba(239,68,68,0.15)' }}
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setExpanded(prev => prev === creator.id ? null : creator.id)}
                      className="p-1 rounded-lg text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1" style={{ background: 'rgba(0,0,0,0.015)' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div className="rounded-xl bg-white p-3 flex flex-col gap-2" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Profile</p>
                        {creator.email && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Email</p>
                            <a href={`mailto:${creator.email}`} className="text-xs text-[#1C2B3A] hover:underline font-medium">{creator.email}</a>
                          </div>
                        )}
                        {creator.bio && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Bio</p>
                            <p className="text-xs text-gray-600 leading-relaxed">{creator.bio}</p>
                          </div>
                        )}
                        {creator.website_url && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Website</p>
                            <a href={creator.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block">{creator.website_url}</a>
                          </div>
                        )}
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Joined</p>
                          <p className="text-xs text-gray-600">{new Date(creator.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white p-3 flex flex-col gap-2" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Reach</p>
                        {creator.instagram_handle && (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Instagram</p>
                              <a href={`https://instagram.com/${creator.instagram_handle}`} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-[#1C2B3A] hover:underline font-medium">@{creator.instagram_handle}</a>
                            </div>
                            {creator.follower_count != null && (
                              <p className="text-sm font-bold text-[#1C2B3A]">{formatFollowers(creator.follower_count)}</p>
                            )}
                          </div>
                        )}
                        {creator.tiktok_handle && (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">TikTok</p>
                              <a href={`https://tiktok.com/@${creator.tiktok_handle}`} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-[#1C2B3A] hover:underline font-medium">@{creator.tiktok_handle}</a>
                            </div>
                            {creator.tiktok_follower_count != null && (
                              <p className="text-sm font-bold text-[#1C2B3A]">{formatFollowers(creator.tiktok_follower_count)}</p>
                            )}
                          </div>
                        )}
                        <div className="mt-auto pt-1 border-t border-black/5">
                          <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Matches</p>
                          <p className="text-sm font-bold text-[#1C2B3A]">{creator.match_count} {creator.match_count === 1 ? 'match' : 'matches'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Approve confirmation */}
      {approveId && (() => {
        const target = creators.find(c => c.id === approveId)
        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="font-bold text-[#1C2B3A] mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Approve creator</h3>
              <p className="text-sm text-gray-500 mb-5">
                Approving <strong>{target?.display_name}</strong> will let them claim collabs. A welcome email will be sent.
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setApproveId(null)} className="text-sm px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-50">Cancel</button>
                <Button loading={actionLoading === approveId} onClick={() => handleAction(approveId, 'approve')}>
                  Approve
                </Button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Reject/revoke modal */}
      {rejectId && (() => {
        const target  = creators.find(c => c.id === rejectId)
        const isRevoke = target?.is_approved ?? false
        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="font-bold text-[#1C2B3A] mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {isRevoke ? 'Revoke access' : 'Reject creator'}
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                {isRevoke
                  ? 'Their account will remain but they will lose access to claim collabs.'
                  : 'Their account and all profile data will be permanently deleted. A rejection email will be sent.'}
              </p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason (optional) — included in the email"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-black/10 rounded-xl outline-none focus:border-[#F5B800] resize-none mb-4"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setRejectId(null)} className="text-sm px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-50">Cancel</button>
                <button
                  onClick={() => handleAction(rejectId, isRevoke ? 'revoke' : 'reject', rejectReason || undefined)}
                  className="text-sm px-4 py-2 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600"
                >
                  {isRevoke ? 'Revoke access' : 'Reject & delete'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Delete confirmation modal */}
      {deleteId && (() => {
        const target = creators.find(c => c.id === deleteId)
        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="font-bold text-[#1C2B3A] mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Delete creator</h3>
              <p className="text-sm text-gray-500 mb-1">
                Are you sure you want to delete <strong>{target?.display_name}</strong>?
              </p>
              <p className="text-xs text-red-500 mb-5">This permanently removes their account and all profile data. This cannot be undone.</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDeleteId(null)} className="text-sm px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-50">Cancel</button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  disabled={actionLoading === deleteId}
                  className="text-sm px-4 py-2 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {actionLoading === deleteId ? 'Deleting…' : 'Delete permanently'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
