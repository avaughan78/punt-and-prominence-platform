'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ChevronDown, ChevronUp } from 'lucide-react'
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

export default function AdminCreators() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

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
    setRejectId(null)
    setRejectReason('')
    await load()
    setActionLoading(null)
  }

  const filtered = creators.filter(c => {
    if (filter === 'pending') return !c.is_approved
    if (filter === 'approved') return c.is_approved
    return true
  })

  function formatFollowers(n: number) {
    if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
    return n.toString()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Creators</h1>
          <p className="text-sm text-gray-500 mt-0.5">{creators.filter(c => !c.is_approved).length} pending approval</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors capitalize"
              style={{
                background: filter === f ? '#1C2B3A' : 'white',
                color: filter === f ? 'white' : '#6b7280',
                border: '1px solid rgba(0,0,0,0.1)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !filtered.length ? (
        <p className="text-sm text-gray-400">No creators found.</p>
      ) : (
        <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          {filtered.map((creator, i) => {
            const isExpanded = expanded === creator.id
            const isLast = i === filtered.length - 1
            const totalFollowers = (creator.follower_count ?? 0) + (creator.tiktok_follower_count ?? 0)

            return (
              <div
                key={creator.id}
                style={{ borderBottom: (!isLast || isExpanded) ? '1px solid rgba(0,0,0,0.06)' : 'none' }}
              >
                {/* Main row */}
                <div className="flex items-center gap-4 px-4 py-4">
                  {/* Avatar */}
                  {creator.avatar_url ? (
                    <img src={creator.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0 flex items-center justify-center text-sm font-bold text-gray-400">
                      {creator.display_name?.[0]?.toUpperCase()}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#1C2B3A]">{creator.display_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${creator.is_approved ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                        {creator.is_approved ? 'approved' : 'pending'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {creator.instagram_handle ? `@${creator.instagram_handle}` : 'no instagram'}
                      {totalFollowers > 0 ? ` · ${formatFollowers(totalFollowers)} followers` : ''}
                      {creator.email ? (
                        <> · <a href={`mailto:${creator.email}`} className="hover:text-[#1C2B3A] transition-colors">{creator.email}</a></>
                      ) : null}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0 items-center">
                    {creator.instagram_handle && (
                      <a
                        href={`https://instagram.com/${creator.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                        style={{ border: '1px solid rgba(0,0,0,0.1)' }}
                      >
                        Instagram
                      </a>
                    )}
                    {!creator.is_approved ? (
                      <>
                        <Button size="sm" loading={actionLoading === creator.id} onClick={() => handleAction(creator.id, 'approve')}>
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

                {/* Expanded drawer */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1" style={{ background: 'rgba(0,0,0,0.015)' }}>
                    <div className="grid grid-cols-2 gap-3 mb-3">

                      {/* Profile details */}
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

                      {/* Reach */}
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
                          <p className="text-sm font-bold text-[#1C2B3A]">
                            {creator.match_count} {creator.match_count === 1 ? 'match' : 'matches'}
                          </p>
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

      {/* Reject/revoke modal */}
      {rejectId && (() => {
        const target = creators.find(c => c.id === rejectId)
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
              <h3 className="font-bold text-[#1C2B3A] mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Delete creator
              </h3>
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
