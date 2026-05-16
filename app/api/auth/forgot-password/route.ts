import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emailPasswordReset } from '@/lib/email'

export async function POST(request: NextRequest) {
  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const appUrl = (process.env.APP_URL ?? new URL(request.url).origin).replace(/\/$/, '')
  const supabase = createAdminClient()

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${appUrl}/api/auth/callback?next=/reset-password` },
  })

  if (error || !data?.properties?.action_link) {
    // Return success regardless so we don't leak whether an email exists
    return NextResponse.json({ ok: true })
  }

  await emailPasswordReset({ email, resetUrl: data.properties.action_link })

  return NextResponse.json({ ok: true })
}
