'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

export function CreatorDashboardAlerts() {
  const [messages, setMessages] = useState(0)

  function refresh() {
    fetch('/api/messages/unread')
      .then(r => r.json())
      .then(d => setMessages(d.messages ?? 0))
      .catch(() => {})
  }

  useEffect(() => {
    refresh()
    window.addEventListener('badges-refresh', refresh)
    return () => window.removeEventListener('badges-refresh', refresh)
  }, [])

  if (messages <= 0) return null

  return (
    <Link href="/creator/matches?filter=unread">
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-4 cursor-pointer hover:opacity-90 transition-opacity"
        style={{ background: 'rgba(245,184,0,0.1)', border: '1.5px solid rgba(245,184,0,0.3)' }}
      >
        <MessageCircle className="w-4 h-4 shrink-0" style={{ color: '#F5B800' }} />
        <p className="text-sm text-[#1C2B3A] flex-1">
          <span className="font-semibold">{messages} unread message{messages !== 1 ? 's' : ''}</span>{' '}from a business
        </p>
        <span className="text-xs font-semibold text-[#F5B800] shrink-0">View →</span>
      </div>
    </Link>
  )
}
