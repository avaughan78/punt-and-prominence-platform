'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { ArrowUpDown } from 'lucide-react'

interface Business {
  id: string
  display_name: string
  business_name: string | null
  address_line: string | null
  category: string | null
  avatar_url: string | null
  created_at: string
  website_url: string | null
  instagram_handle: string | null
  is_suspended: boolean
  active_invites: number
  total_matches: number
  verified_matches: number
}

type SortKey = 'joined' | 'collabs' | 'matches'
type SortDir = 'asc' | 'desc'

export default function AdminBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [suspendId, setSuspendId] = useState<string | null>(null)
  const [suspendNote, setSuspendNote] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('joined')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/businesses')
    if (res.ok) setBusinesses(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    setActionLoading(id)
    const res = await fetch(`/api/admin/businesses/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Business deleted')
      setDeleteId(null)
      await load()
    } else {
      toast.error('Delete failed')
    }
    setActionLoading(null)
  }

  async function handleSuspend(id: string) {
    setActionLoading(id)
    const res = await fetch(`/api/admin/businesses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'suspend', note: suspendNote.trim() || undefined }),
    })
    if (res.ok) {
      toast.success('Business suspended')
      setSuspendId(null)
      setSuspendNote('')
      await load()
    } else {
      toast.error('Action failed')
    }
    setActionLoading(null)
  }

  async function handleUnsuspend(id: string) {
    setActionLoading(id)
    const res = await fetch(`/api/admin/businesses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unsuspend' }),
    })
    if (res.ok) {
      toast.success('Business reinstated')
      await load()
    } else {
      toast.error('Action failed')
    }
    setActionLoading(null)
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = businesses
    .filter(b => {
      const matchesFilter =
        filter === 'all' ? true :
        filter === 'suspended' ? b.is_suspended :
        !b.is_suspended
      if (!matchesFilter) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        b.display_name?.toLowerCase().includes(q) ||
        b.business_name?.toLowerCase().includes(q) ||
        b.address_line?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      let v = 0
      if (sortKey === 'joined') v = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortKey === 'collabs') v = a.active_invites - b.active_invites
      if (sortKey === 'matches') v = a.total_matches - b.total_matches
      return sortDir === 'asc' ? v : -v
    })

  const suspendedCount = businesses.filter(b => b.is_suspended).length
  const suspendTarget = businesses.find(b => b.id === suspendId)

  const SORT_BTNS: { key: SortKey; label: string }[] = [
    { key: 'joined', label: 'Joined' },
    { key: 'collabs', label: 'Collabs' },
    { key: 'matches', label: 'Matches' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Businesses</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {businesses.length} registered{suspendedCount > 0 ? ` · ${suspendedCount} suspended` : ''}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'active', 'suspended'] as const).map(f => (
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
          <input
            type="search"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-sm px-4 py-1.5 rounded-xl border border-black/10 outline-none focus:border-[#F5B800] w-full sm:w-44"
          />
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-1.5 mb-4">
        <span className="text-xs text-gray-400 mr-1">Sort:</span>
        {SORT_BTNS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggleSort(key)}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
            style={{
              background: sortKey === key ? '#1C2B3A' : 'white',
              color: sortKey === key ? 'white' : '#6b7280',
              border: '1px solid rgba(0,0,0,0.1)',
            }}
          >
            {label}
            <ArrowUpDown className="w-3 h-3 opacity-60" />
            {sortKey === key && (
              <span className="text-[10px] opacity-75">{sortDir === 'desc' ? '↓' : '↑'}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !filtered.length ? (
        <p className="text-sm text-gray-400">No businesses found.</p>
      ) : (
        <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          {filtered.map((biz, i) => (
            <div
              key={biz.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4"
              style={{
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                opacity: biz.is_suspended ? 0.6 : 1,
              }}
            >
              {/* Avatar + info row */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {biz.avatar_url ? (
                  <img src={biz.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0 flex items-center justify-center text-sm font-bold text-gray-400">
                    {(biz.business_name ?? biz.display_name)?.[0]?.toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[#1C2B3A]">{biz.business_name ?? biz.display_name}</p>
                    {biz.is_suspended && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-50 text-red-500">suspended</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {biz.display_name}{biz.category ? ` · ${biz.category}` : ''}{biz.address_line ? ` · ${biz.address_line}` : ''}
                  </p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#6BE6B0', fontFamily: "'JetBrains Mono', monospace" }}>
                      {biz.active_invites} collab{biz.active_invites !== 1 ? 's' : ''}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {biz.total_matches} match{biz.total_matches !== 1 ? 'es' : ''}
                    </span>
                    {biz.verified_matches > 0 && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#22c55e', fontFamily: "'JetBrains Mono', monospace" }}>
                        {biz.verified_matches} verified
                      </span>
                    )}
                    <span className="text-[10px] text-gray-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {new Date(biz.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap items-center sm:shrink-0">
                {biz.instagram_handle && (
                  <a
                    href={`https://instagram.com/${biz.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                    style={{ border: '1px solid rgba(0,0,0,0.1)' }}
                  >
                    Instagram
                  </a>
                )}
                {biz.website_url && (
                  <a
                    href={biz.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                    style={{ border: '1px solid rgba(0,0,0,0.1)' }}
                  >
                    Website
                  </a>
                )}
                {biz.is_suspended ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={actionLoading === biz.id}
                    onClick={() => handleUnsuspend(biz.id)}
                  >
                    Reinstate
                  </Button>
                ) : (
                  <button
                    onClick={() => { setSuspendId(biz.id); setSuspendNote('') }}
                    disabled={actionLoading === biz.id}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold text-red-500 hover:bg-red-50 transition-colors"
                    style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    Suspend
                  </button>
                )}
                <button
                  onClick={() => setDeleteId(biz.id)}
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

      {/* Suspend confirmation modal */}
      {suspendId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-[#1C2B3A] mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Suspend business
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Suspend <strong>{suspendTarget?.business_name ?? suspendTarget?.display_name}</strong>? They will lose access until reinstated.
            </p>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Reason <span className="font-normal normal-case">(optional — internal only)</span>
            </label>
            <textarea
              value={suspendNote}
              onChange={e => setSuspendNote(e.target.value)}
              placeholder="e.g. Breach of terms, no-show pattern…"
              rows={3}
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-black/10 outline-none focus:border-[#F5B800] resize-none mb-5"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setSuspendId(null); setSuspendNote('') }}
                className="text-sm px-4 py-2 rounded-xl text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSuspend(suspendId)}
                disabled={actionLoading === suspendId}
                className="text-sm px-4 py-2 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {actionLoading === suspendId ? 'Suspending…' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (() => {
        const target = businesses.find(b => b.id === deleteId)
        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="font-bold text-[#1C2B3A] mb-1" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Delete business
              </h3>
              <p className="text-sm text-gray-500 mb-1">
                Are you sure you want to delete <strong>{target?.business_name ?? target?.display_name}</strong>?
              </p>
              <p className="text-xs text-red-500 mb-5">This permanently removes their account, profile, collabs, and matches. This cannot be undone.</p>
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
