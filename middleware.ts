import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 環境変数がない場合は、公開ページ以外へのアクセスをブロック
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Middleware Supabase env missing', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
    })

    // 公開ページは許可
    if (
      request.nextUrl.pathname === '/' ||
      request.nextUrl.pathname.startsWith('/api/')
    ) {
      return NextResponse.next()
    }

    return NextResponse.json(
      { error: 'Server configuration error: Missing Supabase environment variables' },
      { status: 500 }
    )
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // セッションをリフレッシュ
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 公開ページ（LP）
  if (pathname === '/') {
    return supabaseResponse
  }

  // /org/:org_slug/* ルートの処理
  const orgRouteMatch = pathname.match(/^\/org\/([^/]+)(\/.*)?$/)
  if (orgRouteMatch) {
    const organizationSlug = orgRouteMatch[1]
    const subPath = orgRouteMatch[2] || ''

    // ログインページ
    if (subPath === '/login' || subPath === '') {
      // 既にログインしている場合はダッシュボードにリダイレクト
      if (user) {
        // ユーザーがこの organization にアクセス権限があるか確認
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseAdmin = createClient(
          supabaseUrl,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        )

        // organization の存在確認
        const { data: org } = await supabaseAdmin
          .from('organizations')
          .select('id')
          .eq('organization_slug', organizationSlug)
          .single()

        if (org) {
          // メンバーかどうか確認
          const { data: member } = await supabaseAdmin
            .from('members')
            .select('id')
            .eq('user_id', user.id)
            .eq('organization_id', org.id)
            .single()

          if (member) {
            return NextResponse.redirect(
              new URL(`/org/${organizationSlug}/dashboard`, request.url)
            )
          }
        }
      }
      return supabaseResponse
    }

    // 認証が必要なページ
    if (!user) {
      return NextResponse.redirect(
        new URL(`/org/${organizationSlug}/login`, request.url)
      )
    }

    // ユーザーがこの organization にアクセス権限があるか確認
    // 最適化: 1回のJOINクエリでorganizationとmemberを確認
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // organization の存在確認とmemberの確認を1回のクエリで実行
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('organization_slug', organizationSlug)
      .single()

    if (!org) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // メンバーかどうか確認（organization_idが分かっているので直接クエリ）
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', org.id)
      .single()

    if (!member) {
      return NextResponse.redirect(
        new URL(`/org/${organizationSlug}/login`, request.url)
      )
    }

    return supabaseResponse
  }

  // その他のルート（/admin/* など、後方互換性のため）
  if (pathname.startsWith('/admin')) {
    // /admin/login は除外
    if (pathname === '/admin/login') {
      // 既にログインしている場合はダッシュボードにリダイレクト
      if (user) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
      return supabaseResponse
    }

    // ログインしていない場合はログインページにリダイレクト
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    return supabaseResponse
  }

  // その他の公開APIなど
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
