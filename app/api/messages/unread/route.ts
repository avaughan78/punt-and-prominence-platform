import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ count: 0 })

  const role = user.user_metadata?.role

  if (role === 'business') {
    // Count posted matches — each represents a creator submission needing the
    // business to verify deliverables and/or mark the creator as fulfilled.
    const { count } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', user.id)
      .eq('status', 'posted')

    return NextResponse.json({ count: count ?? 0 })
  }

  return NextResponse.json({ count: 0 })
}
