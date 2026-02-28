import { createClient } from './server'
import { cookies } from 'next/headers'

/**
 * Obtiene el perfil administrativo "efectivo". 
 * Si un Superadmin está impersonando un condominio, retorna un perfil sintético.
 * Si no, retorna el perfil real del Admin.
 */
export async function getAdminProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { user: null, profile: null }

    const cookieStore = await cookies()
    const impersonatedCondoId = cookieStore.get('impersonated_condo_id')?.value

    if (impersonatedCondoId) {
        // --- FLUJO SUPERADMIN (IMPERSONACIÓN) ---

        // Obtenemos el perfil real del superadmin (para su nombre)
        const { data: superadminProfile } = await supabase
            .from('perfiles')
            .select('*')
            .eq('auth_user_id', user.id)
            .single()

        // Obtenemos la data del condominio impersonado
        const { data: condoData } = await supabase
            .from('condominios')
            .select('*')
            .eq('id', impersonatedCondoId)
            .single()

        if (!condoData) {
            console.error('Condominio impersonado no encontrado:', impersonatedCondoId)
            return { user, profile: null }
        }

        return {
            user,
            profile: {
                ...superadminProfile,
                condominio_id: impersonatedCondoId,
                rol: 'admin', // Forzamos rol admin para compatibilidad de UI
                condominios: condoData
            }
        }
    }

    // --- FLUJO ADMIN NORMAL ---
    const { data: profile } = await supabase
        .from('perfiles')
        .select('*, condominios(*)')
        .eq('auth_user_id', user.id)
        .eq('rol', 'admin')
        .single()

    return { user, profile }
}
