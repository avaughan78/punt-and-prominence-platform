'use client'
import { useEffect, useState } from 'react'

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
}

export default function AdminBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/businesses')
    if (res.ok) setBusinesses(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = businesses.filter(b => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      b.display_name?.toLowerCase().includes(q) ||
      b.business_name?.toLowerCase().includes(q) ||
      b.address_line?.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Businesses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{businesses.length} registered</p>
        </div>
        <input
          type="search"
          placeholder="Search businesses…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-sm px-4 py-2 rounded-xl border border-black/10 outline-none focus:border-[#F5B800] w-56"
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !filtered.length ? (
        <p className="text-sm text-gray-400">No businesses found.</p>
      ) : (
        <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          {filtered.map((biz, i) => (
            <div key={biz.id} className="flex items-center gap-4 px-4 py-4" style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
              {biz.avatar_url ? (
                <img src={biz.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0 flex items-center justify-center text-sm font-bold text-gray-400">
                  {(biz.business_name ?? biz.display_name)?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1C2B3A]">{biz.business_name ?? biz.display_name}</p>
                <p className="text-xs text-gray-400">
                  {biz.display_name}{biz.category ? ` · ${biz.category}` : ''}
                  {biz.address_line ? ` · ${biz.address_line}` : ''}
                </p>
              </div>
              <div className="flex gap-2 shrink-0 items-center">
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
