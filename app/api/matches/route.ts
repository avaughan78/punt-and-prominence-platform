import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generatePuntCode } from '@/lib/utils'
import { emailMatchClaimed } from '@/lib/email'
import { writeAuditLog } from '@/lib/audit'
import { isCreatorProfileComplete } from '@/lib/profileComplete'
import { stripe } from '@/lib/stripe'

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
      invite:offers(*,business:profiles!offers_business_id_fkey(id,display_name,business_name,address_line,latitude,longitude,avatar_url,instagram_handle)),
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

  // Check creator is approved and profile is complete
  const { data: creatorCheck } = await supabase
    .from('profiles')
    .select('is_approved, instagram_handle, follower_count')
    .eq('id', user.id)
    .single()
  if (!creatorCheck?.is_approved) {
    return NextResponse.json({ error: 'Your profile is under review. You\'ll be able to claim collabs once approved.' }, { status: 403 })
  }
  if (!isCreatorProfileComplete(creatorCheck as Record<string, unknown>)) {
    return NextResponse.json({ error: 'Complete your profile before claiming collabs — add your Instagram handle and follower count.' }, { status: 403 })
  }

  const { offer_id } = await req.json()

  // Get the offer to find business_id and check slots
  const { data: offer, error: offerErr } = await supabase
    .from('offers')
    .select('id, title, business_id, slots_total, slots_claimed, is_active, compensation_type, value_gbp')
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

  // For paid collabs — hold payment on the business card immediately
  if ((offer as { compensation_type?: string }).compensation_type === 'paid') {
    try {
      const { data: biz } = await supabase
        .from('profiles')
        .select('stripe_customer_id, stripe_payment_method_id')
        .eq('id', offer.business_id)
        .single()

      const { data: creator } = await supabase
        .from('profiles')
        .select('stripe_account_id, stripe_onboarding_complete')
        .eq('id', user.id)
        .single()

      if (
        biz?.stripe_customer_id &&
        biz?.stripe_payment_method_id &&
        creator?.stripe_account_id &&
        creator?.stripe_onboarding_complete
      ) {
        const amountPence = Math.round(((offer as { value_gbp?: number }).value_gbp ?? 0) * 100)
        const intent = await stripe.paymentIntents.create({
          amount: amountPence,
          currency: 'gbp',
          customer: biz.stripe_customer_id,
          payment_method: biz.stripe_payment_method_id,
          capture_method: 'manual',
          confirm: true,
          off_session: true,
          description: `Punt & Prominence — ${(offer as { title?: string }).title}`,
          metadata: { match_id: data.id, offer_id },
          transfer_data: { destination: creator.stripe_account_id },
          on_behalf_of: creator.stripe_account_id,
        })
        await supabase
          .from('matches')
          .update({ stripe_payment_intent_id: intent.id, payout_status: 'pending' })
          .eq('id', data.id)
      }
    } catch (err) {
      console.error('[Stripe] Failed to hold payment for match', data.id, err)
      // Don't block match creation — flag for manual follow-up
    }
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
