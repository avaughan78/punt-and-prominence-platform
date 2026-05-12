import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return NextResponse.json({ error: 'Admin not configured' }, { status: 500 })

  const supabase = await createClient()
  const origin = process.env.APP_URL ?? new URL(request.url).origin
  await supabase.auth.signInWithOtp({
    email: adminEmail,
    options: { emailRedirectTo: `${origin}/api/auth/callback?next=/admin` },
  })

  return NextResponse.json({ ok: true })
}
