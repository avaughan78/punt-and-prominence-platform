import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function isAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === process.env.ADMIN_EMAIL
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('waitlist')
    .select('id, email, created_at')
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}
