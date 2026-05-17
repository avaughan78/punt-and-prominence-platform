import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://puntandprominence.com'

// Creates a Stripe Express account and returns an onboarding URL
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.user_metadata?.role !== 'creator') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id, email')
    .eq('id', user.id)
    .single()

  let accountId = profile?.stripe_account_id

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'GB',
      email: profile?.email ?? user.email,
      capabilities: { transfers: { requested: true } },
      metadata: { supabase_id: user.id },
    })
    accountId = account.id
    await supabase.from('profiles').update({ stripe_account_id: accountId }).eq('id', user.id)
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${APP_URL}/creator/profile?stripe=refresh`,
    return_url: `${APP_URL}/creator/profile?stripe=success`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}

// Returns the creator's onboarding status
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id, stripe_onboarding_complete')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_account_id) {
    return NextResponse.json({ connected: false, complete: false })
  }

  // If already marked complete, trust that
  if (profile.stripe_onboarding_complete) {
    return NextResponse.json({ connected: true, complete: true })
  }

  // Otherwise check live with Stripe
  const account = await stripe.accounts.retrieve(profile.stripe_account_id)
  const complete = account.details_submitted && (account.capabilities?.transfers === 'active')

  if (complete) {
    await supabase.from('profiles')
      .update({ stripe_onboarding_complete: true })
      .eq('id', user.id)
  }

  return NextResponse.json({ connected: true, complete: !!complete })
}
