import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const last_four = String(body.card_number ?? '').replace(/\s/g, '').slice(-4)

  console.log('[MOCK STRIPE] Card-on-file request:', {
    user_id: user.id,
    last_four,
    expiry: body.expiry,
    timestamp: new Date().toISOString(),
  })

  await supabase
    .from('profiles')
    .update({ has_card_on_file: true, card_last_four: last_four })
    .eq('id', user.id)

  return NextResponse.json({ success: true })
}
