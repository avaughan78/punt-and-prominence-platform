import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, stripe_payment_method_id, card_last_four')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_payment_method_id) {
    return NextResponse.json({ has_card: false })
  }

  return NextResponse.json({
    has_card: true,
    last_four: profile.card_last_four,
  })
}

// Creates a Stripe SetupIntent so the client can securely collect card details
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.user_metadata?.role !== 'business') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single()

  // Create Stripe customer if not yet created
  let customerId = profile?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email,
      metadata: { supabase_id: user.id },
    })
    customerId = customer.id
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
  })

  return NextResponse.json({ client_secret: setupIntent.client_secret })
}

// Called after SetupIntent confirms — stores the payment method
export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { payment_method_id } = await req.json()
  if (!payment_method_id) return NextResponse.json({ error: 'Missing payment_method_id' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) return NextResponse.json({ error: 'No Stripe customer' }, { status: 400 })

  // Set as default payment method on the customer
  await stripe.customers.update(profile.stripe_customer_id, {
    invoice_settings: { default_payment_method: payment_method_id },
  })

  // Fetch last 4 digits
  const pm = await stripe.paymentMethods.retrieve(payment_method_id)
  const last_four = pm.card?.last4 ?? null

  await supabase.from('profiles').update({
    stripe_payment_method_id: payment_method_id,
    has_card_on_file: true,
    card_last_four: last_four,
  }).eq('id', user.id)

  return NextResponse.json({ success: true, last_four })
}
