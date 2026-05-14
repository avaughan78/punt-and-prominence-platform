'use client'
import { useEffect, useRef, useState } from 'react'
import { Send, MessageCircle } from 'lucide-react'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  sender: { display_name: string; avatar_url: string | null }
}

interface Props {
  matchId: string
  currentUserId: string
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return `Yesterday ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

export function InlineMessageThread({ matchId, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/matches/${matchId}/messages`)
      .then(r => r.json())
      .then(d => { setMessages(Array.isArray(d) ? d : []); setLoaded(true) })
  }, [matchId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => { inputRef.current?.focus() }, [])

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

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(28,43,58,0.08)' }}>
      {/* Bubble thread */}
      <div
        className="flex flex-col p-3 overflow-y-auto"
        style={{ background: '#f8f9fb', maxHeight: '280px', minHeight: '80px', gap: '2px' }}
      >
        {!loaded ? (
          <div className="flex justify-center py-8">
            <div className="w-4 h-4 rounded-full border-2 border-[#F5B800] border-t-transparent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <MessageCircle className="w-7 h-7 text-gray-200" />
            <p className="text-xs text-gray-400">No messages yet. Say hello.</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMe = msg.sender_id === currentUserId
              const prevSame = i > 0 && messages[i - 1].sender_id === msg.sender_id
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 items-end ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  style={{ marginTop: prevSame ? 2 : 10 }}
                >
                  {!prevSame ? (
                    <div className="w-6 h-6 rounded-full flex-shrink-0 overflow-hidden self-start mt-1">
                      {msg.sender?.avatar_url ? (
                        <img src={msg.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #1C2B3A, #6BE6B0)' }}
                        >
                          {(msg.sender?.display_name ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-6 flex-shrink-0" />
                  )}
                  <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {!prevSame && (
                      <span className="text-[10px] text-gray-400 px-1 mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {isMe ? 'You' : msg.sender?.display_name} · {formatTime(msg.created_at)}
                      </span>
                    )}
                    <div
                      className="px-3 py-2 text-xs leading-relaxed"
                      style={{
                        background: isMe ? '#1C2B3A' : '#ffffff',
                        color: isMe ? 'white' : '#1C2B3A',
                        border: isMe ? 'none' : '1px solid rgba(0,0,0,0.08)',
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      <div
        className="flex items-center gap-2 px-3 py-2.5"
        style={{ background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.06)' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Message…"
          maxLength={1000}
          className="flex-1 py-1 text-xs bg-transparent outline-none"
          style={{ color: '#1C2B3A', fontFamily: "'Inter', sans-serif" }}
        />
        <button
          type="button"
          onClick={send}
          disabled={!draft.trim() || sending}
          className="flex items-center justify-center w-7 h-7 rounded-xl transition-all disabled:opacity-30 hover:opacity-80"
          style={{ background: '#1C2B3A', flexShrink: 0 }}
        >
          <Send className="w-3 h-3 text-white" />
        </button>
      </div>
    </div>
  )
}
