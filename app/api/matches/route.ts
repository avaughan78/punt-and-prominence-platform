import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generatePuntCode } from '@/lib/utils'
import { emailMatchClaimed } from '@/lib/email'
import { writeAuditLog } from '@/lib/audit'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.user_metadata?.role
  const field = role === 'business' ? 'business_id' : 'creator_id'

  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      invite:offers(*,business:profiles!offers_business_id_fkey(id,display_name,business_name,address_line,latitude,longitude)),
      creator:profiles!matches_creator_id_fkey(id,display_name,instagram_handle,avatar_url,follower_count),
      business:profiles!matches_business_id_fkey(id,display_name,business_name,address_line),
      deliverables:match_deliverables(*)
    `)
    .eq(field, user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.user_metadata?.role !== 'creator') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Check creator is approved
  const { data: approvalCheck } = await supabase
    .from('profiles')
    .select('is_approved')
    .eq('id', user.id)
    .single()
  if (!approvalCheck?.is_approved) {
    return NextResponse.json({ error: 'Your profile is under review. You\'ll be able to claim collabs once approved.' }, { status: 403 })
  }

  const { offer_id } = await req.json()

  // Get the offer to find business_id and check slots
  const { data: offer, error: offerErr } = await supabase
    .from('offers')
    .select('id, title, business_id, slots_total, slots_claimed, is_active')
    .eq('id', offer_id)
    .single()

  if (offerErr || !offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
  if (!offer.is_active) return NextResponse.json({ error: 'Offer is no longer active' }, { status: 400 })
  if (offer.slots_claimed >= offer.slots_total) return NextResponse.json({ error: 'No slots remaining' }, { status: 400 })

  // Generate a unique punt code
  let punt_code = generatePuntCode()
  let attempts = 0
  while (attempts < 10) {
    const { data: existing } = await supabase.from('matches').select('id').eq('punt_code', punt_code).single()
    if (!existing) break
    punt_code = generatePuntCode()
    attempts++
  }

  const { data, error } = await supabase
    .from('matches')
    .insert({ offer_id, creator_id: user.id, business_id: offer.business_id, punt_code })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'You have already claimed this offer' }, { status: 400 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify the business (fire and forget)
  const { data: bizProfile } = await supabase
    .from('profiles')
    .select('display_name, business_name, email')
    .eq('id', offer.business_id)
    .single()
  const { data: creatorProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()
  if (bizProfile?.email) {
    await emailMatchClaimed({
      businessEmail: bizProfile.email,
      businessName: bizProfile.business_name ?? bizProfile.display_name,
      creatorName: creatorProfile?.display_name ?? 'A creator',
      offerTitle: (offer as { title?: string }).title ?? 'Offer',
      puntCode: punt_code,
    })
  }

  await writeAuditLog({
    event_type: 'match.created',
    actor: user.email ?? user.id,
    subject_type: 'match',
    subject_id: data.id,
    metadata: {
      punt_code,
      offer_title: (offer as { title?: string }).title,
      creator_name: creatorProfile?.display_name,
      business_name: bizProfile?.business_name ?? bizProfile?.display_name,
    },
  })

  return NextResponse.json(data, { status: 201 })
}
