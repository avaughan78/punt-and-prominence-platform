import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify caller is a party to this match
  const { data: match } = await supabase
    .from('matches')
    .select('creator_id, business_id')
    .eq('id', id)
    .single()
  if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (match.creator_id !== user.id && match.business_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('match_messages')
    .select('id, sender_id, content, created_at, sender:profiles!match_messages_sender_id_fkey(display_name, avatar_url, role)')
    .eq('match_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mark thread as read
  await supabase.from('match_message_reads').upsert(
    { match_id: id, user_id: user.id, last_read_at: new Date().toISOString() },
    { onConflict: 'match_id,user_id' }
  )

  return NextResponse.json(data ?? [])
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })
  if (content.length > 1000) return NextResponse.json({ error: 'Message too long' }, { status: 400 })

  const { data, error } = await supabase
    .from('match_messages')
    .insert({ match_id: id, sender_id: user.id, content: content.trim() })
    .select('id, sender_id, content, created_at, sender:profiles!match_messages_sender_id_fkey(display_name, avatar_url, role)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
