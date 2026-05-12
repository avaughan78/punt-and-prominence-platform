import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; did: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.user_metadata?.role !== 'business') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, did } = await params

  // Verify the match belongs to this business
  const { data: match } = await supabase
    .from('matches')
    .select('id')
    .eq('id', id)
    .eq('business_id', user.id)
    .single()

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('match_deliverables')
    .update({ status: 'verified', verified_at: new Date().toISOString() })
    .eq('id', did)
    .eq('match_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
