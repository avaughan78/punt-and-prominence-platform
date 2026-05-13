import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ count: 0 })

  // Get last_read_at for this user on this match
  const { data: readRecord } = await supabase
    .from('match_message_reads')
    .select('last_read_at')
    .eq('match_id', id)
    .eq('user_id', user.id)
    .single()

  const lastRead = readRecord?.last_read_at ?? '1970-01-01T00:00:00Z'

  const { count } = await supabase
    .from('match_messages')
    .select('id', { count: 'exact', head: true })
    .eq('match_id', id)
    .neq('sender_id', user.id)
    .gt('created_at', lastRead)

  return NextResponse.json({ count: count ?? 0 })
}
