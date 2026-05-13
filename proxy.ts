import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PREVIEW_COOKIE = 'preview_access'

function needsPreviewAccess(path: string): boolean {
  if (path === '/') return false
  if (path.startsWith('/api/')) return false
  if (path.startsWith('/admin')) return false  // has its own Supabase + email auth guard
  return true
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Gate all non-root page routes behind the preview cookie
  if (needsPreviewAccess(path)) {
    const hasAccess = request.cookies.get(PREVIEW_COOKIE)?.value === '1'
    if (!hasAccess) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
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

  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  const isBusinessRoute = path.startsWith('/business')
  const isCreatorRoute = path.startsWith('/creator')
  const isAuthPage = path === '/login' || path === '/signup'

  // Redirect unauthenticated users away from dashboard routes
  if ((isBusinessRoute || isCreatorRoute) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  if (user) {
    const role = user.user_metadata?.role as string | undefined

    // Redirect logged-in users away from auth pages
    if (isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = role === 'business' ? '/business' : '/creator'
      return NextResponse.redirect(url)
    }

    // Role-guard: wrong dashboard
    if (isBusinessRoute && role !== 'business') {
      const url = request.nextUrl.clone()
      url.pathname = '/creator'
      return NextResponse.redirect(url)
    }
    if (isCreatorRoute && role !== 'creator') {
      const url = request.nextUrl.clone()
      url.pathname = '/business'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)'],
}
