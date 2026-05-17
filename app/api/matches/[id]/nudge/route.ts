import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const NUDGE_MESSAGE =
  "Hi! Just checking in — hoping you've had a chance to visit us. Let us know if you have any questions or if there's anything we can do to help. Looking forward to seeing the content!"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.user_metadata?.role !== 'business') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: match } = await supabase
    .from('matches')
    .select('business_id, closed_at')
    .eq('id', id)
    .single()

  if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (match.business_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (match.closed_at) return NextResponse.json({ error: 'Match is closed' }, { status: 400 })

  const { error } = await supabase
    .from('match_messages')
    .insert({ match_id: id, sender_id: user.id, content: NUDGE_MESSAGE })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
