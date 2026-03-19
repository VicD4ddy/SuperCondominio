'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Creamos un helper para el cliente admin local de esta acción
function getAdminContent() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function marcarNotificacionLeidaAction(id: string) {
    const supabaseAdmin = getAdminContent()

    const { error } = await supabaseAdmin
        .from('notificaciones')
        .update({ leida: true })
        .eq('id', id)

    if (error) {
        console.error("Error al marcar notificación como leída", error)
        return { success: false, error: 'Hubo un error de base de datos.' }
    }

    revalidatePath('/', 'layout') // Nuclear invalidation specifically for Next.js browser back-button cache
    revalidatePath('/dashboard/propietario', 'page')

    return { success: true }
}

export async function eliminarNotificacionAction(id: string) {
    const supabaseAdmin = getAdminContent()

    const { error } = await supabaseAdmin
        .from('notificaciones')
        .delete()
        .eq('id', id)

    if (error) {
        console.error("Error al eliminar notificación", error)
        return { success: false, error: 'Hubo un error al eliminarla.' }
    }

    revalidatePath('/', 'layout') // Nuclear invalidation specifically for Next.js browser back-button cache
    revalidatePath('/dashboard/propietario', 'page')

    return { success: true }
}

export async function marcarTodasLeidasAction(perfil_id: string | null = null) {
    const supabaseAdmin = getAdminContent()

    let query = supabaseAdmin
        .from('notificaciones')
        .update({ leida: true })
        .eq('leida', false)

    if (perfil_id) {
        query = query.eq('perfil_id', perfil_id)
    } else {
        query = query.is('perfil_id', null)
    }

    const { error } = await query

    if (error) {
        return { success: false, error: 'Hubo un error de base de datos.' }
    }

    revalidatePath('/', 'layout') // Nuclear invalidation specifically for Next.js browser back-button cache
    revalidatePath('/dashboard/propietario', 'page')

    return { success: true }
}
