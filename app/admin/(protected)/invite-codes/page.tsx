'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'

interface InviteCode {
  id: string
  code: string
  used: boolean
  used_by: string | null
  created_at: string
  reusable: boolean
}

function randomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function AdminInviteCodes() {
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [loading, setLoading] = useState(true)
  const [newCode, setNewCode] = useState('')
  const [reusable, setReusable] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/invite-codes')
    if (res.ok) setCodes(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError('')
    const res = await fetch('/api/admin/invite-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: newCode, reusable }),
    })
    if (res.ok) {
      setNewCode('')
      setReusable(false)
      await load()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Failed to create code')
    }
    setCreating(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/invite-codes/${id}`, { method: 'DELETE' })
    await load()
  }

  async function handleToggleUsed(code: InviteCode) {
    await fetch(`/api/admin/invite-codes/${code.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ used: !code.used }),
    })
    await load()
  }

  const unused = codes.filter(c => !c.used || c.reusable)
  const used = codes.filter(c => c.used && !c.reusable)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Invite codes</h1>
        <p className="text-sm text-gray-500 mt-0.5">{codes.filter(c => !c.used).length} unused · {codes.filter(c => c.reusable).length} reusable</p>
      </div>

      {/* Create form */}
      <div className="rounded-2xl bg-white p-5 mb-6" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
        <h2 className="font-semibold text-[#1C2B3A] mb-4 text-sm">Create new code</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Code</label>
            <div className="flex gap-2">
              <input
                value={newCode}
                onChange={e => setNewCode(e.target.value.toUpperCase())}
                placeholder="e.g. LAUNCH25"
                className="text-sm px-3 py-2 rounded-xl border border-black/10 outline-none focus:border-[#F5B800] font-mono uppercase w-36"
                required
              />
              <button
                type="button"
                onClick={() => setNewCode(randomCode())}
                className="text-xs px-3 py-2 rounded-xl text-gray-500 hover:bg-gray-50 border border-black/10"
              >
                Random
              </button>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer mb-0.5">
            <input
              type="checkbox"
              checked={reusable}
              onChange={e => setReusable(e.target.checked)}
              className="rounded"
            />
            Reusable
          </label>
          <Button type="submit" loading={creating} size="sm">Create</Button>
        </form>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <>
          {unused.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-[#1C2B3A] mb-3 text-sm">Active codes</h2>
              <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
                {unused.map((code, i) => (
                  <div key={code.id} className="flex items-center gap-4 px-4 py-3" style={{ borderBottom: i < unused.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                    <span className="text-sm font-bold font-mono text-[#1C2B3A] tracking-wider w-28">{code.code}</span>
                    <div className="flex gap-2">
                      {code.reusable && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-600">reusable</span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-50 text-green-600">active</span>
                    </div>
                    <div className="flex gap-2 ml-auto">
                      <button
                        onClick={() => handleToggleUsed(code)}
                        className="text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50 border border-black/10"
                      >
                        Mark used
                      </button>
                      <button
                        onClick={() => handleDelete(code.id)}
                        className="text-xs px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-50 border border-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {used.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-400 mb-3 text-sm">Used codes</h2>
              <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
                {used.map((code, i) => (
                  <div key={code.id} className="flex items-center gap-4 px-4 py-3 opacity-60" style={{ borderBottom: i < used.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                    <span className="text-sm font-bold font-mono text-[#1C2B3A] tracking-wider line-through w-28">{code.code}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-400">used</span>
                    <div className="flex gap-2 ml-auto">
                      <button
                        onClick={() => handleToggleUsed(code)}
                        className="text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50 border border-black/10"
                      >
                        Reactivate
                      </button>
                      <button
                        onClick={() => handleDelete(code.id)}
                        className="text-xs px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-50 border border-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
