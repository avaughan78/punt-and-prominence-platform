import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { emailWaitlistConfirmation, emailWaitlistNotify } from '@/lib/email'
import { writeAuditLog } from '@/lib/audit'

const COOKIE = 'waitlist_done'
const COOKIE_OPTS = {
  maxAge: 60 * 60 * 24 * 365, // 1 year
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: false, // must be JS-readable so the page can restore success state on reload
}

export async function POST(req: Request) {
  // Per-browser deduplication — short-circuit before touching the DB
  const cookieStore = await cookies()
  if (cookieStore.get(COOKIE)) {
    return NextResponse.json({ ok: true })
  }

  const { email } = await req.json()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.from('waitlist').insert({ email: email.toLowerCase().trim() })

  if (error) {
    if (error.code === '23505') {
      // Duplicate email — set cookie, no emails (already sent first time)
      const res = NextResponse.json({ ok: true })
      res.cookies.set(COOKIE, '1', COOKIE_OPTS)
      return res
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  // New signup — send confirmation to submitter and notify admin
  await Promise.all([
    emailWaitlistConfirmation({ email }),
    emailWaitlistNotify({ email }),
    writeAuditLog({
      event_type: 'waitlist.signup',
      actor: 'system',
      subject_type: 'waitlist',
      subject_id: email,
      metadata: { email },
    }),
  ])

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, '1', COOKIE_OPTS)
  return res
}
