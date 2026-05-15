import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ count: 0 })

  const role = user.user_metadata?.role

  if (role === 'business') {
    // Count unverified deliverables across all 'posted' matches for this business.
    // Falls back to counting the match itself for legacy post_url-only matches.
    const { data: matches } = await supabase
      .from('matches')
      .select('id, post_url, deliverables:match_deliverables(status)')
      .eq('business_id', user.id)
      .eq('status', 'posted')

    if (!matches) return NextResponse.json({ count: 0 })

    const count = matches.reduce((sum, m) => {
      const delivs = (m.deliverables as { status: string }[]) ?? []
      if (delivs.length === 0) return sum + (m.post_url ? 1 : 0)
      return sum + delivs.filter(d => d.status !== 'verified').length
    }, 0)

    return NextResponse.json({ count })
  }

  return NextResponse.json({ count: 0 })
}
