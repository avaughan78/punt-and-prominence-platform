import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PREVIEW_COOKIE = 'preview_access'

function needsPreviewAccess(path: string): boolean {
  if (path === '/') return false
  if (path.startsWith('/api/')) return false
  if (path.startsWith('/admin')) return false  // has its own Supabase + email auth guard
  if (path.startsWith('/creators')) return false  // public page
  return true
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // If Supabase redirects a magic-link code to / (happens when the callback URL
  // isn't yet whitelisted in Supabase Auth → Redirect URLs), forward it to the
  // real callback so the session exchange still works.
  if (path === '/' && request.nextUrl.searchParams.has('code')) {
    const url = request.nextUrl.clone()
    const code = url.searchParams.get('code')!
    url.pathname = '/api/auth/callback'
    url.search = ''
    url.searchParams.set('code', code)
    return NextResponse.redirect(url)
  }

  // Gate all non-root page routes behind the preview cookie
  if (needsPreviewAccess(path)) {
    const hasAccess = request.cookies.get(PREVIEW_COOKIE)?.value === '1'
    if (!hasAccess) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() makes a server-side token validation call — more reliable than
  // getSession() in middleware where stale cookies can cause redirect loops.
  const { data: { user } } = await supabase.auth.getUser()

  // Helper: redirect while forwarding any refreshed Supabase session cookies.
  // Without this, the redirect response drops the new tokens and the next
  // request sees a stale/missing session → bounce loop.
  function redirectTo(pathname: string, preserveQuery = false): NextResponse {
    const url = request.nextUrl.clone()
    url.pathname = pathname
    if (!preserveQuery) url.search = ''
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...rest }) => {
      res.cookies.set(name, value, rest as Parameters<typeof res.cookies.set>[2])
    })
    return res
  }

  const isBusinessRoute = path.startsWith('/business')
  const isCreatorRoute = path === '/creator' || path.startsWith('/creator/')
  const isAuthPage = path === '/login' || path === '/signup'

  // Redirect unauthenticated users away from dashboard routes
  if ((isBusinessRoute || isCreatorRoute) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    url.searchParams.set('next', path)
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...rest }) => {
      res.cookies.set(name, value, rest as Parameters<typeof res.cookies.set>[2])
    })
    return res
  }

  if (user) {
    const role = user.user_metadata?.role as string | undefined

    // Redirect logged-in users away from auth pages
    if (isAuthPage) {
      return redirectTo(role === 'business' ? '/business' : '/creator')
    }

    // Role-guard: wrong dashboard
    if (isBusinessRoute && role !== 'business') return redirectTo('/creator')
    if (isCreatorRoute && role !== 'creator') return redirectTo('/business')
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)'],
}
