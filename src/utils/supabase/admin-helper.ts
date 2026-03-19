import { createClient } from './server'

/**
 * Obtiene el perfil del Administrador y la configuración global del condominio.
 */
export async function getAdminProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { user: null, profile: null, config: null }

    // Obtenemos el perfil por auth_user_id sin filtrar por rol todavía
    // para evitar errores de Postgres Enum con valores no existentes (como jefe_condominio)
    const { data: profiles, error: profileError } = await supabase
        .from('perfiles')
        .select('id, auth_user_id, rol, nombres, apellidos')
        .eq('auth_user_id', user.id)
        .limit(1)

    const rawProfile = profiles?.[0] || null
    
    // Validamos el rol en JS de forma insensible a mayúsculas
    const userRole = rawProfile?.rol?.toLowerCase()
    const isAdmin = userRole === 'admin' || userRole === 'jefe_condominio'
    const profile = isAdmin ? rawProfile : null

    if (profileError) {
        console.error('Error fetching admin profile:', profileError.message)
    }

    // Obtenemos la configuración global del condominio (una sola fila)
    // Usamos columnas explícitas para evitar errores de caché de PostgREST con columnas borradas
    // Incluímos cuentas_bancarias y parametros básicos para que la app global tenga la info correcta
    const { data: configs, error: configError } = await supabase
        .from('configuracion_global')
        .select('id, nombre, cuentas_bancarias, cuota_mensual_usd, dia_cobro, anuncio_tablon, carta_residencia_url')
        .limit(1)

    const config = configs?.[0] || null

    if (configError) {
        console.error('Error fetching condo config:', configError.message)
    }

    // Mapeo retro-compatible temporal
    const retroCompatibleProfile = profile ? {
        ...profile,
        condominios: config || null
    } : null;

    if (!profile && rawProfile) {
        console.warn(`User ${user.id} has role '${rawProfile.rol}', which is not authorized for Admin zones.`);
    } else if (!profile) {
        console.warn(`No profile found for user ${user.id}.`);
    }

    return { user, profile: retroCompatibleProfile, config }
}
