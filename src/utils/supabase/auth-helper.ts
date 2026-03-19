import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    // Create an unmodified response first
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Fetch current user with error resilience (Edge Runtime fetch failures)
    let user = null
    try {
        const { data } = await supabase.auth.getUser()
        user = data.user
    } catch (error) {
        console.error('Supabase getUser fetch error (likely transient network drop):', error)
        user = null
    }

    const { pathname } = request.nextUrl
    const isLoginUrl = pathname.startsWith('/admin')
    const isDashboardAdminUrl = pathname.startsWith('/dashboard/admin')
    const isDashboardPropietarioUrl = pathname.startsWith('/dashboard/propietario')
    const isHomeUrl = pathname === '/'

    const isPropietarioTokenPresent = request.cookies.has('propietario_token')

    // Determine role (We now assume Supabase Auth users are Admins, but we double-check just in case)
    let role = null
    if (user) {
        const { data: profiles, error: profileError } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('auth_user_id', user.id)
            .limit(1)
        
        const rawRole = profiles?.[0]?.rol
        role = rawRole?.toLowerCase() || null

        // Debugging logs
        console.log('--- DEBUG AUTH ---')
        console.log('User ID:', user.id)
        console.log('Profile Role Found:', rawRole, '(Normalized:', role, ')')
        if (profileError) console.error('Profile Error:', profileError.message)
        console.log('------------------')
    }

    const isAdmin = role === 'admin' || role === 'jefe_condominio'

    // 1. Home & Login Pages (Auto-Redirects)
    if (isHomeUrl || isLoginUrl) {
        if (isAdmin) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard/admin'
            return NextResponse.redirect(url)
        }
        if (isPropietarioTokenPresent && isHomeUrl) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard/propietario'
            return NextResponse.redirect(url)
        }
    }

    // 2. Protect Admin Dashboard (Requires Supabase Auth & Admin Role)
    if (isDashboardAdminUrl) {
        const isAdmin = role === 'admin' || role === 'jefe_condominio'
        if (!user || !isAdmin) {
            const url = request.nextUrl.clone()
            url.pathname = '/admin'
            return NextResponse.redirect(url)
        }
    }

    // 3. Protect Propietario Dashboard (Requires only Propietario Cookie)
    if (isDashboardPropietarioUrl) {
        if (!isPropietarioTokenPresent) {
            // Bounce unauthenticated users to the Home page for Cedula Search
            const url = request.nextUrl.clone()
            url.pathname = isAdmin ? '/dashboard/admin' : '/'
            return NextResponse.redirect(url)
        }
    }

    // 4. Base Dashboard bare url router
    if (pathname === '/dashboard') {
        const url = request.nextUrl.clone()
        if (isAdmin) {
            url.pathname = '/dashboard/admin'
        } else if (isPropietarioTokenPresent) {
            url.pathname = '/dashboard/propietario'
        } else {
            url.pathname = '/'
        }
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
