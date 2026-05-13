'use client'
import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  sender: { display_name: string; avatar_url: string | null; role: string }
}

interface Props {
  matchId: string
  currentUserId: string
}

export function MatchMessages({ matchId, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || loaded) return
    fetch(`/api/matches/${matchId}/messages`)
      .then(r => r.json())
      .then(d => { setMessages(Array.isArray(d) ? d : []); setLoaded(true) })
  }, [open, matchId, loaded])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function send() {
    if (!draft.trim() || sending) return
    setSending(true)
    const res = await fetch(`/api/matches/${matchId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: draft.trim() }),
    })
    if (res.ok) {
      const msg = await res.json()
      setMessages(prev => [...prev, msg])
      setDraft('')
    }
    setSending(false)
  }

  const unread = messages.length

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs font-medium transition-colors"
        style={{ color: open ? '#1C2B3A' : '#6b7280', fontFamily: "'Inter', sans-serif" }}
      >
        <span>{open ? '▾' : '▸'} Messages</span>
        {unread > 0 && !open && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: '#1C2B3A' }}>
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-2">
          {/* Thread */}
          <div
            className="flex flex-col gap-2 max-h-52 overflow-y-auto rounded-xl p-3"
            style={{ background: 'rgba(28,43,58,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}
          >
            {messages.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No messages yet. Say hello!</p>
            ) : (
              messages.map(msg => {
                const isMe = msg.sender_id === currentUserId
                return (
                  <div key={msg.id} className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className="max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed"
                      style={{
                        background: isMe ? '#1C2B3A' : 'white',
                        color: isMe ? 'white' : '#1C2B3A',
                        border: isMe ? 'none' : '1px solid rgba(0,0,0,0.08)',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-400 px-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {isMe ? 'You' : msg.sender?.display_name} · {formatDate(msg.created_at)}
                    </span>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Type a message…"
              maxLength={1000}
              className="flex-1 px-3 py-2 text-xs rounded-xl outline-none transition-all focus:ring-2 focus:ring-black/10"
              style={{ border: '1px solid rgba(0,0,0,0.1)', fontFamily: "'Inter', sans-serif" }}
            />
            <button
              type="button"
              onClick={send}
              disabled={!draft.trim() || sending}
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-all disabled:opacity-30"
              style={{ background: '#1C2B3A' }}
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
