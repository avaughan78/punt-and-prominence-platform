import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return NextResponse.json({ error: 'Admin not configured' }, { status: 500 })

  const supabase = await createClient()
  const appOrigin = (process.env.APP_URL ?? new URL(request.url).origin).replace(/\/$/, '')

  const { error } = await supabase.auth.signInWithOtp({
    email: adminEmail,
    options: { emailRedirectTo: `${appOrigin}/api/auth/callback?next=/admin` },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
