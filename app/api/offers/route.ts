import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.user_metadata?.role

  let query = supabase
    .from('offers')
    .select('*, business:profiles!offers_business_id_fkey(id, display_name, business_name, address_line, category)')
    .order('created_at', { ascending: false })

  if (role === 'business') {
    query = query.eq('business_id', user.id)
  } else {
    // Creators see active offers with available slots
    query = query.eq('is_active', true).filter('slots_claimed', 'lt', 'slots_total') as typeof query
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.user_metadata?.role !== 'business') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('offers')
    .insert({ ...body, business_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
