import { adminGuard } from '@/lib/adminGuard'
import { NextResponse } from 'next/server'

export async function GET() {
  const guard = await adminGuard()
  if ('error' in guard) return guard.error
  const { supabase } = guard

  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, business_name, address_line, category, avatar_url, created_at, website_url, instagram_handle')
    .eq('role', 'business')
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}
