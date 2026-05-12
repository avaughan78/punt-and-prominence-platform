import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const origin = (process.env.APP_URL ?? new URL(request.url).origin).replace(/\/$/, '')
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      if (next !== '/') return NextResponse.redirect(`${origin}${next}`)
      const role = data.user.user_metadata?.role
      return NextResponse.redirect(`${origin}${role === 'business' ? '/business' : '/creator'}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
