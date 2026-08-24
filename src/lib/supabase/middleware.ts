import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublic =
    pathname === '/' ||                    // public portfolio landing
    pathname.startsWith('/work') ||        // public project pages
    pathname.startsWith('/personal') ||    // private entry (shows login when signed out)
    pathname.startsWith('/api/') ||
    pathname === '/robots.txt' ||
    pathname === '/manifest.webmanifest'

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/personal'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
