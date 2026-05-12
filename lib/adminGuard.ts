import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function adminGuard(): Promise<{ error: NextResponse } | { supabase: ReturnType<typeof createAdminClient> }> {
  // Verify the caller is the admin using the regular (cookie-authed) client
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return { error: NextResponse.json({ error: 'Admin not configured' }, { status: 500 }) }
  if (!user || user.email !== adminEmail) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  // Return the service-role client so mutations bypass RLS
  return { supabase: createAdminClient() }
}
