import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const appOrigin = (process.env.APP_URL ?? new URL(request.url).origin).replace(/\/$/, '')
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    // Collect cookies set during the exchange so we can attach them to whichever
    // redirect response we end up creating (NextResponse.redirect creates a new
    // response object, so cookies set via next/headers won't be on it).
    const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (items) => {
            items.forEach(({ name, value, options }) =>
              pendingCookies.push({ name, value, options: (options ?? {}) as Record<string, unknown> })
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      let destination: string
      if (next !== '/') {
        destination = `${appOrigin}${next}`
      } else {
        const role = data.user.user_metadata?.role
        destination = `${appOrigin}${role === 'business' ? '/business' : '/creator'}`
      }

      const response = NextResponse.redirect(destination)
      // Attach session cookies to the redirect response
      pendingCookies.forEach(({ name, value, options }) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response.cookies.set(name, value, options as any)
      )
      return response
    }
  }

  return NextResponse.redirect(`${appOrigin}/login?error=auth`)
}
