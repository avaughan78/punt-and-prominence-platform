import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

  if (error && error.code !== '23505') {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  // Success (new or duplicate email) — set cookie so this browser can't resubmit
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, '1', COOKIE_OPTS)
  return res
}
