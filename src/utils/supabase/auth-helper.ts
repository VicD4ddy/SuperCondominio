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

    // Fetch current user
    const { data: { user } } = await supabase.auth.getUser()

    const isLoginUrl = request.nextUrl.pathname.startsWith('/login')
    const isDashboardUrl = request.nextUrl.pathname.startsWith('/dashboard')
    const isHomeUrl = request.nextUrl.pathname === '/'

    // Redirect unauthenticated users to login if trying to access dashboard
    if (!user && isDashboardUrl) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // If authenticated, check role and route appropriately
    if (user) {
        // Fetch role from profile
        const { data: profiles, error: profileError } = await supabase
            .from('perfiles')
            .select('rol, condominio_id')
            .or(`auth_user_id.eq.${user.id},id.eq.${user.id}`)
            .limit(1)

        const role = profiles?.[0]?.rol
        const isImpersonating = request.cookies.has('impersonated_condo_id')

        // Debugging logs (Check your terminal)
        console.log('--- DEBUG AUTH ---')
        console.log('User ID:', user.id)
        console.log('Profile Role Found:', role)
        console.log('Impersonating:', isImpersonating)
        if (profileError) console.error('Profile Error:', profileError.message)
        console.log('------------------')

        const isPropietarioTokenPresent = request.cookies.has('propietario_token')
        const isValidarUrl = request.nextUrl.pathname.startsWith('/dashboard/propietario/validar')

        // SAFETY FIX: If user is authenticated but no profile/role exists, don't loop.
        // Redirect to a safe state (validar) if we are in a dashboard area.
        if (!role && isDashboardUrl) {
            console.error("Auth Loop Prevention: Unrecognized role for user", user.id);
            if (!isValidarUrl) {
                const url = request.nextUrl.clone()
                url.pathname = '/dashboard/propietario/validar'
                return NextResponse.redirect(url)
            }
            return supabaseResponse
        }

        // If logged in and on login/home page, redirect to correct dashboard
        if (isLoginUrl || isHomeUrl) {
            const url = request.nextUrl.clone()
            if (role === 'superadmin') {
                url.pathname = isImpersonating ? '/dashboard/admin' : '/dashboard/superadmin'
            } else if (role === 'admin') {
                url.pathname = '/dashboard/admin'
            } else {
                url.pathname = isPropietarioTokenPresent ? '/dashboard/propietario' : '/dashboard/propietario/validar'
            }
            return NextResponse.redirect(url)
        }

        // Role Guarding for Dashboard Superadmin
        if (request.nextUrl.pathname.startsWith('/dashboard/superadmin') && role !== 'superadmin') {
            const url = request.nextUrl.clone()
            url.pathname = role === 'admin' ? '/dashboard/admin' : '/dashboard/propietario'
            return NextResponse.redirect(url)
        }

        // Role Guarding for Dashboard Admin
        // Special Case: Allow Superadmins if they are impersonating
        if (request.nextUrl.pathname.startsWith('/dashboard/admin')) {
            if (role === 'superadmin' && isImpersonating) {
                // Allow through
            } else if (role !== 'admin') {
                const url = request.nextUrl.clone()
                url.pathname = role === 'superadmin' ? '/dashboard/superadmin' : '/dashboard/propietario'
                return NextResponse.redirect(url)
            }
        }

        // Role Guarding for Dashboard Propietario
        if (request.nextUrl.pathname.startsWith('/dashboard/propietario') && role !== 'propietario') {
            const url = request.nextUrl.clone()
            url.pathname = role === 'superadmin' ? '/dashboard/superadmin' : '/dashboard/admin'
            return NextResponse.redirect(url)
        }

        // Two-Step Guarding: Propietario must have chosen their Cedula if not on the validar page
        if (role === 'propietario' && !isPropietarioTokenPresent && !isValidarUrl && request.nextUrl.pathname.startsWith('/dashboard/propietario')) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard/propietario/validar'
            return NextResponse.redirect(url)
        }

        // Redirect Superadmin/Admin AWAY from the validation page if they somehow land there
        if (isValidarUrl && (role === 'superadmin' || role === 'admin')) {
            const url = request.nextUrl.clone()
            url.pathname = role === 'superadmin' ? '/dashboard/superadmin' : '/dashboard/admin'
            return NextResponse.redirect(url)
        }

        // Base dashboard auto-redirect
        if (request.nextUrl.pathname === '/dashboard') {
            const url = request.nextUrl.clone()
            if (role === 'superadmin') url.pathname = isImpersonating ? '/dashboard/admin' : '/dashboard/superadmin'
            else if (role === 'admin') url.pathname = '/dashboard/admin'
            else url.pathname = '/dashboard/propietario'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
