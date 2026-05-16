import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('matches')
    .select(`
      punt_code,
      status,
      invite:offers(
        title,
        invite_type,
        business:profiles!offers_business_id_fkey(business_name, display_name)
      ),
      creator:profiles!matches_creator_id_fkey(display_name, instagram_handle, avatar_url)
    `)
    .eq('punt_code', code.toUpperCase())
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
