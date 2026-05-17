'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileCheck, MessageCircle } from 'lucide-react'

interface PostDetail {
  creatorHandle: string | null
  creatorName: string
  offerTitle: string
}

interface AlertData {
  posts: number
  messages: number
  postsDetail: PostDetail[]
}

export function BusinessDashboardAlerts() {
  const [data, setData] = useState<AlertData | null>(null)

  function refresh() {
    fetch('/api/messages/unread')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }

  useEffect(() => {
    refresh()
    window.addEventListener('badges-refresh', refresh)
    window.addEventListener('deliverable-verified', refresh)
    return () => {
      window.removeEventListener('badges-refresh', refresh)
      window.removeEventListener('deliverable-verified', refresh)
    }
  }, [])

  if (!data) return null

  return (
    <>
      {data.posts > 0 && (
        <Link href="/business/invites?filter=review">
          <div
            className="flex items-start gap-3 rounded-2xl px-4 py-3 mb-4 cursor-pointer hover:opacity-90 transition-opacity"
            style={{ background: 'rgba(192,132,252,0.08)', border: '1.5px solid rgba(192,132,252,0.3)' }}
          >
            <FileCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#9333ea' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1C2B3A]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {data.posts} post{data.posts !== 1 ? 's' : ''} ready to verify
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                {(data.postsDetail ?? []).slice(0, 3).map((p, i) => (
                  <span key={i} className="text-xs text-gray-500">
                    {p.creatorHandle ? `@${p.creatorHandle}` : p.creatorName} · {p.offerTitle}
                  </span>
                ))}
                {(data.postsDetail ?? []).length > 3 && (
                  <span className="text-xs text-gray-400">+{data.postsDetail.length - 3} more</span>
                )}
              </div>
            </div>
            <span className="text-xs font-semibold shrink-0" style={{ color: '#9333ea' }}>Review →</span>
          </div>
        </Link>
      )}

      {data.messages > 0 && (
        <Link href="/business/invites?filter=unread">
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-4 cursor-pointer hover:opacity-90 transition-opacity"
            style={{ background: 'rgba(245,184,0,0.1)', border: '1.5px solid rgba(245,184,0,0.3)' }}
          >
            <MessageCircle className="w-4 h-4 shrink-0" style={{ color: '#F5B800' }} />
            <p className="text-sm text-[#1C2B3A] flex-1">
              <span className="font-semibold">{data.messages} unread message{data.messages !== 1 ? 's' : ''}</span>{' '}from your creators
            </p>
            <span className="text-xs font-semibold text-[#F5B800] shrink-0">View →</span>
          </div>
        </Link>
      )}
    </>
  )
}
