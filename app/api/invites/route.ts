import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { writeAuditLog } from '@/lib/audit'
import { isBusinessProfileComplete } from '@/lib/profileComplete'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.user_metadata?.role

  const businessSelect = `*, business:profiles!offers_business_id_fkey(id, display_name, business_name, address_line, category, latitude, longitude, avatar_url, instagram_handle), matches(id, status, punt_code, created_at, post_url, creator:profiles!matches_creator_id_fkey(id, display_name, instagram_handle, avatar_url, follower_count))`
  const creatorSelect = `*, business:profiles!offers_business_id_fkey(id, display_name, business_name, address_line, category, latitude, longitude, avatar_url, instagram_handle)`

  let query = supabase
    .from('offers')
    .select(role === 'business' ? businessSelect : creatorSelect)
    .order('created_at', { ascending: false })

  if (role === 'business') {
    query = query.eq('business_id', user.id)
  } else {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // For creators, filter out full offers in JS (PostgREST can't compare two columns)
  const result = role === 'creator'
    ? (data ?? []).filter((o: { slots_claimed: number; slots_total: number }) => o.slots_claimed < o.slots_total)
    : data
  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.user_metadata?.role !== 'business') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: bizCheck } = await supabase
    .from('profiles')
    .select('business_name, category, address_line')
    .eq('id', user.id)
    .single()
  if (!isBusinessProfileComplete(bizCheck as Record<string, unknown>)) {
    return NextResponse.json({ error: 'Complete your profile before posting collabs — add your business name, category, and address.' }, { status: 403 })
  }

  const body = await req.json()
  const { data, error } = await supabase
    .from('offers')
    .insert({ ...body, business_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: bizProfile } = await supabase.from('profiles').select('business_name, display_name').eq('id', user.id).single()
  await writeAuditLog({
    event_type: 'invite.created',
    actor: user.email ?? user.id,
    subject_type: 'invite',
    subject_id: data.id,
    metadata: {
      title: data.title,
      invite_type: data.invite_type,
      value_gbp: data.value_gbp,
      fee_gbp: data.fee_gbp,
      slots_total: data.slots_total,
      business_name: bizProfile?.business_name ?? bizProfile?.display_name,
    },
  })

  return NextResponse.json(data, { status: 201 })
}
