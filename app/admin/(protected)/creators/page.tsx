'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'

interface Creator {
  id: string
  display_name: string
  instagram_handle: string | null
  follower_count: number | null
  is_approved: boolean
  created_at: string
  bio: string | null
  website_url: string | null
  avatar_url: string | null
}

export default function AdminCreators() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

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
      setDeleteId(null)
      await load()
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
          {filtered.map((creator, i) => (
            <div key={creator.id} className="flex items-center gap-4 px-4 py-4" style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
              {creator.avatar_url ? (
                <img src={creator.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0 flex items-center justify-center text-sm font-bold text-gray-400">
                  {creator.display_name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#1C2B3A]">{creator.display_name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${creator.is_approved ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                    {creator.is_approved ? 'approved' : 'pending'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {creator.instagram_handle ? `@${creator.instagram_handle}` : 'no instagram'}
                  {creator.follower_count != null ? ` · ${creator.follower_count.toLocaleString()} followers` : ''}
                </p>
                {creator.bio && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-sm">{creator.bio}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
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
                    <Button
                      size="sm"
                      loading={actionLoading === creator.id}
                      onClick={() => handleAction(creator.id, 'approve')}
                    >
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
                    Revoke access
                  </button>
                )}
                <button
                  onClick={() => setDeleteId(creator.id)}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold text-red-400 hover:bg-red-50 transition-colors"
                  style={{ border: '1px solid rgba(239,68,68,0.15)' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
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
