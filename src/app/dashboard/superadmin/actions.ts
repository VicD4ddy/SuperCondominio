'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

/**
 * Registra un evento en la bitácora del sistema.
 */
async function recordLog(evento: string, detalles: any) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Obtener el ID del perfil para la relación de FK
        const { data: perfil } = await supabase
            .from('perfiles')
            .select('id')
            .eq('auth_user_id', user.id)
            .single()

        await supabase.from('logs_sistema').insert({
            evento,
            detalles,
            perfil_id: perfil?.id
        })
    } catch (err) {
        console.error('Error recording system log:', err)
    }
}

/**
 * Inicia la impersonación de un condominio por parte de un Superadmin.
 * Guarda el ID del condominio en una cookie segura.
 */
export async function impersonateCondo(condoId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No autenticado')

    // Verificar que el usuario realmente es superadmin antes de permitir esto
    const { data: profile } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('auth_user_id', user.id)
        .single()

    if (profile?.rol !== 'superadmin') {
        throw new Error('Permisos insuficientes para impersonar')
    }

    // Registrar Log
    await recordLog('Gestión de Condominio (Impersonación)', {
        condominio_id: condoId,
        accion: 'inicio_sesion_impersonada'
    })

    const cookieStore = await cookies()
    cookieStore.set('impersonated_condo_id', condoId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    })

    // Redirigir al dashboard de admin normal, el middleware hará el resto
    redirect('/dashboard/admin')
}

/**
 * Detiene la impersonación actual.
 */
export async function stopImpersonation() {
    await recordLog('Fin de Gestión (Impersonación)', {
        accion: 'cerrar_sesion_impersonada'
    })

    const cookieStore = await cookies()
    cookieStore.delete('impersonated_condo_id')
    redirect('/dashboard/superadmin/condominios')
}
/**
 * Crea un nuevo condominio en el sistema.
 */
export async function createCondo(formData: FormData) {
    const nombre = formData.get('nombre') as string
    const rif = formData.get('rif') as string
    const direccion = formData.get('direccion') as string

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No autenticado')

    // Seguridad
    const { data: profile } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('auth_user_id', user.id)
        .single()

    if (profile?.rol !== 'superadmin') {
        throw new Error('Solo el superadmin puede crear condominios')
    }

    const { error } = await supabase
        .from('condominios')
        .insert([{ nombre, rif, direccion }])

    if (error) {
        console.error('Error al crear condominio:', error)
        return { error: 'Error al crear el condominio: ' + error.message }
    }

    // Registrar Log
    await recordLog('Creación de Condominio', { nombre, rif })

    revalidatePath('/dashboard/superadmin/condominios')
    redirect('/dashboard/superadmin/condominios')
}

/**
 * Actualiza los datos de un condominio existente.
 */
export async function updateCondo(condoId: string, formData: FormData) {
    const nombre = formData.get('nombre') as string
    const rif = formData.get('rif') as string
    const direccion = formData.get('direccion') as string

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No autenticado')

    // Seguridad
    const { data: profile } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('auth_user_id', user.id)
        .single()

    if (profile?.rol !== 'superadmin') {
        throw new Error('Solo el superadmin puede editar condominios')
    }

    const { error } = await supabase
        .from('condominios')
        .update({ nombre, rif, direccion })
        .eq('id', condoId)

    if (error) {
        console.error('Error al actualizar condominio:', error)
        return { error: 'Error al actualizar el condominio: ' + error.message }
    }

    // Registrar Log
    await recordLog('Actualización de Condominio', { condoId, nombre, rif })

    revalidatePath('/dashboard/superadmin/condominios')
    return { success: true }
}
