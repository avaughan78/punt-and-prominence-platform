import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.user_metadata?.role !== 'creator') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { month_number, post_url } = await req.json() as { month_number: number; post_url: string }

  if (!month_number || !post_url) return NextResponse.json({ error: 'month_number and post_url required' }, { status: 400 })

  // Verify the match belongs to this creator and is active
  const { data: match } = await supabase
    .from('matches')
    .select('id, status, business_id, business:profiles!matches_business_id_fkey(display_name, business_name, email), invite:offers(title)')
    .eq('id', id)
    .eq('creator_id', user.id)
    .single()

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  if (match.status !== 'active') return NextResponse.json({ error: 'Match is not active' }, { status: 400 })

  const { data, error } = await supabase
    .from('match_deliverables')
    .insert({ match_id: id, month_number, post_url })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Post already submitted for this month' }, { status: 400 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
