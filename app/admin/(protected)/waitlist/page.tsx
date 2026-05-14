'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Entry {
  id: string
  email: string
  created_at: string
}

export default function AdminWaitlist() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/waitlist')
    if (res.ok) setEntries(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    setDeleting(id)
    const res = await fetch(`/api/admin/waitlist/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Removed from waitlist')
      setEntries(e => e.filter(x => x.id !== id))
    } else {
      toast.error('Failed to remove')
    }
    setDeleting(null)
  }

  function copyEmails() {
    navigator.clipboard.writeText(entries.map(e => e.email).join(', '))
    toast.success(`${entries.length} email${entries.length !== 1 ? 's' : ''} copied to clipboard`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Waitlist</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? '…' : `${entries.length} sign-up${entries.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {entries.length > 0 && (
          <button
            onClick={copyEmails}
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:bg-[#1C2B3A] hover:text-white"
            style={{ border: '1.5px solid rgba(28,43,58,0.15)', color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}
          >
            Copy all emails
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !entries.length ? (
        <div className="rounded-2xl bg-white px-6 py-16 text-center" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          <p className="text-sm text-gray-400">No signups yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid rgba(0,0,0,0.07)' }}>
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className="flex items-center gap-4 px-5 py-3.5"
              style={{ borderBottom: i < entries.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}
            >
              <div className="flex-1 min-w-0">
                <a
                  href={`mailto:${entry.email}`}
                  className="text-sm font-medium text-[#1C2B3A] hover:underline"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {entry.email}
                </a>
              </div>
              <span className="text-xs text-gray-400 shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {new Date(entry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <button
                onClick={() => handleDelete(entry.id)}
                disabled={deleting === entry.id}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold text-red-400 hover:bg-red-50 transition-colors shrink-0 disabled:opacity-40"
                style={{ border: '1px solid rgba(239,68,68,0.15)' }}
              >
                {deleting === entry.id ? '…' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
