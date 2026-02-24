'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function crearVecinoAction(formData: FormData) {
    try {
        const supabase = await createClient()

        // 1. Validar Admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autorizado' }

        const { data: adminPerfil } = await supabase
            .from('perfiles')
            .select('condominio_id')
            .eq('auth_user_id', user.id)
            .eq('rol', 'admin')
            .single()

        if (!adminPerfil) return { success: false, error: 'Perfil de admin no encontrado' }

        // 2. Extraer datos
        const cedula = formData.get('cedula') as string
        const nombres = formData.get('nombres') as string
        const apellidos = formData.get('apellidos') as string
        const telefono = formData.get('telefono') as string
        const inmuebleId = formData.get('inmueble_id') as string // Opcional al crear

        if (!cedula || !nombres || !apellidos) {
            return { success: false, error: 'Cédula, Nombres y Apellidos son requeridos.' }
        }

        // 3. Obtener el auth_user_id compartido del condominio (buscando un vecino existente)
        const { data: otroVecino } = await supabase
            .from('perfiles')
            .select('auth_user_id')
            .eq('condominio_id', adminPerfil.condominio_id)
            .eq('rol', 'propietario')
            .not('auth_user_id', 'is', null)
            .limit(1)
            .single()

        const sharedAuthId = otroVecino?.auth_user_id || null

        // 4. Crear Perfil
        const { data: nuevoPerfil, error: errorPerfil } = await supabase
            .from('perfiles')
            .insert({
                condominio_id: adminPerfil.condominio_id,
                rol: 'propietario',
                nombres,
                apellidos,
                cedula,
                telefono,
                auth_user_id: sharedAuthId
            })
            .select()
            .single()

        if (errorPerfil) {
            console.error("Error al crear perfil:", errorPerfil)
            return { success: false, error: 'Error al crear el perfil del vecino.' }
        }

        // 5. Vincular con inmueble si se especificó
        if (inmuebleId && nuevoPerfil) {
            const { error: errorInmueble } = await supabase
                .from('inmuebles')
                .update({ propietario_id: nuevoPerfil.id })
                .eq('id', inmuebleId)

            if (errorInmueble) {
                console.error("Error al vincular inmueble:", errorInmueble)
            }
        }

        revalidatePath('/dashboard/admin/vecinos')
        return { success: true }
    } catch (err) {
        return { success: false, error: 'Error inesperado.' }
    }
}

export async function eliminarVecinoAction(perfilId: string) {
    try {
        const supabase = await createClient()

        // 1. Validar Admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autorizado' }

        // 2. Eliminar
        // Nota: El RLS debería proteger esto, pero lo hacemos explícito
        const { error } = await supabase
            .from('perfiles')
            .delete()
            .eq('id', perfilId)
            // No permitimos que un admin se borre a sí mismo desde aquí por error
            .eq('rol', 'propietario')

        if (error) {
            console.error("Error al eliminar vecino:", error)
            return { success: false, error: 'No se pudo eliminar al vecino. Asegúrate de que no tenga registros vinculados bloqueantes.' }
        }

        revalidatePath('/dashboard/admin/vecinos')
        return { success: true }
    } catch (err) {
        return { success: false, error: 'Error inesperado.' }
    }
}

export async function desvincularInmuebleAction(inmuebleId: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('inmuebles')
            .update({ propietario_id: null })
            .eq('id', inmuebleId)

        if (error) {
            console.error("Error al desvincular:", error)
            return { success: false, error: 'Error al desvincular el inmueble.' }
        }

        revalidatePath('/dashboard/admin/vecinos')
        return { success: true }
    } catch (err) {
        return { success: false, error: 'Error inesperado.' }
    }
}

export async function actualizarInmuebleAction(inmuebleId: string, data: { identificador: string }) {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('inmuebles')
            .update({
                identificador: data.identificador
            })
            .eq('id', inmuebleId)

        if (error) {
            console.error("Error al actualizar inmueble:", error)
            return { success: false, error: 'Error al actualizar los datos del inmueble.' }
        }

        revalidatePath('/dashboard/admin/vecinos')
        return { success: true }
    } catch (err) {
        return { success: false, error: 'Error inesperado.' }
    }
}

export async function crearInmuebleAction(formData: FormData) {
    try {
        const supabase = await createClient()

        // 1. Validar Admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'No autorizado' }

        const { data: adminPerfil } = await supabase
            .from('perfiles')
            .select('condominio_id')
            .eq('auth_user_id', user.id)
            .eq('rol', 'admin')
            .single()

        if (!adminPerfil) return { success: false, error: 'Perfil de admin no encontrado' }

        // 2. Extraer datos
        const identificador = formData.get('identificador') as string

        if (!identificador) {
            return { success: false, error: 'El identificador del inmueble es requerido.' }
        }

        // 3. Crear Inmueble
        const { error } = await supabase
            .from('inmuebles')
            .insert({
                condominio_id: adminPerfil.condominio_id,
                identificador
            })

        if (error) {
            console.error("Error al crear inmueble:", error)
            return { success: false, error: 'Error al registrar el inmueble.' }
        }

        revalidatePath('/dashboard/admin/vecinos')
        return { success: true }
    } catch (err) {
        return { success: false, error: 'Error inesperado.' }
    }
}
