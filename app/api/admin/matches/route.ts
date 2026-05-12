import { adminGuard } from '@/lib/adminGuard'
import { NextResponse } from 'next/server'

export async function GET() {
  const guard = await adminGuard()
  if ('error' in guard) return guard.error
  const { supabase } = guard

  const { data, error } = await supabase
    .from('matches')
    .select('id, status, created_at, punt_code, offer:offers(title, value_gbp, fee_gbp, invite_type), creator:profiles!matches_creator_id_fkey(display_name, instagram_handle), business:profiles!matches_business_id_fkey(business_name, display_name)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
