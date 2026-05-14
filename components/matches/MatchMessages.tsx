'use client'
import { useEffect, useRef, useState } from 'react'
import { Send, MessageCircle, ChevronDown } from 'lucide-react'

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

function Avatar({ name, url, size = 6 }: { name: string; url: string | null; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const cls = `w-${size} h-${size} rounded-full flex-shrink-0`
  return url ? (
    <img src={url} alt={name} className={`${cls} object-cover`} />
  ) : (
    <div className={`${cls} flex items-center justify-center text-[9px] font-bold text-white`} style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}>
      {initials}
    </div>
  )
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return `Yesterday ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

export function MatchMessages({ matchId, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [unread, setUnread] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch unread count on mount (without loading full thread)
  useEffect(() => {
    fetch(`/api/matches/${matchId}/messages/unread`)
      .then(r => r.json())
      .then(d => setUnread(d.count ?? 0))
      .catch(() => {})
  }, [matchId])

  useEffect(() => {
    if (!open || loaded) return
    fetch(`/api/matches/${matchId}/messages`)
      .then(r => r.json())
      .then(d => { setMessages(Array.isArray(d) ? d : []); setLoaded(true); setUnread(0) })
  }, [open, matchId, loaded])

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open])

  useEffect(() => {
    if (open) inputRef.current?.focus({ preventScroll: true })
  }, [open])

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

  const otherMessages = messages.filter(m => m.sender_id !== currentUserId)
  const lastOther = otherMessages[otherMessages.length - 1]

  return (
    <div>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition-all hover:shadow-sm group"
        style={{
          background: open
            ? 'linear-gradient(135deg, #1C2B3A 0%, #253d54 100%)'
            : unread > 0
              ? 'linear-gradient(135deg, #1C2B3A 0%, #253d54 100%)'
              : 'rgba(28,43,58,0.04)',
          border: open || unread > 0 ? '1px solid rgba(28,43,58,0.0)' : '1px solid rgba(28,43,58,0.1)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: open || unread > 0 ? 'rgba(255,255,255,0.12)' : 'rgba(28,43,58,0.08)' }}
          >
            <MessageCircle
              className="w-3.5 h-3.5"
              style={{ color: open || unread > 0 ? '#ffffff' : '#1C2B3A' }}
            />
          </div>
          <span
            className="text-xs font-semibold"
            style={{ fontFamily: "'Inter', sans-serif", color: open || unread > 0 ? '#ffffff' : '#1C2B3A' }}
          >
            Messages
          </span>
          {unread > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1"
              style={{ background: '#F5B800', color: '#1C2B3A', fontFamily: "'JetBrains Mono', monospace" }}
            >
              {unread}
            </span>
          )}
          {!unread && messages.length > 0 && (
            <span
              className="text-[10px]"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: open ? 'rgba(255,255,255,0.45)' : '#9ca3af' }}
            >
              {messages.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!open && lastOther && (
            <span
              className="text-[10px] truncate max-w-[120px]"
              style={{ fontFamily: "'Inter', sans-serif", color: unread > 0 ? 'rgba(255,255,255,0.6)' : '#9ca3af' }}
            >
              {lastOther.content}
            </span>
          )}
          <ChevronDown
            className="w-3.5 h-3.5 transition-transform"
            style={{
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              color: open || unread > 0 ? 'rgba(255,255,255,0.5)' : '#9ca3af',
            }}
          />
        </div>
      </button>

      {open && (
        <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(28,43,58,0.1)' }}>
          {/* Thread */}
          <div
            ref={scrollRef}
            className="flex flex-col gap-3 p-3 max-h-64 overflow-y-auto"
            style={{ background: '#fafafa' }}
          >
            {!loaded ? (
              <div className="flex justify-center py-6">
                <div className="w-4 h-4 rounded-full border-2 border-[#F5B800] border-t-transparent animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-6">
                <MessageCircle className="w-6 h-6 text-gray-200" />
                <p className="text-xs text-gray-400 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
                  No messages yet. Send the first one.
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => {
                  const isMe = msg.sender_id === currentUserId
                  const prevSame = i > 0 && messages[i - 1].sender_id === msg.sender_id
                  return (
                    <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${prevSame ? 'mt-0.5' : 'mt-1'}`}>
                      {!prevSame ? (
                        <Avatar name={msg.sender?.display_name ?? ''} url={msg.sender?.avatar_url ?? null} size={6} />
                      ) : (
                        <div className="w-6 flex-shrink-0" />
                      )}
                      <div className={`flex flex-col gap-0.5 max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
                        {!prevSame && (
                          <span className="text-[10px] text-gray-400 px-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {isMe ? 'You' : msg.sender?.display_name} · {formatTime(msg.created_at)}
                          </span>
                        )}
                        <div
                          className="px-3 py-2 rounded-2xl text-xs leading-relaxed"
                          style={{
                            background: isMe ? '#1C2B3A' : '#ffffff',
                            color: isMe ? 'white' : '#1C2B3A',
                            border: isMe ? 'none' : '1px solid rgba(0,0,0,0.08)',
                            borderBottomRightRadius: isMe ? '4px' : '16px',
                            borderBottomLeftRadius: isMe ? '16px' : '4px',
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>

          {/* Input bar */}
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.06)' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Type a message…"
              maxLength={1000}
              className="flex-1 py-1.5 text-xs bg-transparent outline-none"
              style={{ color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}
            />
            <button
              type="button"
              onClick={send}
              disabled={!draft.trim() || sending}
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-all disabled:opacity-30 hover:opacity-80"
              style={{ background: '#1C2B3A', flexShrink: 0 }}
            >
              <Send className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
