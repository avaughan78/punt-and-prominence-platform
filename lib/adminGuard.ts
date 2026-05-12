import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function adminGuard(): Promise<{ error: NextResponse } | { supabase: Awaited<ReturnType<typeof createClient>> }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return { error: NextResponse.json({ error: 'Admin not configured' }, { status: 500 }) }
  if (!user || user.email !== adminEmail) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { supabase }
}
