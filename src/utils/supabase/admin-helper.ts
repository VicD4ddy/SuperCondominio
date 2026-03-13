import { createClient } from './server'

/**
 * Obtiene el perfil del Administrador y la configuración global del condominio.
 */
export async function getAdminProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { user: null, profile: null, config: null }

    // Obtenemos el perfil del administrador
    const { data: profile } = await supabase
        .from('perfiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .eq('rol', 'admin')
        .single()

    // Obtenemos la configuración global del condominio (una sola fila)
    const { data: config } = await supabase
        .from('configuracion_global')
        .select('*')
        .limit(1)
        .single()

    // Mapeo retro-compatible temporal para no romper UIs que leen profile.condominios.nombre
    const retroCompatibleProfile = profile ? {
        ...profile,
        condominios: config || null
    } : null;

    return { user, profile: retroCompatibleProfile, config }
}
